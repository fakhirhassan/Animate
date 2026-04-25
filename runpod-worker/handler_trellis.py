"""
RunPod Serverless Worker — Microsoft TRELLIS (image-to-3D)

Single image → textured 3D mesh (GLB with PBR materials).
TRELLIS produces a unified Structured LATent (SLAT) then decodes to a mesh.

Pipeline:
  1. rembg strips background
  2. TrellisImageTo3DPipeline → SLAT → mesh + gaussians
  3. Export textured .glb

Env:
  HY3D_MODEL_PATH override not used — TRELLIS model ID is fixed.
  Cache is redirected to /runpod-volume so cold starts are warm after first run.
"""

import base64
import io
import os
import tempfile

# Redirect caches onto the network volume BEFORE importing torch/trellis.
_VOL = "/runpod-volume" if os.path.exists("/runpod-volume") else "/tmp"
CACHE_DIR = f"{_VOL}/models"
os.makedirs(CACHE_DIR, exist_ok=True)
os.environ.setdefault("HF_HOME", f"{_VOL}/hf")
os.environ.setdefault("HUGGINGFACE_HUB_CACHE", f"{_VOL}/hf/hub")
os.environ.setdefault("TRANSFORMERS_CACHE", f"{_VOL}/hf/transformers")
# TRELLIS attention + sparse-conv backends (set by Dockerfile too, but be explicit)
os.environ.setdefault("ATTN_BACKEND", "xformers")
os.environ.setdefault("SPCONV_ALGO", "native")

import runpod
import torch

# cuDNN fails to initialize on this CUDA 12.4 image against host driver CUDA 12.8
# (CUDNN_STATUS_NOT_INITIALIZED on first conv). TRELLIS doesn't need cuDNN —
# attention is xformers, sparse ops are spconv. Disable cuDNN to dodge the bad load.
torch.backends.cudnn.enabled = False


def _purge_old_caches():
    """Wipe leftover caches from previous workers (Hunyuan3D, partial TRELLIS).
    Frees space on the 20GB network volume."""
    import shutil
    junk_paths = [
        f"{_VOL}/hf/hub/models--tencent--Hunyuan3D-2",
        f"{_VOL}/hy3dgen",
        f"{_VOL}/models/tencent",
        # Wipe any incomplete HF downloads (.incomplete files block re-fetch)
    ]
    for path in junk_paths:
        if os.path.exists(path):
            print(f"Purging old cache: {path}")
            shutil.rmtree(path, ignore_errors=True)
    # Sweep stale .incomplete fragments under hf hub
    hub = f"{_VOL}/hf/hub"
    if os.path.isdir(hub):
        for root, _, files in os.walk(hub):
            for fn in files:
                if fn.endswith(".incomplete"):
                    try:
                        os.unlink(os.path.join(root, fn))
                        print(f"Removed incomplete: {fn}")
                    except OSError:
                        pass


_purge_old_caches()

PIPE = None
RMBG_SESSION = None

TRELLIS_MODEL_ID = os.environ.get("TRELLIS_MODEL_ID", "microsoft/TRELLIS-image-large")


def _nuke_trellis_cache():
    """Remove half-downloaded TRELLIS snapshots so the next from_pretrained()
    re-fetches cleanly. Called on corrupt-cache errors."""
    import shutil
    safe_id = TRELLIS_MODEL_ID.replace("/", "--")
    for path in [
        f"{_VOL}/hf/hub/models--{safe_id}",
        f"{CACHE_DIR}/{safe_id}",
    ]:
        if os.path.exists(path):
            print(f"Nuking corrupted cache: {path}")
            shutil.rmtree(path, ignore_errors=True)


def load_pipe():
    """Load TRELLIS image-to-3D pipeline. Self-heals on corrupt cache."""
    global PIPE
    if PIPE is not None:
        return PIPE

    from trellis.pipelines import TrellisImageTo3DPipeline

    def _build():
        print(f"Loading TRELLIS pipeline ({TRELLIS_MODEL_ID})...")
        pipe = TrellisImageTo3DPipeline.from_pretrained(TRELLIS_MODEL_ID)
        pipe.cuda()
        return pipe

    try:
        PIPE = _build()
    except Exception as e:
        msg = str(e)
        if any(token in msg.lower() for token in ("something wrong while loading", "no such file", "corrupt", "incomplete")):
            print(f"Pipeline load failed ({msg}); clearing cache and retrying once...")
            _nuke_trellis_cache()
            PIPE = _build()
        else:
            raise
    print("TRELLIS pipeline loaded on CUDA.")
    return PIPE


def load_rembg():
    global RMBG_SESSION
    if RMBG_SESSION is None:
        import rembg
        RMBG_SESSION = rembg.new_session()
    return RMBG_SESSION


def _preprocess_image(image, remove_bg: bool):
    """Background removal + tight crop + square pad. Matches the preprocessing
    TRELLIS's reference demo applies (centered subject on transparent square)."""
    from PIL import Image
    import rembg

    if remove_bg:
        print("Removing background...")
        image = rembg.remove(image, session=load_rembg())
        bbox = image.getbbox()
        if bbox is None:
            raise RuntimeError(
                "Background removal produced an empty image — subject blends "
                "into background. Use an image with a clearer subject."
            )
        cropped = image.crop(bbox)
        cw, ch = cropped.size
        if cw < 32 or ch < 32:
            raise RuntimeError(
                f"Background-removed subject too small ({cw}x{ch}). "
                "Use a clearer, centered subject."
            )
        # 5% margin, square canvas — TRELLIS prefers this framing.
        side = int(max(cw, ch) * 1.05)
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        canvas.paste(cropped, ((side - cw) // 2, (side - ch) // 2))
        image = canvas

    return image


def handle_image_to_3d(job_input):
    """Single-image-to-3D using TRELLIS."""
    from PIL import Image

    image_b64 = job_input["image_base64"]
    if image_b64.startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]

    output_format = job_input.get("output_format", "glb").lower()
    remove_bg = job_input.get("remove_bg", True)
    # TRELLIS sampler params — defaults match the reference demo.
    ss_steps = job_input.get("sparse_structure_steps", 12)
    ss_cfg = job_input.get("sparse_structure_cfg", 7.5)
    slat_steps = job_input.get("slat_steps", 12)
    slat_cfg = job_input.get("slat_cfg", 3.0)
    seed = job_input.get("seed", 42)
    # Mesh simplification — higher = fewer polys, faster downloads, still solid quality.
    simplify = float(job_input.get("simplify", 0.95))
    texture_size = int(job_input.get("texture_size", 1024))

    image = Image.open(io.BytesIO(base64.b64decode(image_b64))).convert("RGBA")
    print(f"Input image size: {image.size}")
    image = _preprocess_image(image, remove_bg=remove_bg)
    print(f"Preprocessed size: {image.size}")

    pipe = load_pipe()

    print(
        f"TRELLIS run: ss_steps={ss_steps}, ss_cfg={ss_cfg}, "
        f"slat_steps={slat_steps}, slat_cfg={slat_cfg}, seed={seed}"
    )
    # Note: torch.no_grad() instead of inference_mode() — the gaussian rasterizer
    # used during GLB texture baking is an autograd.Function, which rejects
    # inference tensors. no_grad gives the same memory savings without that issue.
    with torch.no_grad():
        outputs = pipe.run(
            image,
            seed=seed,
            sparse_structure_sampler_params={
                "steps": ss_steps,
                "cfg_strength": ss_cfg,
            },
            slat_sampler_params={
                "steps": slat_steps,
                "cfg_strength": slat_cfg,
            },
        )

    # Postprocess → GLB with baked textures.
    from trellis.utils import postprocessing_utils

    suffix = ".glb" if output_format == "glb" else ".obj"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        out_path = f.name

    if output_format == "glb":
        print(f"Baking textures + exporting GLB (texture_size={texture_size}, simplify={simplify})...")
        glb = postprocessing_utils.to_glb(
            outputs["gaussian"][0],
            outputs["mesh"][0],
            simplify=simplify,
            texture_size=texture_size,
        )
        glb.export(out_path)
        mesh_obj = glb
    else:
        print("Exporting OBJ (geometry only, no PBR textures)...")
        mesh = outputs["mesh"][0]
        mesh.export(out_path)
        mesh_obj = mesh

    with open(out_path, "rb") as mf:
        model_b64 = base64.b64encode(mf.read()).decode()
    try:
        os.unlink(out_path)
    except OSError:
        pass

    # Don't use `or []` here — `vertices` is a numpy array, and `array or x`
    # triggers "truth value of an array is ambiguous". Just guard against None.
    verts = getattr(mesh_obj, "vertices", None)
    faces = getattr(mesh_obj, "faces", None)
    vertex_count = int(len(verts)) if verts is not None else 0
    face_count = int(len(faces)) if faces is not None else 0

    return {
        "model_base64": model_b64,
        "format": output_format,
        "vertex_count": vertex_count,
        "face_count": face_count,
        "textured": output_format == "glb",
        "status": "success",
    }


def handler(job):
    job_input = job["input"]
    task = job_input.get("task", "image_to_3d")

    try:
        if task == "image_to_3d":
            return handle_image_to_3d(job_input)
        return {"error": f"Unknown task: {task}", "status": "failed"}
    except Exception as e:
        import traceback
        print(f"Error: {e}\n{traceback.format_exc()}")
        return {"error": str(e), "status": "failed"}


runpod.serverless.start({"handler": handler})

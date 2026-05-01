"""
RunPod Serverless Worker — Mesh GPU Worker
Handles text-to-video (Wan2.1) and text-to-image (SDXL) generation.
Models are cached on Network Volume (/runpod-volume/) for fast subsequent starts.
"""

import base64
import os
import tempfile

import runpod
import torch
from huggingface_hub import snapshot_download

# Cache dir: use RunPod network volume if available, else /tmp
CACHE_DIR = "/runpod-volume/models" if os.path.exists("/runpod-volume") else "/tmp/models"
os.makedirs(CACHE_DIR, exist_ok=True)

T2V_PIPE = None
T2I_PIPE = None
TRIPOSR_MODEL = None
RMBG_SESSION = None


def download_model(repo_id, local_name):
    """Use baked-in model if available, otherwise download to cache."""
    # Check baked-in path first (from Docker build)
    baked_path = f"/models/{local_name}"
    if os.path.exists(baked_path) and len(os.listdir(baked_path)) > 3:
        print(f"Model baked in: {baked_path}")
        return baked_path
    # Fallback to cache dir
    local_path = os.path.join(CACHE_DIR, local_name)
    if os.path.exists(local_path) and len(os.listdir(local_path)) > 3:
        print(f"Model cached: {local_path}")
        return local_path
    print(f"Downloading {repo_id} to {local_path}...")
    snapshot_download(repo_id, local_dir=local_path)
    print(f"Downloaded: {local_path}")
    return local_path


def load_t2v():
    """Load Wan2.1-T2V-1.3B pipeline."""
    global T2V_PIPE
    if T2V_PIPE is not None:
        return T2V_PIPE

    from diffusers import WanPipeline, AutoencoderKLWan

    model_path = download_model("Wan-AI/Wan2.2-TI2V-5B-Diffusers", "wan22-ti2v-5b")

    print(f"Loading Wan2.2 TI2V-5B pipeline...")
    vae = AutoencoderKLWan.from_pretrained(
        model_path, subfolder="vae", torch_dtype=torch.float32
    )
    T2V_PIPE = WanPipeline.from_pretrained(
        model_path, vae=vae, torch_dtype=torch.float16
    )
    T2V_PIPE.enable_model_cpu_offload()
    if hasattr(T2V_PIPE.vae, 'enable_tiling'):
        T2V_PIPE.vae.enable_tiling()
    print("Wan2.2 TI2V-5B loaded on CUDA.")
    return T2V_PIPE


def load_t2i():
    """Load SDXL text-to-image pipeline."""
    global T2I_PIPE
    if T2I_PIPE is not None:
        return T2I_PIPE

    from diffusers import StableDiffusionXLPipeline

    model_path = download_model(
        "stabilityai/stable-diffusion-xl-base-1.0", "sdxl-base"
    )

    print(f"Loading SDXL pipeline...")
    T2I_PIPE = StableDiffusionXLPipeline.from_pretrained(
        model_path, torch_dtype=torch.float16, variant="fp16"
    )
    T2I_PIPE.enable_model_cpu_offload()
    print("SDXL T2I loaded on CUDA.")
    return T2I_PIPE


def handle_t2v(job_input):
    """Text-to-video generation."""
    pipe = load_t2v()

    prompt = job_input["prompt"]
    num_frames = job_input.get("num_frames", 81)
    steps = job_input.get("num_inference_steps", 25)
    fps = job_input.get("fps", 16)
    height = job_input.get("height", 480)
    width = job_input.get("width", 832)
    seed = job_input.get("seed")

    generator = None
    if seed is not None:
        generator = torch.Generator(device="cpu").manual_seed(seed)

    print(f"T2V: {width}x{height}, {num_frames}f, {steps} steps — '{prompt[:60]}'")
    output = pipe(
        prompt=prompt,
        num_frames=num_frames,
        num_inference_steps=steps,
        height=height,
        width=width,
        guidance_scale=5.0,
        generator=generator,
    )

    from diffusers.utils import export_to_video

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        export_to_video(output.frames[0], f.name, fps=fps)
        with open(f.name, "rb") as vf:
            video_b64 = base64.b64encode(vf.read()).decode()
        os.unlink(f.name)

    return {
        "video_base64": video_b64,
        "duration": round(num_frames / fps, 2),
        "resolution": f"{width}x{height}",
        "status": "success",
    }


def handle_t2i(job_input):
    """Text-to-image generation."""
    pipe = load_t2i()

    prompt = job_input["prompt"]
    width = job_input.get("width", 1024)
    height = job_input.get("height", 1024)
    steps = job_input.get("num_inference_steps", 25)
    seed = job_input.get("seed")

    generator = None
    if seed is not None:
        generator = torch.Generator(device="cpu").manual_seed(seed)

    print(f"T2I: {width}x{height}, {steps} steps — '{prompt[:60]}'")
    output = pipe(
        prompt=prompt,
        width=width,
        height=height,
        num_inference_steps=steps,
        generator=generator,
    )

    import io
    buf = io.BytesIO()
    output.images[0].save(buf, format="PNG")
    image_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "image_base64": image_b64,
        "resolution": f"{width}x{height}",
        "status": "success",
    }


def load_triposr():
    """Load TripoSR model for single-image-to-3D generation."""
    global TRIPOSR_MODEL, RMBG_SESSION
    if TRIPOSR_MODEL is not None:
        return TRIPOSR_MODEL

    from tsr.system import TSR
    import rembg

    model_path = download_model("stabilityai/TripoSR", "triposr")

    print("Loading TripoSR model...")
    TRIPOSR_MODEL = TSR.from_pretrained(
        model_path,
        config_name="config.yaml",
        weight_name="model.ckpt",
    )
    TRIPOSR_MODEL.renderer.set_chunk_size(8192)
    TRIPOSR_MODEL.to("cuda")
    RMBG_SESSION = rembg.new_session()
    print("TripoSR loaded on CUDA.")
    return TRIPOSR_MODEL


def handle_image_to_3d(job_input):
    """Single-image-to-3D mesh generation using TripoSR."""
    import io
    from PIL import Image
    import numpy as np
    import rembg

    model = load_triposr()

    image_b64 = job_input["image_base64"]
    if image_b64.startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]
    mc_resolution = job_input.get("mc_resolution", 256)
    output_format = job_input.get("output_format", "glb").lower()
    remove_bg = job_input.get("remove_bg", True)
    foreground_ratio = job_input.get("foreground_ratio", 0.85)

    image = Image.open(io.BytesIO(base64.b64decode(image_b64))).convert("RGBA")

    if remove_bg:
        print("Removing background...")
        image = rembg.remove(image, session=RMBG_SESSION)

    # Center foreground on gray background (TripoSR convention)
    arr = np.array(image).astype(np.float32) / 255.0
    if arr.shape[-1] == 4:
        rgb = arr[..., :3] * arr[..., 3:4] + (1 - arr[..., 3:4]) * 0.5
        image = Image.fromarray((rgb * 255).astype(np.uint8))
    else:
        image = image.convert("RGB")

    print(f"TripoSR: mc_resolution={mc_resolution}, format={output_format}")
    with torch.no_grad():
        scene_codes = model([image], device="cuda")
        meshes = model.extract_mesh(
            scene_codes,
            has_vertex_color=True,
            resolution=mc_resolution,
        )

    mesh = meshes[0]

    suffix = ".glb" if output_format == "glb" else ".obj"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        mesh.export(f.name)
        with open(f.name, "rb") as mf:
            model_b64 = base64.b64encode(mf.read()).decode()
        os.unlink(f.name)

    return {
        "model_base64": model_b64,
        "format": output_format,
        "vertex_count": int(len(mesh.vertices)),
        "face_count": int(len(mesh.faces)),
        "status": "success",
    }


def handler(job):
    """Main RunPod handler — routes to T2V or T2I based on task."""
    job_input = job["input"]
    task = job_input.get("task", "text_to_video")

    try:
        if task == "text_to_video":
            return handle_t2v(job_input)
        elif task == "text_to_image":
            return handle_t2i(job_input)
        elif task == "image_to_3d":
            return handle_image_to_3d(job_input)
        else:
            return {"error": f"Unknown task: {task}", "status": "failed"}
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e), "status": "failed"}


runpod.serverless.start({"handler": handler})

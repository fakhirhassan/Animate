"""
Wan Video Generator
Text-to-video generation using Wan2.1-1.3B via HuggingFace Diffusers.
Supports Apple Silicon (MPS) and CUDA.
Prepared for Wan2.2-TI2V-5B (T2V + I2V) when downloaded.
"""

import gc
import logging
import os
import uuid
from typing import Dict, Any, Optional

import torch

logger = logging.getLogger(__name__)

# Base directory for locally downloaded models (via ModelScope)
# Models live at project root: Mesh/models/Wan-AI/...
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
_MODELS_DIR = os.path.join(_PROJECT_ROOT, "models")

# Model paths — check local first, fallback to HuggingFace hub ID
T2V_MODEL_LOCAL = os.path.join(_MODELS_DIR, "Wan-AI", "Wan2.1-T2V-1.3B-Diffusers")
T2V_MODEL_HF = "Wan-AI/Wan2.1-T2V-1.3B-Diffusers"

TI2V_MODEL_LOCAL = os.path.join(_MODELS_DIR, "Wan-AI", "Wan2.2-TI2V-5B")
TI2V_MODEL_HF = "Wan-AI/Wan2.2-TI2V-5B"


def _resolve_model_path(local_path: str, hf_id: str) -> str:
    """Use local model if it exists, otherwise fall back to HuggingFace ID."""
    if os.path.isdir(local_path):
        logger.info(f"Using local model: {local_path}")
        return local_path
    logger.info(f"Local model not found at {local_path}, using HuggingFace: {hf_id}")
    return hf_id


class WanVideoGenerator:
    """Generates videos from text prompts using Wan2.1-1.3B."""

    def __init__(self, output_dir: str = "uploads/output/videos"):
        self.output_dir = output_dir
        self._t2v_pipeline = None
        self._available = None
        os.makedirs(output_dir, exist_ok=True)
        logger.info("WanVideoGenerator initialized")

    def is_available(self) -> bool:
        """Check if GPU acceleration is available (MPS or CUDA)."""
        if self._available is not None:
            return self._available

        try:
            has_cuda = torch.cuda.is_available()
            has_mps = hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()
            self._available = has_cuda or has_mps
            if self._available:
                device = "CUDA" if has_cuda else "MPS"
                logger.info(f"GPU available: {device}")
            else:
                logger.warning("No GPU available. Wan2.1 requires GPU acceleration.")
            return self._available
        except Exception as e:
            logger.error(f"Error checking GPU availability: {e}")
            self._available = False
            return False

    def _get_device_and_dtype(self):
        """Get the best available device and dtype."""
        if torch.cuda.is_available():
            return "cuda", torch.float16
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return "mps", torch.float32
        return "cpu", torch.float32

    def _load_t2v_pipeline(self):
        """Load the text-to-video pipeline (lazy loading)."""
        if self._t2v_pipeline is not None:
            return

        model_path = _resolve_model_path(T2V_MODEL_LOCAL, T2V_MODEL_HF)
        logger.info(f"Loading Wan2.1 T2V pipeline from {model_path}...")
        from diffusers import WanPipeline, AutoencoderKLWan

        device, dtype = self._get_device_and_dtype()

        # VAE must be loaded in float32 for MPS stability
        vae = AutoencoderKLWan.from_pretrained(
            model_path, subfolder="vae", torch_dtype=torch.float32
        )

        self._t2v_pipeline = WanPipeline.from_pretrained(
            model_path,
            vae=vae,
            torch_dtype=dtype,
        )

        if device == "cuda":
            self._t2v_pipeline.enable_model_cpu_offload()
        else:
            self._t2v_pipeline = self._t2v_pipeline.to(device)

        self._t2v_pipeline.vae.enable_tiling()
        logger.info(f"Wan2.1 T2V pipeline loaded on {device}")

    def unload(self):
        """Unload all pipelines to free memory."""
        if self._t2v_pipeline is not None:
            del self._t2v_pipeline
            self._t2v_pipeline = None
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        logger.info("Wan2.1 pipelines unloaded")

    def generate_from_text(
        self,
        prompt: str,
        num_frames: int = 81,
        num_inference_steps: int = 30,
        fps: int = 16,
        height: int = 480,
        width: int = 832,
        guidance_scale: float = 5.0,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generate a video from a text prompt.

        Args:
            prompt: Text description of the video
            num_frames: Number of frames (33 = ~2s at 16fps, 81 = ~5s)
            num_inference_steps: Denoising steps (more = better quality)
            fps: Frames per second
            height: Video height
            width: Video width
            guidance_scale: Prompt adherence strength
            seed: Random seed for reproducibility

        Returns:
            Dict with video_url, filename, duration, etc.
        """
        self._load_t2v_pipeline()

        generator = None
        if seed is not None:
            generator = torch.Generator(device="cpu").manual_seed(seed)

        logger.info(
            f"Generating T2V: prompt='{prompt[:80]}...', "
            f"frames={num_frames}, steps={num_inference_steps}"
        )

        output = self._t2v_pipeline(
            prompt=prompt,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
            height=height,
            width=width,
            guidance_scale=guidance_scale,
            generator=generator,
        )

        return self._save_video(output, prompt, num_frames, fps, width, height)

    def _save_video(self, output, prompt, num_frames, fps, width=832, height=480) -> Dict[str, Any]:
        """Save generated video frames to an MP4 file."""
        from diffusers.utils import export_to_video

        video_frames = output.frames[0]

        video_id = str(uuid.uuid4())[:8]
        filename = f"video_{video_id}.mp4"
        filepath = os.path.join(self.output_dir, filename)

        export_to_video(video_frames, filepath, fps=fps)

        duration = num_frames / fps
        video_url = f"/uploads/output/videos/{filename}"

        logger.info(f"Video saved: {filepath} ({duration:.1f}s, {num_frames} frames)")

        return {
            "video_id": video_id,
            "video_url": video_url,
            "filename": filename,
            "filepath": filepath,
            "duration": round(duration, 2),
            "num_frames": num_frames,
            "fps": fps,
            "resolution": f"{width}x{height}",
            "prompt": prompt,
        }

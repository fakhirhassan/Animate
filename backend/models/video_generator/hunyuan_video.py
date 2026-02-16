"""
HunyuanVideo 1.5 Text-to-Video Generator
Uses the HuggingFace Diffusers pipeline to generate videos from text prompts.
"""

import gc
import logging
import os
import uuid
from typing import Dict, Any, Optional

import torch

logger = logging.getLogger(__name__)

MODEL_ID = "hunyuanvideo-community/HunyuanVideo-1.5-Diffusers-480p_t2v"


class HunyuanVideoGenerator:
    """Generates videos from text prompts using HunyuanVideo 1.5."""

    def __init__(self, output_dir: str = "uploads/output/videos"):
        self.output_dir = output_dir
        self._pipeline = None
        self._available = None
        os.makedirs(output_dir, exist_ok=True)
        logger.info("HunyuanVideoGenerator initialized")

    def is_available(self) -> bool:
        """Check if the model can be loaded (CUDA available or CPU fallback)."""
        if self._available is not None:
            return self._available

        try:
            has_cuda = torch.cuda.is_available()
            has_mps = torch.backends.mps.is_available() if hasattr(torch.backends, 'mps') else False
            self._available = has_cuda or has_mps
            if not self._available:
                logger.warning(
                    "No GPU available (CUDA or MPS). "
                    "HunyuanVideo 1.5 requires GPU acceleration."
                )
            else:
                device = "CUDA" if has_cuda else "MPS"
                logger.info(f"GPU available: {device}")
            return self._available
        except Exception as e:
            logger.error(f"Error checking GPU availability: {e}")
            self._available = False
            return False

    def _get_device_and_dtype(self):
        """Get the best available device and dtype."""
        if torch.cuda.is_available():
            return "cuda", torch.bfloat16
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            # MPS doesn't support bfloat16, use float16
            return "mps", torch.float16
        else:
            return "cpu", torch.float32

    def _load_pipeline(self):
        """Load the HunyuanVideo pipeline (lazy loading)."""
        if self._pipeline is not None:
            return

        logger.info(f"Loading HunyuanVideo 1.5 pipeline from {MODEL_ID}...")
        from diffusers import HunyuanVideoPipeline

        device, dtype = self._get_device_and_dtype()

        self._pipeline = HunyuanVideoPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=dtype,
        )

        # Enable memory optimizations
        if device == "cuda":
            self._pipeline.enable_model_cpu_offload()
            self._pipeline.vae.enable_tiling()
            logger.info("Enabled CUDA model CPU offloading and VAE tiling")
        elif device == "mps":
            self._pipeline = self._pipeline.to("mps")
            self._pipeline.vae.enable_tiling()
            logger.info("Moved pipeline to MPS with VAE tiling")
        else:
            logger.warning("Running on CPU - this will be very slow")

        logger.info("HunyuanVideo 1.5 pipeline loaded successfully")

    def unload(self):
        """Unload the pipeline to free memory."""
        if self._pipeline is not None:
            del self._pipeline
            self._pipeline = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("HunyuanVideo pipeline unloaded")

    def generate(
        self,
        prompt: str,
        num_frames: int = 61,
        num_inference_steps: int = 30,
        fps: int = 15,
        height: int = 480,
        width: int = 848,
        guidance_scale: float = 6.0,
        seed: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generate a video from a text prompt.

        Args:
            prompt: Text description of the video to generate
            num_frames: Number of frames (more = longer video). 61 frames = ~4s at 15fps
            num_inference_steps: Denoising steps (more = better quality, slower)
            fps: Frames per second for the output video
            height: Video height in pixels
            width: Video width in pixels
            guidance_scale: How closely to follow the prompt (higher = more faithful)
            seed: Random seed for reproducibility

        Returns:
            Dict with video_url, filename, duration, etc.
        """
        self._load_pipeline()

        device, _ = self._get_device_and_dtype()
        generator = None
        if seed is not None:
            generator = torch.Generator(device="cpu").manual_seed(seed)

        logger.info(
            f"Generating video: prompt='{prompt[:80]}...', "
            f"frames={num_frames}, steps={num_inference_steps}, "
            f"resolution={width}x{height}, fps={fps}"
        )

        output = self._pipeline(
            prompt=prompt,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
            height=height,
            width=width,
            guidance_scale=guidance_scale,
            generator=generator,
        )

        video_frames = output.frames[0]

        # Save video
        video_id = str(uuid.uuid4())[:8]
        filename = f"video_{video_id}.mp4"
        filepath = os.path.join(self.output_dir, filename)

        from diffusers.utils import export_to_video
        export_to_video(video_frames, filepath, fps=fps)

        duration = num_frames / fps
        video_url = f"/uploads/output/videos/{filename}"

        logger.info(f"Video generated: {filepath} ({duration:.1f}s, {num_frames} frames)")

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

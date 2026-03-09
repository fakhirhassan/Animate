"""
Video Generation Service
Wraps the Wan2.1 generator for use by API routes.
Currently supports T2V only. I2V will be added when Wan2.2-TI2V-5B is downloaded.
"""

import logging
from typing import Dict, Any, Optional

from models.video_generator.wan_video import WanVideoGenerator

logger = logging.getLogger(__name__)

_generator: Optional[WanVideoGenerator] = None


def get_generator() -> WanVideoGenerator:
    """Get or create the video generator singleton."""
    global _generator
    if _generator is None:
        _generator = WanVideoGenerator()
    return _generator


def check_availability() -> Dict[str, Any]:
    """Check if the video generator is available."""
    generator = get_generator()
    available = generator.is_available()
    return {
        "available": available,
        "model": "Wan2.1-T2V-1.3B",
        "message": "Ready" if available else "No GPU available (requires CUDA or MPS)",
    }


def generate_video_from_text(
    prompt: str,
    num_frames: int = 33,
    num_inference_steps: int = 30,
    fps: int = 16,
    height: int = 480,
    width: int = 832,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """Generate a video from a text prompt using Wan2.1."""
    generator = get_generator()
    result = generator.generate_from_text(
        prompt=prompt,
        num_frames=num_frames,
        num_inference_steps=num_inference_steps,
        fps=fps,
        height=height,
        width=width,
        seed=seed,
    )
    logger.info(f"T2V generated: {result['video_url']} ({result['duration']}s)")
    return result


def unload_model():
    """Unload the model to free memory."""
    global _generator
    if _generator is not None:
        _generator.unload()
        logger.info("Video generator model unloaded")

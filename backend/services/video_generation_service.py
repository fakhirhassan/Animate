"""
Video Generation Service
Wraps the HunyuanVideo generator for use by API routes.
"""

import logging
from typing import Dict, Any, Optional

from models.video_generator.hunyuan_video import HunyuanVideoGenerator

logger = logging.getLogger(__name__)

# Singleton instance
_generator: Optional[HunyuanVideoGenerator] = None


def get_generator() -> HunyuanVideoGenerator:
    """Get or create the video generator singleton."""
    global _generator
    if _generator is None:
        _generator = HunyuanVideoGenerator()
    return _generator


def check_availability() -> Dict[str, Any]:
    """Check if the video generator is available."""
    generator = get_generator()
    available = generator.is_available()
    return {
        "available": available,
        "model": "HunyuanVideo 1.5 (480p)",
        "message": "Ready" if available else "No GPU available (requires CUDA or MPS)",
    }


def generate_video(
    prompt: str,
    num_frames: int = 61,
    num_inference_steps: int = 30,
    fps: int = 15,
    height: int = 480,
    width: int = 848,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generate a video from a text prompt.

    Args:
        prompt: Text description of the video
        num_frames: Number of frames to generate
        num_inference_steps: Quality steps (more = better but slower)
        fps: Output frames per second
        height: Video height
        width: Video width
        seed: Random seed for reproducibility

    Returns:
        Dict with video URL and metadata
    """
    generator = get_generator()
    result = generator.generate(
        prompt=prompt,
        num_frames=num_frames,
        num_inference_steps=num_inference_steps,
        fps=fps,
        height=height,
        width=width,
        seed=seed,
    )
    logger.info(f"Video generated: {result['video_url']} ({result['duration']}s)")
    return result


def unload_model():
    """Unload the model to free memory."""
    global _generator
    if _generator is not None:
        _generator.unload()
        logger.info("Video generator model unloaded")

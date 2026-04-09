"""
Video Generation Service
Routes video generation to local GPU or RunPod cloud based on config.
Supports T2V via Wan2.1. I2V will be added when Wan2.2-TI2V-5B is available.
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

_generator = None


def _use_cloud() -> bool:
    """Check if we should use cloud GPU for video generation."""
    from services.cloud_gpu_service import should_use_cloud
    return should_use_cloud()


def get_generator():
    """Get or create the local video generator singleton."""
    global _generator
    if _generator is None:
        from models.video_generator.wan_video import WanVideoGenerator
        _generator = WanVideoGenerator()
    return _generator


def check_availability() -> Dict[str, Any]:
    """Check if video generation is available (local or cloud)."""
    from services.cloud_gpu_service import is_cloud_configured, check_cloud_status

    if is_cloud_configured():
        cloud_status = check_cloud_status()
        return {
            "available": True,
            "model": "Wan2.1-T2V-1.3B",
            "mode": "cloud",
            "message": "Cloud GPU (RunPod) ready" if cloud_status["available"] else cloud_status["message"],
            "cloud": cloud_status,
        }

    generator = get_generator()
    available = generator.is_available()
    return {
        "available": available,
        "model": "Wan2.1-T2V-1.3B",
        "mode": "local",
        "message": "Ready (local GPU)" if available else "No GPU available (requires CUDA or MPS)",
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
    """Generate a video from text — routes to cloud or local GPU automatically."""

    if _use_cloud():
        logger.info(f"Routing T2V to cloud GPU: '{prompt[:60]}...'")
        from services.cloud_gpu_service import generate_video_cloud
        return generate_video_cloud(
            prompt=prompt,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
            fps=fps,
            height=height,
            width=width,
            seed=seed,
        )

    logger.info(f"Using local GPU for T2V: '{prompt[:60]}...'")
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
    result["source"] = "local"
    logger.info(f"T2V generated: {result['video_url']} ({result['duration']}s)")
    return result


def unload_model():
    """Unload the local model to free memory."""
    global _generator
    if _generator is not None:
        _generator.unload()
        logger.info("Video generator model unloaded")

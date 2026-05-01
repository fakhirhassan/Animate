"""
Image Generation Service
Text-to-image generation via RunPod cloud GPU (Flux/SDXL).
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


def check_availability() -> Dict[str, Any]:
    """Check if text-to-image is available."""
    from services.cloud_gpu_service import is_cloud_configured, check_cloud_status
    if not is_cloud_configured():
        return {
            "available": False,
            "model": "Flux.1-dev / SDXL",
            "message": "Cloud GPU not configured. Set RUNPOD_API_KEY in .env",
        }
    status = check_cloud_status()
    return {
        "available": status["available"],
        "model": "Flux.1-dev / SDXL",
        "message": "Ready (cloud GPU)" if status["available"] else status["message"],
    }


def generate_image(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    num_inference_steps: int = 25,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """Generate an image from a text prompt."""
    from services.cloud_gpu_service import generate_image_cloud
    logger.info(f"Generating image: '{prompt[:60]}...'")
    return generate_image_cloud(
        prompt=prompt,
        width=width,
        height=height,
        num_inference_steps=num_inference_steps,
        seed=seed,
    )

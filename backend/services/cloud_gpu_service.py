"""
Cloud GPU Service — RunPod Serverless Integration
Routes GPU-heavy work (video gen, image gen) to RunPod when local GPU is unavailable.
Falls back to local GPU when available (auto mode).
"""

import base64
import logging
import os
import time
import uuid
from typing import Dict, Any, Optional

import requests

logger = logging.getLogger(__name__)

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(_BACKEND_DIR, "uploads", "output", "videos")
IMAGE_OUTPUT_DIR = os.path.join(_BACKEND_DIR, "uploads", "output", "images")


def _get_api_key():
    return os.getenv("RUNPOD_API_KEY", "")

def _get_endpoint_id():
    return os.getenv("RUNPOD_ENDPOINT_ID", "")

def _get_t2i_endpoint_id():
    return os.getenv("RUNPOD_T2I_ENDPOINT_ID", "")

def _get_gpu_mode():
    return os.getenv("GPU_MODE", "auto")


def is_cloud_configured() -> bool:
    """Check if RunPod cloud GPU is configured."""
    return bool(_get_api_key() and (_get_endpoint_id() or _get_t2i_endpoint_id()))


def should_use_cloud() -> bool:
    """Decide whether to use cloud GPU based on GPU_MODE setting."""
    mode = _get_gpu_mode()
    if mode == "cloud":
        return True
    if mode == "local":
        return False
    # auto mode: use cloud if configured and local GPU is weak/unavailable
    if not is_cloud_configured():
        return False
    try:
        import torch
        if torch.cuda.is_available():
            vram = torch.cuda.get_device_properties(0).total_mem / (1024**3)
            if vram >= 20:  # 20GB+ VRAM = use local
                return False
        # MPS (Mac) or weak GPU = use cloud
        return True
    except Exception:
        return True


def _runpod_request(endpoint_id: str, payload: dict, timeout: int = 600) -> dict:
    """Submit a job to RunPod and poll for result."""
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("RUNPOD_API_KEY not set. Add it to backend/.env")
    if not endpoint_id:
        raise RuntimeError("RunPod endpoint ID not configured")

    base_url = f"https://api.runpod.ai/v2/{endpoint_id}"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    # Submit job (async)
    resp = requests.post(f"{base_url}/run", headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    job_data = resp.json()
    job_id = job_data["id"]
    logger.info(f"RunPod job submitted: {job_id}")

    # Poll for result
    start = time.time()
    while time.time() - start < timeout:
        status_resp = requests.get(f"{base_url}/status/{job_id}", headers=headers, timeout=15)
        status_resp.raise_for_status()
        data = status_resp.json()
        status = data.get("status")

        if status == "COMPLETED":
            logger.info(f"RunPod job {job_id} completed in {time.time()-start:.1f}s")
            return data.get("output", {})
        elif status == "FAILED":
            error = data.get("error", "Unknown error")
            logger.error(f"RunPod job {job_id} failed: {error}")
            raise RuntimeError(f"Cloud GPU failed: {error}")

        time.sleep(3)

    raise RuntimeError(f"Cloud GPU timed out after {timeout}s")


def generate_video_cloud(
    prompt: str,
    num_frames: int = 81,
    num_inference_steps: int = 25,
    fps: int = 16,
    height: int = 832,
    width: int = 480,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generate video using RunPod cloud GPU.
    Pipeline: SDXL (generate image from prompt) → Wan2.2 I2V (animate the image)
    """
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Step 1: Generate image from text prompt using SDXL endpoint
    logger.info(f"Cloud T2V Step 1: Generating image from prompt...")
    t2i_endpoint = _get_t2i_endpoint_id()
    if not t2i_endpoint:
        raise RuntimeError("T2I endpoint not configured — needed for video pipeline")

    image_payload = {
        "input": {
            "prompt": prompt,
            "negative_prompt": "blurry, low quality, deformed, ugly, text, watermark",
            "width": width,
            "height": height,
            "num_inference_steps": 25,
            "guidance_scale": 7.5,
            "num_images": 1,
        }
    }
    if seed is not None:
        image_payload["input"]["seed"] = seed

    image_result = _runpod_request(t2i_endpoint, image_payload, timeout=120)

    # Extract base64 image
    image_data = image_result.get("image_url") or image_result.get("image_base64")
    if not image_data and image_result.get("images"):
        image_data = image_result["images"][0]
    if not image_data:
        raise RuntimeError("Failed to generate image for video pipeline")

    # Strip data URI prefix if present
    if isinstance(image_data, str) and image_data.startswith("data:"):
        image_b64 = image_data.split(",", 1)[1]
    else:
        image_b64 = image_data

    logger.info(f"Cloud T2V Step 2: Animating image with Wan2.2...")

    # Step 2: Send image to Wan2.2 I2V endpoint for animation
    video_endpoint = _get_endpoint_id()
    video_payload = {
        "input": {
            "prompt": prompt,
            "image_base64": image_b64,
            "width": width,
            "height": height,
            "length": num_frames,
            "steps": min(num_inference_steps, 30),
            "cfg": 2.0,
            "seed": seed or 42,
        }
    }

    result = _runpod_request(video_endpoint, video_payload, timeout=1800)

    # Extract video — could be base64 string or dict with video field
    video_b64 = None
    if isinstance(result, dict):
        video_b64 = result.get("video_base64") or result.get("video") or result.get("output")
    elif isinstance(result, str):
        video_b64 = result

    # Strip data URI prefix if present
    if isinstance(video_b64, str) and video_b64.startswith("data:"):
        video_b64 = video_b64.split(",", 1)[1]

    if not video_b64:
        raise RuntimeError(f"Cloud GPU returned unexpected video format: {str(result)[:200]}")

    video_id = str(uuid.uuid4())[:8]
    filename = f"video_{video_id}.mp4"
    filepath = os.path.join(OUTPUT_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(base64.b64decode(video_b64))

    duration = num_frames / fps
    logger.info(f"Cloud video saved: {filepath} ({duration:.1f}s)")

    return {
        "video_id": video_id,
        "video_url": f"/uploads/output/videos/{filename}",
        "filename": filename,
        "filepath": filepath,
        "duration": round(duration, 2),
        "num_frames": num_frames,
        "fps": fps,
        "resolution": f"{width}x{height}",
        "prompt": prompt,
        "source": "cloud",
    }


def generate_image_cloud(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    num_inference_steps: int = 25,
    seed: Optional[int] = None,
) -> Dict[str, Any]:
    """Generate image using RunPod cloud GPU (SDXL worker)."""
    os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)

    endpoint = _get_t2i_endpoint_id() or _get_endpoint_id()

    # RunPod official SDXL worker format
    input_payload = {
        "prompt": prompt,
        "negative_prompt": "blurry, low quality, deformed, ugly, text, watermark",
        "width": width,
        "height": height,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": 7.5,
        "num_images": 1,
    }
    if seed is not None:
        input_payload["seed"] = seed

    payload = {"input": input_payload}

    result = _runpod_request(endpoint, payload, timeout=120)

    # SDXL worker returns: {"image_url": "data:image/png;base64,...", "images": [...], "seed": N}
    image_data = None
    if isinstance(result, dict):
        image_data = result.get("image_url") or result.get("image_base64") or result.get("output")
        if not image_data and result.get("images"):
            image_data = result["images"][0]
    elif isinstance(result, str):
        image_data = result

    if not image_data:
        raise RuntimeError(f"Cloud GPU returned unexpected format: {str(result)[:200]}")

    # Strip data URI prefix if present (e.g., "data:image/png;base64,...")
    if isinstance(image_data, str) and image_data.startswith("data:"):
        image_b64 = image_data.split(",", 1)[1]
    else:
        image_b64 = image_data

    image_id = str(uuid.uuid4())[:8]
    filename = f"image_{image_id}.png"
    filepath = os.path.join(IMAGE_OUTPUT_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(base64.b64decode(image_b64))

    logger.info(f"Cloud image saved: {filepath}")

    return {
        "image_id": image_id,
        "image_url": f"/uploads/output/images/{filename}",
        "filename": filename,
        "filepath": filepath,
        "resolution": f"{width}x{height}",
        "prompt": prompt,
        "source": "cloud",
    }


def check_cloud_status() -> Dict[str, Any]:
    """Check if cloud GPU is configured and reachable."""
    configured = is_cloud_configured()
    if not configured:
        return {
            "available": False,
            "message": "RunPod not configured. Set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID in .env",
        }

    try:
        ep = _get_t2i_endpoint_id() or _get_endpoint_id()
        base_url = f"https://api.runpod.ai/v2/{ep}"
        headers = {"Authorization": f"Bearer {_get_api_key()}"}
        resp = requests.get(f"{base_url}/health", headers=headers, timeout=10)
        health = resp.json()
        workers = health.get("workers", {})
        return {
            "available": True,
            "message": "RunPod cloud GPU ready",
            "workers": workers,
            "t2i_configured": bool(_get_t2i_endpoint_id()),
        }
    except Exception as e:
        return {
            "available": False,
            "message": f"RunPod unreachable: {e}",
        }

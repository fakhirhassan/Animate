"""
Image Generation API Routes
Text-to-image generation using cloud GPU (Flux/SDXL).
"""

import os
import logging
from flask import Blueprint, request

from utils.response_formatter import success_response, error_response
from utils.auth import login_required
from services.conversion_db_service import ConversionDatabaseService

bp = Blueprint('image', __name__)
logger = logging.getLogger(__name__)


_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _file_size_str(rel_url: str) -> str:
    """Compute file size for an /uploads/... URL. Returns '' if not found."""
    try:
        rel = rel_url.lstrip('/')
        full = os.path.join(_BACKEND_DIR, rel)
        if os.path.exists(full):
            size_bytes = os.path.getsize(full)
            return f'{size_bytes / (1024 * 1024):.2f} MB'
    except Exception:
        pass
    return ''


@bp.route('/generate', methods=['POST'])
@login_required
def generate_image():
    """
    Generate an image from a text prompt.

    Request Body (JSON):
        - prompt: Text description of the image
        - width: Image width (default 1024)
        - height: Image height (default 1024)
        - num_inference_steps: Quality steps (default 25)
        - seed: Random seed (optional)
    """
    try:
        data = request.get_json()
        if not data or not data.get('prompt'):
            return error_response('Prompt is required', 400)

        prompt = data['prompt']
        if len(prompt) < 3:
            return error_response('Prompt is too short', 400)

        from services.image_generation_service import generate_image
        result = generate_image(
            prompt=prompt,
            width=data.get('width', 1024),
            height=data.get('height', 1024),
            num_inference_steps=data.get('num_inference_steps', 25),
            seed=data.get('seed'),
        )

        # Persist to DB so the image survives server restarts and shows in
        # Assets / Recents across devices.
        try:
            user_id = getattr(request, 'user_id', None)
            image_url = result.get('image_url') if isinstance(result, dict) else None
            if user_id and image_url:
                db_service = ConversionDatabaseService()
                db_service.save_conversion(user_id, {
                    'type': 'image',
                    'file_name': os.path.basename(image_url) or f'image_{prompt[:20]}.png',
                    'original_image_url': image_url,
                    'model_url': image_url,
                    'thumbnail_url': image_url,
                    'output_format': 'png',
                    'quality': 'medium',
                    'status': 'completed',
                    'file_size': _file_size_str(image_url),
                    'settings': {
                        'prompt': prompt,
                        'width': data.get('width', 1024),
                        'height': data.get('height', 1024),
                        'num_inference_steps': data.get('num_inference_steps', 25),
                        'seed': data.get('seed'),
                    },
                })
        except Exception as db_error:
            logger.error(f'Image DB save failed (non-fatal): {db_error}')

        return success_response(result, 'Image generated successfully')

    except RuntimeError as e:
        logger.error(f'T2I runtime error: {e}')
        return error_response(str(e), 503)
    except Exception as e:
        logger.error(f'T2I error: {e}')
        return error_response(f'Image generation failed: {e}', 500)


@bp.route('/check', methods=['GET'])
def check_generator():
    """Check if image generation is available."""
    try:
        from services.image_generation_service import check_availability
        status = check_availability()
        return success_response(status, 'Image generator status retrieved')
    except Exception as e:
        logger.error(f'Image check error: {e}')
        return error_response('Failed to check image generator', 500)

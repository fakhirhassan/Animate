"""
Image Generation API Routes
Text-to-image generation using cloud GPU (Flux/SDXL).
"""

import logging
from flask import Blueprint, request

from utils.response_formatter import success_response, error_response
from utils.auth import login_required

bp = Blueprint('image', __name__)
logger = logging.getLogger(__name__)


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

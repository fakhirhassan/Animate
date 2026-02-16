"""
Animation Generation API Routes
Handles text-to-video generation using HunyuanVideo 1.5.
"""

import logging
from flask import Blueprint, request

from utils.response_formatter import success_response, error_response

# Create blueprint
bp = Blueprint('animation', __name__)
logger = logging.getLogger(__name__)


@bp.route('/generate', methods=['POST'])
def generate_animation():
    """
    Generate a video from a text prompt using HunyuanVideo 1.5.

    Request Body:
        - prompt: Text description of the video to generate
        - num_frames: Number of frames (default 61, ~4s at 15fps)
        - num_inference_steps: Quality steps (default 30)
        - fps: Frames per second (default 15)
        - height: Video height (default 480)
        - width: Video width (default 848)
        - seed: Random seed (optional)

    Returns:
        Video URL and metadata
    """
    try:
        data = request.get_json()

        if not data:
            return error_response('Request data is required', 400)

        prompt = data.get('prompt') or data.get('script')
        if not prompt:
            return error_response('Prompt is required', 400)

        num_frames = data.get('num_frames', 61)
        num_inference_steps = data.get('num_inference_steps', 30)
        fps = data.get('fps', 15)
        height = data.get('height', 480)
        width = data.get('width', 848)
        seed = data.get('seed')

        from services.video_generation_service import generate_video
        result = generate_video(
            prompt=prompt,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
            fps=fps,
            height=height,
            width=width,
            seed=seed,
        )

        return success_response(result, 'Video generated successfully')

    except RuntimeError as e:
        logger.error(f'Video generation runtime error: {str(e)}')
        return error_response(str(e), 503)
    except Exception as e:
        logger.error(f'Video generation error: {str(e)}')
        return error_response(f'Video generation failed: {str(e)}', 500)


@bp.route('/check', methods=['GET'])
def check_generator():
    """
    Check if the video generator (HunyuanVideo 1.5) is available.

    Returns:
        Availability status and model info
    """
    try:
        from services.video_generation_service import check_availability
        status = check_availability()
        return success_response(status, 'Generator status retrieved')
    except Exception as e:
        logger.error(f'Generator check error: {str(e)}')
        return error_response('Failed to check generator status', 500)


@bp.route('/unload', methods=['POST'])
def unload_model():
    """
    Unload the video model to free GPU memory.

    Returns:
        Success message
    """
    try:
        from services.video_generation_service import unload_model as do_unload
        do_unload()
        return success_response({'message': 'Model unloaded'}, 'Model unloaded successfully')
    except Exception as e:
        logger.error(f'Unload error: {str(e)}')
        return error_response('Failed to unload model', 500)


@bp.route('/styles', methods=['GET'])
def list_animation_styles():
    """List available animation styles."""
    return success_response({
        'styles': [
            {'id': 'default', 'name': 'Default', 'description': 'Clean, modern style'},
            {'id': 'cartoon', 'name': 'Cartoon', 'description': '2D cartoon-like animation'},
            {'id': 'realistic', 'name': 'Realistic', 'description': 'Photorealistic animation'},
            {'id': 'anime', 'name': 'Anime', 'description': 'Japanese anime style'},
        ]
    })


@bp.route('/status/<job_id>', methods=['GET'])
def get_animation_status(job_id):
    """Get the status of an animation job."""
    return success_response({
        'job_id': job_id,
        'status': 'not_found',
        'progress': 0,
        'message': 'Job tracking coming soon'
    })

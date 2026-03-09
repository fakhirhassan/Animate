"""
Animation Generation API Routes
Text-to-video and full animation pipeline using Wan2.1 + Kokoro TTS.
"""

import logging
from flask import Blueprint, request
from PIL import Image

from utils.response_formatter import success_response, error_response

bp = Blueprint('animation', __name__)
logger = logging.getLogger(__name__)


@bp.route('/generate', methods=['POST'])
def generate_full_animation():
    """
    Full animation pipeline: text → scene parse → video + voice → stitched output.

    Request Body (JSON):
        - text: Natural language scene description
        - num_frames_per_segment: Frames per segment (default 33, use 81 for 5s clips)
        - num_inference_steps: Quality steps (default 30)
        - fps: Frames per second (default 16)
        - voice_preset: Kokoro voice preset (default af_heart)
        - num_clips: Number of video clips (default 4, more = longer video)
    """
    try:
        data = request.get_json()
        if not data or not data.get('text'):
            return error_response('Text description is required', 400)

        from services.animation_pipeline_service import generate_animation
        result = generate_animation(
            text=data['text'],
            num_frames_per_segment=data.get('num_frames_per_segment', 33),
            num_inference_steps=data.get('num_inference_steps', 30),
            fps=data.get('fps', 16),
            voice_preset=data.get('voice_preset', 'af_heart'),
            num_clips=data.get('num_clips', 4),
        )

        return success_response(result, 'Animation generated successfully')

    except RuntimeError as e:
        logger.error(f'Pipeline runtime error: {e}')
        return error_response(str(e), 503)
    except Exception as e:
        logger.error(f'Pipeline error: {e}')
        return error_response(f'Animation generation failed: {e}', 500)


@bp.route('/image-animate', methods=['POST'])
def animate_image_with_voice():
    """
    Image-to-animation with optional voice narration.

    Request (multipart/form-data):
        - image: Image file to animate
        - text: Optional narration/dialogue text
        - num_frames: Number of frames (default 33)
        - num_inference_steps: Quality steps (default 30)
        - fps: Frames per second (default 16)
        - voice_preset: Kokoro voice preset (default af_heart)
    """
    try:
        if 'image' not in request.files:
            return error_response('Image file is required', 400)

        image_file = request.files['image']
        if image_file.filename == '':
            return error_response('No image selected', 400)

        image = Image.open(image_file.stream).convert('RGB')
        text = request.form.get('text', '')
        num_frames = int(request.form.get('num_frames', 33))
        num_inference_steps = int(request.form.get('num_inference_steps', 30))
        fps = int(request.form.get('fps', 16))
        voice_preset = request.form.get('voice_preset', 'af_heart')

        from services.animation_pipeline_service import generate_animation_from_image
        result = generate_animation_from_image(
            image=image,
            text=text,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
            fps=fps,
            voice_preset=voice_preset,
        )

        return success_response(result, 'Image animation generated successfully')

    except RuntimeError as e:
        logger.error(f'Image animation runtime error: {e}')
        return error_response(str(e), 503)
    except Exception as e:
        logger.error(f'Image animation error: {e}')
        return error_response(f'Image animation failed: {e}', 500)


@bp.route('/text-to-video', methods=['POST'])
def text_to_video():
    """
    Generate a single video clip from a text prompt.

    Request Body (JSON):
        - prompt: Text description of the video
        - num_frames: Number of frames (default 33, ~2s at 16fps)
        - num_inference_steps: Quality steps (default 30)
        - fps: Frames per second (default 16)
        - height: Video height (default 480)
        - width: Video width (default 832)
        - seed: Random seed (optional)
    """
    try:
        data = request.get_json()
        if not data or not data.get('prompt'):
            return error_response('Prompt is required', 400)

        from services.video_generation_service import generate_video_from_text
        result = generate_video_from_text(
            prompt=data['prompt'],
            num_frames=data.get('num_frames', 33),
            num_inference_steps=data.get('num_inference_steps', 30),
            fps=data.get('fps', 16),
            height=data.get('height', 480),
            width=data.get('width', 832),
            seed=data.get('seed'),
        )

        return success_response(result, 'Video generated successfully')

    except RuntimeError as e:
        logger.error(f'T2V runtime error: {e}')
        return error_response(str(e), 503)
    except Exception as e:
        logger.error(f'T2V error: {e}')
        return error_response(f'Video generation failed: {e}', 500)


@bp.route('/check', methods=['GET'])
def check_generator():
    """Check if the video generator is available."""
    try:
        from services.video_generation_service import check_availability
        status = check_availability()
        return success_response(status, 'Generator status retrieved')
    except Exception as e:
        logger.error(f'Generator check error: {e}')
        return error_response('Failed to check generator status', 500)


@bp.route('/unload', methods=['POST'])
def unload_model():
    """Unload video and voice models to free GPU memory."""
    try:
        from services.video_generation_service import unload_model as unload_video
        from services.voice_generation_service import unload_model as unload_voice
        unload_video()
        unload_voice()
        return success_response({'message': 'Models unloaded'}, 'Models unloaded successfully')
    except Exception as e:
        logger.error(f'Unload error: {e}')
        return error_response('Failed to unload models', 500)

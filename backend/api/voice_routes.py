"""
Voice Generation API Routes
Text-to-speech generation using Kokoro-82M TTS.
"""

import logging
from flask import Blueprint, request

from utils.response_formatter import success_response, error_response

bp = Blueprint('voice', __name__)
logger = logging.getLogger(__name__)


@bp.route('/generate', methods=['POST'])
def generate_voice():
    """
    Generate voice audio from text using Kokoro TTS.

    Request Body:
        - text: Text to convert to speech
        - voice_preset: Kokoro voice ID (default: af_heart)
    """
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return error_response('Text is required', 400)

        text = data['text']
        if len(text) > 5000:
            return error_response('Text exceeds maximum length of 5000 characters', 400)

        voice_preset = data.get('voice_preset', 'af_heart')

        from services.voice_generation_service import generate_speech
        result = generate_speech(text=text, voice_preset=voice_preset)

        return success_response(result, 'Speech generated successfully')

    except RuntimeError as e:
        logger.error(f'TTS runtime error: {e}')
        return error_response(str(e), 503)
    except Exception as e:
        logger.error(f'TTS error: {e}')
        return error_response(f'Voice generation failed: {e}', 500)


@bp.route('/presets', methods=['GET'])
def list_presets():
    """List available Kokoro voice presets."""
    from services.voice_generation_service import get_available_voices
    presets = get_available_voices()
    return success_response({'presets': presets})

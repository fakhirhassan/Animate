"""
Script Processing API Routes
Handles scene parsing via Ollama LLM.
"""

import logging
from flask import Blueprint, request

from utils.response_formatter import success_response, error_response
from utils.auth import login_required

# Create blueprint
bp = Blueprint('script', __name__)
logger = logging.getLogger(__name__)


@bp.route('/analyze', methods=['POST'])
@login_required
def analyze_script():
    """
    Parse a text description into a structured 3D scene.

    Request Body:
        - script: The scene description text

    Returns:
        Structured scene JSON with objects, actions, dialogue, music, camera
    """
    try:
        data = request.get_json()

        if not data or 'script' not in data:
            return error_response('Script text is required', 400)

        script_text = data.get('script')

        if len(script_text) < 10:
            return error_response('Script is too short (min 10 characters)', 400)

        from services.scene_parser_service import parse_scene
        scene_data = parse_scene(script_text)

        return success_response({
            'scene': scene_data,
            'object_count': len(scene_data.get('objects', [])),
            'action_count': len(scene_data.get('actions', [])),
            'duration': scene_data.get('duration', 0),
        }, 'Scene parsed successfully')

    except RuntimeError as e:
        logger.error(f'Scene parser not available: {str(e)}')
        return error_response(str(e), 503)
    except ValueError as e:
        logger.error(f'Failed to parse LLM response: {str(e)}')
        return error_response(f'Failed to parse scene: {str(e)}', 422)
    except Exception as e:
        logger.error(f'Script analysis error: {str(e)}')
        return error_response('Script analysis failed', 500)


@bp.route('/check', methods=['GET'])
def check_parser():
    """
    Check if the scene parser (Ollama) is available.

    Returns:
        Availability status and model info
    """
    try:
        from services.scene_parser_service import check_availability
        status = check_availability()
        return success_response(status, 'Parser status retrieved')
    except Exception as e:
        logger.error(f'Parser check error: {str(e)}')
        return error_response('Failed to check parser status', 500)

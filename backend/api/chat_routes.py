"""
Chat API Routes
Conversational assistant endpoint backed by Ollama (dev) or Groq (prod).
"""

import logging
from flask import Blueprint, request

from utils.response_formatter import success_response, error_response
from utils.auth import login_required

bp = Blueprint('chat', __name__)
logger = logging.getLogger(__name__)


@bp.route('/message', methods=['POST'])
@login_required
def post_message():
    """
    Send a chat message.

    Request Body (JSON):
        - message: str — the user's message (required)
        - history: list[{role, content}] — prior turns (optional)
        - page: str — current frontend route, e.g. '/creator/animate' (optional)
        - mode: 'assistant' | 'refine' (default 'assistant')
    """
    try:
        data = request.get_json(silent=True) or {}
        message = (data.get('message') or '').strip()
        if not message:
            return error_response('Message is required', 400)
        if len(message) > 4000:
            return error_response('Message too long (max 4000 chars)', 400)

        history = data.get('history') or []
        if not isinstance(history, list):
            return error_response('history must be a list', 400)

        mode = data.get('mode', 'assistant')
        if mode not in ('assistant', 'refine'):
            return error_response("mode must be 'assistant' or 'refine'", 400)

        from services.chat_service import chat
        result = chat(
            user_message=message,
            history=history,
            page=data.get('page'),
            mode=mode,
        )
        return success_response(result, 'OK')

    except ValueError as e:
        return error_response(str(e), 400)
    except RuntimeError as e:
        logger.error(f'Chat runtime error: {e}')
        return error_response(str(e), 503)
    except Exception as e:
        logger.error(f'Chat error: {e}')
        return error_response(f'Chat failed: {e}', 500)


@bp.route('/status', methods=['GET'])
def get_chat_status():
    """Report whether the chat backend is reachable."""
    try:
        from services.chat_service import get_status
        return success_response(get_status(), 'OK')
    except Exception as e:
        logger.error(f'Chat status error: {e}')
        return error_response('Failed to check chat status', 500)

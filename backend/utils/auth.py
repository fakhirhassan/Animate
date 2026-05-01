"""
Shared authentication utilities for route protection.
"""

import logging
from functools import wraps
from flask import request, current_app
from utils.response_formatter import error_response

logger = logging.getLogger(__name__)


def get_user_id_from_request():
    """Extract user ID from the Authorization header (Supabase JWT)."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        from supabase_client.supabase_config import get_supabase
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        user_data = user_response.user

        if not user_data:
            return None

        return str(user_data.id)

    except Exception as e:
        logger.error(f'Auth error: {e}')
        return None


def login_required(f):
    """Decorator that requires a valid JWT token. Passes user_id to the route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_user_id_from_request()
        if not user_id:
            return error_response('Authorization required', 401)
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated_function

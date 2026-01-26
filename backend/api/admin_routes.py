"""
Admin API Routes with Supabase Integration
Handles admin-specific operations like user management and system stats.
"""

import logging
from flask import Blueprint, request
from supabase_client.supabase_config import get_supabase
from utils.response_formatter import success_response, error_response
from services.admin_stats_service import AdminStatsService
from functools import wraps

# Create blueprint
bp = Blueprint('admin', __name__)
logger = logging.getLogger(__name__)


def admin_required(f):
    """
    Decorator to ensure only admin users can access certain endpoints.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Get token from header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return error_response('Authorization required', 401)

            token = auth_header.split(' ')[1]
            supabase = get_supabase()

            # Get user from token
            user_response = supabase.auth.get_user(token)
            user_data = user_response.user

            if not user_data:
                return error_response('Invalid or expired token', 401)

            # Check if user is admin
            user_profile = supabase.table('users').select('role').eq('id', user_data.id).execute()

            if not user_profile.data or len(user_profile.data) == 0:
                return error_response('User not found', 404)

            if user_profile.data[0]['role'] != 'admin':
                return error_response('Admin access required', 403)

            return f(*args, **kwargs)

        except Exception as e:
            logger.error(f'Admin auth error: {str(e)}')
            return error_response('Authorization failed', 401)

    return decorated_function


@bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    """
    Get system-wide statistics for admin dashboard.

    Returns:
        System statistics including user counts, project counts, etc.
    """
    try:
        admin_service = AdminStatsService()
        result = admin_service.get_system_stats()

        if not result['success']:
            return error_response(result.get('message', 'Failed to fetch statistics'), 500)

        return success_response(result['data'])

    except Exception as e:
        logger.error(f'Get stats error: {str(e)}')
        return error_response('Failed to fetch statistics', 500)


@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """
    Get all users for admin dashboard.

    Query Parameters:
        - limit: Number of users to return (default: 50)
        - offset: Offset for pagination (default: 0)

    Returns:
        List of all users with their details
    """
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)

        admin_service = AdminStatsService()
        result = admin_service.get_users_list(limit, offset)

        if not result['success']:
            return error_response(result.get('message', 'Failed to fetch users'), 500)

        return success_response(result['data'])

    except Exception as e:
        logger.error(f'Get users error: {str(e)}')
        return error_response('Failed to fetch users', 500)


@bp.route('/users/<user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """
    Update user details (admin only).

    Request Body:
        - name: User's name (optional)
        - role: User's role (optional)
        - is_active: User's active status (optional)

    Returns:
        Updated user information
    """
    try:
        data = request.get_json()

        if not data:
            return error_response('No data provided', 400)

        supabase = get_supabase()

        # Build update object
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'role' in data and data['role'] in ['creator', 'admin']:
            update_data['role'] = data['role']
        if 'is_active' in data:
            update_data['is_active'] = data['is_active']

        if not update_data:
            return error_response('No valid fields to update', 400)

        # Update user
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()

        if not result.data or len(result.data) == 0:
            return error_response('User not found', 404)

        return success_response({
            'user': result.data[0]
        }, 'User updated successfully')

    except Exception as e:
        logger.error(f'Update user error: {str(e)}')
        return error_response('Failed to update user', 500)


@bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """
    Delete a user (admin only).

    Returns:
        Success message
    """
    try:
        supabase = get_supabase()

        # Delete user (cascading deletes will handle related records)
        result = supabase.table('users').delete().eq('id', user_id).execute()

        if not result.data or len(result.data) == 0:
            return error_response('User not found', 404)

        return success_response(None, 'User deleted successfully')

    except Exception as e:
        logger.error(f'Delete user error: {str(e)}')
        return error_response('Failed to delete user', 500)


@bp.route('/analytics/user-growth', methods=['GET'])
@admin_required
def get_user_growth():
    """
    Get user growth data for analytics dashboard.

    Query Parameters:
        - months: Number of months to include (default: 6)

    Returns:
        Monthly user growth data
    """
    try:
        months = request.args.get('months', 6, type=int)

        admin_service = AdminStatsService()
        result = admin_service.get_user_growth_data(months)

        if not result['success']:
            return error_response(result.get('message', 'Failed to fetch user growth data'), 500)

        return success_response(result['data'])

    except Exception as e:
        logger.error(f'Get user growth error: {str(e)}')
        return error_response('Failed to fetch user growth data', 500)


@bp.route('/analytics/conversions', methods=['GET'])
@admin_required
def get_conversion_activity():
    """
    Get conversion activity data for analytics dashboard.

    Query Parameters:
        - days: Number of days to include (default: 7)

    Returns:
        Daily conversion activity data
    """
    try:
        days = request.args.get('days', 7, type=int)

        admin_service = AdminStatsService()
        result = admin_service.get_conversion_activity(days)

        if not result['success']:
            return error_response(result.get('message', 'Failed to fetch conversion activity'), 500)

        return success_response(result['data'])

    except Exception as e:
        logger.error(f'Get conversion activity error: {str(e)}')
        return error_response('Failed to fetch conversion activity', 500)


@bp.route('/activities', methods=['GET'])
@admin_required
def get_recent_activities():
    """
    Get recent system activities for admin dashboard.

    Query Parameters:
        - limit: Maximum number of activities to return (default: 10)

    Returns:
        List of recent activities
    """
    try:
        limit = request.args.get('limit', 10, type=int)

        admin_service = AdminStatsService()
        result = admin_service.get_recent_activities(limit)

        if not result['success']:
            return error_response(result.get('message', 'Failed to fetch recent activities'), 500)

        return success_response(result['data'])

    except Exception as e:
        logger.error(f'Get recent activities error: {str(e)}')
        return error_response('Failed to fetch recent activities', 500)

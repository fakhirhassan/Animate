"""
Admin API Routes with Supabase Integration
Handles admin-specific operations like user management and system stats.
"""

import logging
from flask import Blueprint, request
from supabase_client.supabase_config import get_supabase
from utils.response_formatter import success_response, error_response
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
        supabase = get_supabase()

        # Get total users count
        users_response = supabase.table('users').select('id', count='exact').execute()
        total_users = users_response.count or 0

        # Get active users (users with is_active=true)
        active_users_response = supabase.table('users').select('id', count='exact').eq('is_active', True).execute()
        active_users = active_users_response.count or 0

        # Get total conversions/projects
        conversions_response = supabase.table('conversions').select('id', count='exact').execute()
        total_projects = conversions_response.count or 0

        # Calculate system health (simplified - 100% minus error rate)
        # In production, this would include actual system metrics
        system_health = 98  # Placeholder

        return success_response({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'totalProjects': total_projects,
            'systemHealth': system_health
        })

    except Exception as e:
        logger.error(f'Get stats error: {str(e)}')
        return error_response('Failed to fetch statistics', 500)


@bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """
    Get all users for admin dashboard.

    Query Parameters:
        - limit: Number of users to return (default: 100)
        - offset: Offset for pagination (default: 0)
        - search: Search query for name or email

    Returns:
        List of all users with their details
    """
    try:
        supabase = get_supabase()

        # Get query parameters
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        search = request.args.get('search', '')

        # Build query
        query = supabase.table('users').select('*')

        # Add search filter if provided
        if search:
            query = query.or_(f'name.ilike.%{search}%,email.ilike.%{search}%')

        # Execute query with pagination
        users_response = query.range(offset, offset + limit - 1).execute()

        # Count conversions for each user
        users = []
        for user in users_response.data:
            # Get project count for this user
            conversions_response = supabase.table('conversions').select('id', count='exact').eq('user_id', user['id']).execute()
            project_count = conversions_response.count or 0

            users.append({
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role'],
                'status': 'active' if user.get('is_active', True) else 'inactive',
                'projects': project_count,
                'joinedAt': user['created_at'][:10] if user.get('created_at') else 'N/A'
            })

        return success_response({
            'users': users,
            'total': len(users)
        })

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

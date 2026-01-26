"""
Admin Statistics Service
Handles statistics and analytics for admin dashboard.
"""

import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta
from supabase_client.supabase_config import get_supabase

logger = logging.getLogger(__name__)


class AdminStatsService:
    """Service for admin dashboard statistics and analytics"""

    def __init__(self):
        """Initialize the admin stats service"""
        self.supabase = get_supabase()

    def get_system_stats(self) -> Dict[str, Any]:
        """
        Get overall system statistics.

        Returns:
            Dictionary with system stats
        """
        try:
            # Get total users
            users_response = self.supabase.table('users').select('id', count='exact').execute()
            total_users = len(users_response.data) if users_response.data else 0

            # Get active users (logged in within last 7 days)
            week_ago = (datetime.now() - timedelta(days=7)).isoformat()
            active_users_response = self.supabase.table('users')\
                .select('id', count='exact')\
                .gte('last_login', week_ago)\
                .execute()
            active_users = len(active_users_response.data) if active_users_response.data else 0

            # Get total conversions/projects
            conversions_response = self.supabase.table('conversions').select('id', count='exact').execute()
            total_projects = len(conversions_response.data) if conversions_response.data else 0

            # Calculate system health (simple metric: 100% if all services running)
            system_health = 100  # Can be enhanced with actual health checks

            return {
                'success': True,
                'data': {
                    'totalUsers': total_users,
                    'activeUsers': active_users,
                    'totalProjects': total_projects,
                    'systemHealth': system_health
                }
            }

        except Exception as e:
            logger.error(f'Error fetching system stats: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch system statistics'
            }

    def get_user_growth_data(self, months: int = 6) -> Dict[str, Any]:
        """
        Get user growth data for the last N months.

        Args:
            months: Number of months to include

        Returns:
            Dictionary with monthly user counts
        """
        try:
            growth_data = []
            now = datetime.now()

            for i in range(months - 1, -1, -1):
                # Calculate start and end of month
                target_date = now - timedelta(days=30 * i)
                month_start = target_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

                # Get next month start
                if month_start.month == 12:
                    month_end = month_start.replace(year=month_start.year + 1, month=1)
                else:
                    month_end = month_start.replace(month=month_start.month + 1)

                # Count users created in this month
                response = self.supabase.table('users')\
                    .select('id', count='exact')\
                    .gte('created_at', month_start.isoformat())\
                    .lt('created_at', month_end.isoformat())\
                    .execute()

                count = len(response.data) if response.data else 0

                growth_data.append({
                    'month': month_start.strftime('%b'),
                    'users': count
                })

            return {
                'success': True,
                'data': growth_data
            }

        except Exception as e:
            logger.error(f'Error fetching user growth data: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch user growth data'
            }

    def get_conversion_activity(self, days: int = 7) -> Dict[str, Any]:
        """
        Get daily conversion activity for the last N days.

        Args:
            days: Number of days to include

        Returns:
            Dictionary with daily conversion counts
        """
        try:
            activity_data = []
            now = datetime.now()

            for i in range(days - 1, -1, -1):
                target_date = now - timedelta(days=i)
                day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
                day_end = day_start + timedelta(days=1)

                # Count conversions for this day
                response = self.supabase.table('conversions')\
                    .select('id', count='exact')\
                    .gte('created_at', day_start.isoformat())\
                    .lt('created_at', day_end.isoformat())\
                    .execute()

                count = len(response.data) if response.data else 0

                activity_data.append({
                    'day': day_start.strftime('%a'),
                    'conversions': count
                })

            return {
                'success': True,
                'data': activity_data
            }

        except Exception as e:
            logger.error(f'Error fetching conversion activity: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch conversion activity'
            }

    def get_recent_activities(self, limit: int = 10) -> Dict[str, Any]:
        """
        Get recent system activities.

        Args:
            limit: Maximum number of activities to return

        Returns:
            Dictionary with recent activities
        """
        try:
            activities = []

            # Get recent conversions
            conversions_response = self.supabase.table('conversions')\
                .select('id, user_id, file_name, created_at, users(name)')\
                .order('created_at', desc=True)\
                .limit(limit)\
                .execute()

            if conversions_response.data:
                for conversion in conversions_response.data:
                    user_name = conversion.get('users', {}).get('name', 'Unknown User') if conversion.get('users') else 'Unknown User'
                    time_ago = self._format_time_ago(conversion.get('created_at'))

                    activities.append({
                        'type': 'conversion',
                        'user': user_name,
                        'action': 'converted 2D to 3D',
                        'time': time_ago,
                        'icon': 'FileVideo'
                    })

            # Get recent user signups
            users_response = self.supabase.table('users')\
                .select('id, name, created_at')\
                .order('created_at', desc=True)\
                .limit(5)\
                .execute()

            if users_response.data:
                for user in users_response.data:
                    time_ago = self._format_time_ago(user.get('created_at'))

                    activities.append({
                        'type': 'signup',
                        'user': user.get('name', 'Unknown User'),
                        'action': 'signed up',
                        'time': time_ago,
                        'icon': 'UserPlus'
                    })

            # Sort activities by time and limit
            activities.sort(key=lambda x: x['time'], reverse=False)
            activities = activities[:limit]

            return {
                'success': True,
                'data': activities
            }

        except Exception as e:
            logger.error(f'Error fetching recent activities: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch recent activities'
            }

    def _format_time_ago(self, timestamp_str: str) -> str:
        """
        Format timestamp as 'X min ago', 'X hours ago', etc.

        Args:
            timestamp_str: ISO format timestamp string

        Returns:
            Formatted time ago string
        """
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            now = datetime.now(timestamp.tzinfo)
            diff = now - timestamp

            seconds = diff.total_seconds()
            minutes = seconds / 60
            hours = minutes / 60
            days = hours / 24

            if minutes < 1:
                return 'Just now'
            elif minutes < 60:
                return f'{int(minutes)} min ago'
            elif hours < 24:
                return f'{int(hours)} hours ago'
            elif days < 7:
                return f'{int(days)} days ago'
            else:
                return timestamp.strftime('%b %d, %Y')

        except Exception as e:
            logger.error(f'Error formatting time ago: {str(e)}')
            return 'Unknown'

    def get_users_list(self, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        """
        Get list of users for admin panel.

        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip

        Returns:
            Dictionary with users list
        """
        try:
            # Get users with their project counts
            users_response = self.supabase.table('users')\
                .select('id, email, name, role, created_at, last_login, is_active')\
                .order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()

            if not users_response.data:
                return {
                    'success': True,
                    'data': {'users': [], 'total': 0}
                }

            users_with_stats = []
            for user in users_response.data:
                # Get conversion count for each user
                conversions_response = self.supabase.table('conversions')\
                    .select('id', count='exact')\
                    .eq('user_id', user['id'])\
                    .execute()

                project_count = len(conversions_response.data) if conversions_response.data else 0

                users_with_stats.append({
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role'],
                    'status': 'active' if user.get('is_active', True) else 'inactive',
                    'projects': project_count,
                    'joinedAt': self._format_date(user.get('created_at'))
                })

            # Get total count
            count_response = self.supabase.table('users').select('id', count='exact').execute()
            total = len(count_response.data) if count_response.data else 0

            return {
                'success': True,
                'data': {
                    'users': users_with_stats,
                    'total': total
                }
            }

        except Exception as e:
            logger.error(f'Error fetching users list: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch users list'
            }

    def _format_date(self, timestamp_str: str) -> str:
        """Format ISO timestamp to readable date"""
        try:
            timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            return timestamp.strftime('%Y-%m-%d')
        except:
            return 'N/A'

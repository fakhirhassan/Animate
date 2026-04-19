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

            # Batch-fetch all conversions once, then tally per user
            all_conv = self.supabase.table('conversions').select('user_id').execute()
            project_counts: Dict[str, int] = {}
            for row in (all_conv.data or []):
                uid = row.get('user_id')
                if uid:
                    project_counts[uid] = project_counts.get(uid, 0) + 1

            users_with_stats = []
            for user in users_response.data:
                users_with_stats.append({
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role'],
                    'status': 'active' if user.get('is_active', True) else 'inactive',
                    'projects': project_counts.get(user['id'], 0),
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

    def get_role_distribution(self) -> Dict[str, Any]:
        """Count users by role for donut chart."""
        try:
            res = self.supabase.table('users').select('role').execute()
            counts = {'admin': 0, 'creator': 0}
            for row in (res.data or []):
                r = row.get('role') or 'creator'
                counts[r] = counts.get(r, 0) + 1
            data = [{'name': k.capitalize(), 'value': v} for k, v in counts.items()]
            return {'success': True, 'data': data}
        except Exception as e:
            logger.error(f'Error fetching role distribution: {e}')
            return {'success': False, 'data': [], 'message': str(e)}

    def get_conversion_status_breakdown(self) -> Dict[str, Any]:
        """Count conversions by status for donut chart."""
        try:
            res = self.supabase.table('conversions').select('status').execute()
            counts = {}
            for row in (res.data or []):
                s = (row.get('status') or 'unknown').lower()
                counts[s] = counts.get(s, 0) + 1
            data = [{'name': k.capitalize(), 'value': v} for k, v in counts.items()]
            return {'success': True, 'data': data}
        except Exception as e:
            logger.error(f'Error fetching conversion status: {e}')
            return {'success': False, 'data': [], 'message': str(e)}

    def get_top_creators(self, limit: int = 5) -> Dict[str, Any]:
        """Top users by conversion count — single batch query, no N+1."""
        try:
            # One query: all conversions with embedded user info
            conv_res = self.supabase.table('conversions')\
                .select('user_id, users(id, name, email)')\
                .execute()

            tally: Dict[str, Dict[str, Any]] = {}
            for row in (conv_res.data or []):
                uid = row.get('user_id')
                if not uid:
                    continue
                user = row.get('users') or {}
                if uid not in tally:
                    tally[uid] = {
                        'id': uid,
                        'name': user.get('name') or 'Unknown',
                        'email': user.get('email') or '',
                        'count': 0,
                    }
                tally[uid]['count'] += 1

            ranked = sorted(tally.values(), key=lambda x: x['count'], reverse=True)
            return {'success': True, 'data': ranked[:limit]}
        except Exception as e:
            logger.error(f'Error fetching top creators: {e}')
            return {'success': False, 'data': [], 'message': str(e)}

    def get_hourly_heatmap(self, days: int = 7) -> Dict[str, Any]:
        """Activity heatmap by day-of-week × hour-of-day for last N days."""
        try:
            since = (datetime.now() - timedelta(days=days)).isoformat()
            res = self.supabase.table('conversions')\
                .select('created_at')\
                .gte('created_at', since)\
                .execute()

            day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            grid = {d: {h: 0 for h in range(24)} for d in day_names}

            for row in (res.data or []):
                ts = row.get('created_at')
                if not ts:
                    continue
                try:
                    dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                    dname = day_names[dt.weekday()]
                    grid[dname][dt.hour] += 1
                except Exception:
                    continue

            data = []
            for d in day_names:
                for h in range(24):
                    data.append({'day': d, 'hour': h, 'value': grid[d][h]})
            return {'success': True, 'data': data}
        except Exception as e:
            logger.error(f'Error fetching heatmap: {e}')
            return {'success': False, 'data': [], 'message': str(e)}

    def get_overview_metrics(self) -> Dict[str, Any]:
        """Period-over-period comparison for KPI cards."""
        try:
            now = datetime.now()
            week_ago = (now - timedelta(days=7)).isoformat()
            two_weeks_ago = (now - timedelta(days=14)).isoformat()

            # Users this week vs last week
            users_this = self.supabase.table('users').select('id', count='exact')\
                .gte('created_at', week_ago).execute()
            users_last = self.supabase.table('users').select('id', count='exact')\
                .gte('created_at', two_weeks_ago).lt('created_at', week_ago).execute()

            # Conversions this week vs last week
            conv_this = self.supabase.table('conversions').select('id', count='exact')\
                .gte('created_at', week_ago).execute()
            conv_last = self.supabase.table('conversions').select('id', count='exact')\
                .gte('created_at', two_weeks_ago).lt('created_at', week_ago).execute()

            # Success rate
            all_conv = self.supabase.table('conversions').select('status').execute()
            total = len(all_conv.data or [])
            completed = sum(1 for r in (all_conv.data or []) if (r.get('status') or '').lower() == 'completed')
            success_rate = round((completed / total) * 100, 1) if total > 0 else 0

            def pct_change(cur, prev):
                if prev == 0:
                    return 100 if cur > 0 else 0
                return round(((cur - prev) / prev) * 100, 1)

            uc = len(users_this.data or [])
            ul = len(users_last.data or [])
            cc = len(conv_this.data or [])
            cl = len(conv_last.data or [])

            return {
                'success': True,
                'data': {
                    'newUsersWeek': uc,
                    'newUsersChange': pct_change(uc, ul),
                    'conversionsWeek': cc,
                    'conversionsChange': pct_change(cc, cl),
                    'successRate': success_rate,
                    'totalConversions': total,
                }
            }
        except Exception as e:
            logger.error(f'Error fetching overview metrics: {e}')
            return {'success': False, 'data': {}, 'message': str(e)}

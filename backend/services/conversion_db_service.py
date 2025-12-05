"""
Conversion Database Service
Handles database operations for 2D to 3D conversions.
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from supabase_client.supabase_config import get_supabase

logger = logging.getLogger(__name__)


class ConversionDatabaseService:
    """Service for managing conversions in the database"""

    def __init__(self):
        """Initialize the conversion database service"""
        self.supabase = get_supabase()

    def save_conversion(
        self,
        user_id: str,
        conversion_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Save a conversion to the database.

        Args:
            user_id: User ID who performed the conversion
            conversion_data: Dictionary containing conversion details:
                - file_name: Original filename
                - original_image_url: URL/path to original image
                - model_url: URL/path to generated 3D model
                - thumbnail_url: URL/path to thumbnail (use original_image_url if not provided)
                - output_format: Output format (obj, glb, gltf)
                - quality: Quality setting (low, medium, high)
                - status: Conversion status (completed, failed)
                - file_size: Size of the model file
                - settings: Additional settings as JSON

        Returns:
            Dictionary with success status and conversion data
        """
        try:
            # Prepare conversion record
            conversion_record = {
                'user_id': user_id,
                'file_name': conversion_data.get('file_name', 'unnamed'),
                'original_image_url': conversion_data.get('original_image_url', ''),
                'model_url': conversion_data.get('model_url', ''),
                'thumbnail_url': conversion_data.get('thumbnail_url', conversion_data.get('original_image_url', '')),
                'output_format': conversion_data.get('output_format', 'obj'),
                'quality': conversion_data.get('quality', 'medium'),
                'status': conversion_data.get('status', 'completed'),
                'file_size': conversion_data.get('file_size', ''),
                'settings': conversion_data.get('settings', {})
            }

            # Insert into database
            response = self.supabase.table('conversions').insert(conversion_record).execute()

            logger.info(f'Conversion saved to database for user {user_id}')

            return {
                'success': True,
                'data': response.data[0] if response.data else None,
                'message': 'Conversion saved successfully'
            }

        except Exception as e:
            logger.error(f'Error saving conversion to database: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to save conversion'
            }

    def get_user_conversions(
        self,
        user_id: str,
        limit: int = 10,
        offset: int = 0,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get conversions for a specific user.

        Args:
            user_id: User ID
            limit: Maximum number of records to return
            offset: Number of records to skip (for pagination)
            status: Filter by status (optional)

        Returns:
            Dictionary with conversions list and total count
        """
        try:
            # Build query
            query = self.supabase.table('conversions').select('*').eq('user_id', user_id)

            # Apply status filter if provided
            if status:
                query = query.eq('status', status)

            # Apply ordering, limit, and offset
            query = query.order('created_at', desc=True).range(offset, offset + limit - 1)

            # Execute query
            response = query.execute()

            # Get total count for pagination
            count_response = self.supabase.table('conversions').select('id', count='exact').eq('user_id', user_id)
            if status:
                count_response = count_response.eq('status', status)
            count_result = count_response.execute()

            return {
                'success': True,
                'data': {
                    'conversions': response.data if response.data else [],
                    'total': len(count_result.data) if count_result.data else 0,
                    'limit': limit,
                    'offset': offset
                }
            }

        except Exception as e:
            logger.error(f'Error fetching user conversions: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch conversions'
            }

    def get_conversion_by_id(
        self,
        conversion_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Get a specific conversion by ID.

        Args:
            conversion_id: Conversion ID
            user_id: User ID (for authorization)

        Returns:
            Dictionary with conversion data
        """
        try:
            response = self.supabase.table('conversions')\
                .select('*')\
                .eq('id', conversion_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()

            if not response.data:
                return {
                    'success': False,
                    'error': 'Conversion not found',
                    'message': 'Conversion not found or unauthorized'
                }

            return {
                'success': True,
                'data': response.data
            }

        except Exception as e:
            logger.error(f'Error fetching conversion by ID: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch conversion'
            }

    def delete_conversion(
        self,
        conversion_id: str,
        user_id: str
    ) -> Dict[str, Any]:
        """
        Delete a conversion.

        Args:
            conversion_id: Conversion ID
            user_id: User ID (for authorization)

        Returns:
            Dictionary with success status
        """
        try:
            # Verify ownership before deleting
            check_response = self.supabase.table('conversions')\
                .select('id')\
                .eq('id', conversion_id)\
                .eq('user_id', user_id)\
                .single()\
                .execute()

            if not check_response.data:
                return {
                    'success': False,
                    'error': 'Unauthorized or not found',
                    'message': 'Conversion not found or unauthorized'
                }

            # Delete the conversion
            self.supabase.table('conversions')\
                .delete()\
                .eq('id', conversion_id)\
                .eq('user_id', user_id)\
                .execute()

            logger.info(f'Conversion {conversion_id} deleted by user {user_id}')

            return {
                'success': True,
                'message': 'Conversion deleted successfully'
            }

        except Exception as e:
            logger.error(f'Error deleting conversion: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to delete conversion'
            }

    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """
        Get conversion statistics for a user.

        Args:
            user_id: User ID

        Returns:
            Dictionary with statistics
        """
        try:
            # Get total conversions
            total_response = self.supabase.table('conversions')\
                .select('id', count='exact')\
                .eq('user_id', user_id)\
                .execute()
            total_conversions = len(total_response.data) if total_response.data else 0

            # Get conversions this month
            from datetime import datetime, timedelta
            first_day_of_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

            month_response = self.supabase.table('conversions')\
                .select('id', count='exact')\
                .eq('user_id', user_id)\
                .gte('created_at', first_day_of_month.isoformat())\
                .execute()
            this_month = len(month_response.data) if month_response.data else 0

            # Calculate storage used (rough estimate based on file_size strings)
            storage_response = self.supabase.table('conversions')\
                .select('file_size')\
                .eq('user_id', user_id)\
                .execute()

            total_storage_mb = 0
            if storage_response.data:
                for item in storage_response.data:
                    file_size = item.get('file_size', '')
                    if 'MB' in file_size:
                        try:
                            total_storage_mb += float(file_size.replace(' MB', '').strip())
                        except:
                            pass
                    elif 'KB' in file_size:
                        try:
                            total_storage_mb += float(file_size.replace(' KB', '').strip()) / 1024
                        except:
                            pass

            return {
                'success': True,
                'data': {
                    'total_conversions': total_conversions,
                    'this_month': this_month,
                    'storage_used_gb': round(total_storage_mb / 1024, 2),
                    'storage_used_mb': round(total_storage_mb, 2)
                }
            }

        except Exception as e:
            logger.error(f'Error fetching user stats: {str(e)}')
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch user statistics'
            }

    def get_all_conversions_count(self) -> int:
        """
        Get total count of all conversions (for admin dashboard).

        Returns:
            Total number of conversions
        """
        try:
            response = self.supabase.table('conversions').select('id', count='exact').execute()
            return len(response.data) if response.data else 0
        except Exception as e:
            logger.error(f'Error getting conversions count: {str(e)}')
            return 0

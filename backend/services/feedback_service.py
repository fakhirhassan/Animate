"""
Feedback & Ratings service.

Handles persistence and aggregation for the feedback / ratings tables.
Uses the service-role Supabase client (bypasses RLS) — all access control
is enforced at the route layer via @login_required / @admin_required.
"""

import logging
from typing import Optional
from supabase_client.supabase_config import get_supabase

logger = logging.getLogger(__name__)

VALID_FEATURES = {'t2v', 't2i', '2d-to-3d', 'tts', 'video-edit'}
VALID_CATEGORIES = {'bug', 'suggestion', 'praise', 'other'}
VALID_STATUSES = {'new', 'read', 'resolved'}


class FeedbackService:
    def __init__(self):
        self.sb = get_supabase()

    # ---------- ratings ----------

    def create_rating(
        self,
        user_id: str,
        feature_type: str,
        rating: int,
        conversion_id: Optional[str] = None,
        comment: Optional[str] = None,
    ) -> dict:
        if feature_type not in VALID_FEATURES:
            return {'success': False, 'message': f'Invalid feature_type: {feature_type}'}
        if not isinstance(rating, int) or not (1 <= rating <= 5):
            return {'success': False, 'message': 'Rating must be an integer 1-5'}

        payload = {
            'user_id': user_id,
            'feature_type': feature_type,
            'rating': rating,
        }
        if conversion_id:
            payload['conversion_id'] = conversion_id
        if comment:
            payload['comment'] = comment[:2000]

        try:
            res = self.sb.table('ratings').insert(payload).execute()
            return {'success': True, 'data': (res.data or [{}])[0]}
        except Exception as e:
            logger.error(f'create_rating failed: {e}')
            return {'success': False, 'message': str(e)}

    def list_ratings_for_user(self, user_id: str, limit: int = 50) -> dict:
        try:
            res = (
                self.sb.table('ratings')
                .select('*')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .limit(limit)
                .execute()
            )
            return {'success': True, 'data': res.data or []}
        except Exception as e:
            logger.error(f'list_ratings_for_user failed: {e}')
            return {'success': False, 'message': str(e)}

    def list_ratings_admin(
        self,
        limit: int = 50,
        offset: int = 0,
        feature_type: Optional[str] = None,
        min_rating: Optional[int] = None,
    ) -> dict:
        try:
            q = self.sb.table('ratings').select('*, users(name, email)', count='exact')
            if feature_type and feature_type in VALID_FEATURES:
                q = q.eq('feature_type', feature_type)
            if min_rating is not None:
                q = q.gte('rating', min_rating)
            q = q.order('created_at', desc=True).range(offset, offset + limit - 1)
            res = q.execute()
            return {
                'success': True,
                'data': {
                    'ratings': res.data or [],
                    'total': res.count or 0,
                },
            }
        except Exception as e:
            logger.error(f'list_ratings_admin failed: {e}')
            return {'success': False, 'message': str(e)}

    def ratings_summary(self) -> dict:
        """Aggregate: avg per feature, overall avg, distribution per feature."""
        try:
            res = self.sb.table('ratings').select('feature_type, rating').execute()
            rows = res.data or []

            per_feature: dict = {}
            for r in rows:
                ft = r.get('feature_type') or 'unknown'
                rt = int(r.get('rating') or 0)
                bucket = per_feature.setdefault(
                    ft,
                    {'count': 0, 'sum': 0, 'distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}},
                )
                bucket['count'] += 1
                bucket['sum'] += rt
                if 1 <= rt <= 5:
                    bucket['distribution'][rt] += 1

            features_out = []
            total_count = 0
            total_sum = 0
            for ft, b in per_feature.items():
                avg = round(b['sum'] / b['count'], 2) if b['count'] else 0
                features_out.append(
                    {
                        'feature_type': ft,
                        'count': b['count'],
                        'average': avg,
                        'distribution': b['distribution'],
                    }
                )
                total_count += b['count']
                total_sum += b['sum']

            overall_avg = round(total_sum / total_count, 2) if total_count else 0
            return {
                'success': True,
                'data': {
                    'overall_average': overall_avg,
                    'total_ratings': total_count,
                    'per_feature': features_out,
                },
            }
        except Exception as e:
            logger.error(f'ratings_summary failed: {e}')
            return {'success': False, 'message': str(e)}

    # ---------- feedback ----------

    def create_feedback(
        self,
        user_id: str,
        subject: str,
        message: str,
        category: str = 'other',
        conversion_id: Optional[str] = None,
    ) -> dict:
        if category not in VALID_CATEGORIES:
            category = 'other'
        if not subject or not message:
            return {'success': False, 'message': 'Subject and message are required'}

        payload = {
            'user_id': user_id,
            'subject': subject[:255],
            'message': message[:5000],
            'category': category,
            'status': 'new',
        }
        if conversion_id:
            payload['conversion_id'] = conversion_id

        try:
            res = self.sb.table('feedback').insert(payload).execute()
            return {'success': True, 'data': (res.data or [{}])[0]}
        except Exception as e:
            logger.error(f'create_feedback failed: {e}')
            return {'success': False, 'message': str(e)}

    def list_feedback_for_user(self, user_id: str, limit: int = 50) -> dict:
        try:
            res = (
                self.sb.table('feedback')
                .select('*')
                .eq('user_id', user_id)
                .order('created_at', desc=True)
                .limit(limit)
                .execute()
            )
            return {'success': True, 'data': res.data or []}
        except Exception as e:
            logger.error(f'list_feedback_for_user failed: {e}')
            return {'success': False, 'message': str(e)}

    def list_feedback_admin(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
        category: Optional[str] = None,
    ) -> dict:
        try:
            q = self.sb.table('feedback').select('*, users(name, email)', count='exact')
            if status and status in VALID_STATUSES:
                q = q.eq('status', status)
            if category and category in VALID_CATEGORIES:
                q = q.eq('category', category)
            q = q.order('created_at', desc=True).range(offset, offset + limit - 1)
            res = q.execute()
            return {
                'success': True,
                'data': {
                    'feedback': res.data or [],
                    'total': res.count or 0,
                },
            }
        except Exception as e:
            logger.error(f'list_feedback_admin failed: {e}')
            return {'success': False, 'message': str(e)}

    def update_feedback_admin(
        self,
        feedback_id: str,
        status: Optional[str] = None,
        admin_notes: Optional[str] = None,
    ) -> dict:
        update: dict = {}
        if status and status in VALID_STATUSES:
            update['status'] = status
        if admin_notes is not None:
            update['admin_notes'] = admin_notes[:5000]
        if not update:
            return {'success': False, 'message': 'No valid fields to update'}

        try:
            res = self.sb.table('feedback').update(update).eq('id', feedback_id).execute()
            if not res.data:
                return {'success': False, 'message': 'Feedback not found'}
            return {'success': True, 'data': res.data[0]}
        except Exception as e:
            logger.error(f'update_feedback_admin failed: {e}')
            return {'success': False, 'message': str(e)}

    def feedback_summary(self) -> dict:
        try:
            res = self.sb.table('feedback').select('status, category').execute()
            rows = res.data or []
            by_status: dict = {}
            by_category: dict = {}
            for r in rows:
                s = r.get('status') or 'new'
                c = r.get('category') or 'other'
                by_status[s] = by_status.get(s, 0) + 1
                by_category[c] = by_category.get(c, 0) + 1
            return {
                'success': True,
                'data': {
                    'total': len(rows),
                    'by_status': by_status,
                    'by_category': by_category,
                    'unresolved': by_status.get('new', 0) + by_status.get('read', 0),
                },
            }
        except Exception as e:
            logger.error(f'feedback_summary failed: {e}')
            return {'success': False, 'message': str(e)}

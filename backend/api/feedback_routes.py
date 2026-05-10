"""
Feedback & Ratings routes (user-facing).

Admin-side endpoints live in admin_routes.py to keep the @admin_required
decorator in one place.
"""

import logging
from flask import Blueprint, request
from utils.auth import login_required
from utils.response_formatter import success_response, error_response
from services.feedback_service import FeedbackService

bp = Blueprint('feedback', __name__)
logger = logging.getLogger(__name__)


@bp.route('/ratings', methods=['POST'])
@login_required
def submit_rating():
    data = request.get_json() or {}
    feature_type = data.get('feature_type')
    rating = data.get('rating')
    conversion_id = data.get('conversion_id')
    comment = data.get('comment')

    if not feature_type or rating is None:
        return error_response('feature_type and rating are required', 400)

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return error_response('rating must be an integer', 400)

    result = FeedbackService().create_rating(
        user_id=request.user_id,
        feature_type=feature_type,
        rating=rating,
        conversion_id=conversion_id,
        comment=comment,
    )
    if not result['success']:
        return error_response(result.get('message', 'Failed to submit rating'), 400)
    return success_response(result['data'], 'Rating submitted')


@bp.route('', methods=['POST'], strict_slashes=False)
@bp.route('/', methods=['POST'], strict_slashes=False)
@login_required
def submit_feedback():
    data = request.get_json() or {}
    subject = (data.get('subject') or '').strip()
    message = (data.get('message') or '').strip()
    category = data.get('category', 'other')
    conversion_id = data.get('conversion_id')

    if not subject or not message:
        return error_response('Subject and message are required', 400)

    result = FeedbackService().create_feedback(
        user_id=request.user_id,
        subject=subject,
        message=message,
        category=category,
        conversion_id=conversion_id,
    )
    if not result['success']:
        return error_response(result.get('message', 'Failed to submit feedback'), 400)
    return success_response(result['data'], 'Feedback submitted')


@bp.route('/my', methods=['GET'])
@login_required
def my_feedback():
    svc = FeedbackService()
    fb = svc.list_feedback_for_user(request.user_id)
    rt = svc.list_ratings_for_user(request.user_id)
    return success_response({
        'feedback': fb.get('data', []) if fb['success'] else [],
        'ratings': rt.get('data', []) if rt['success'] else [],
    })

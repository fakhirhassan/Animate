"""
API Response Formatter
Standardizes API responses across all endpoints.
"""

from typing import Any, Optional, Dict
from flask import jsonify


def success_response(
    data: Any = None,
    message: str = 'Success',
    status_code: int = 200
):
    """
    Create a successful API response.

    Args:
        data: Response data (any JSON-serializable type)
        message: Success message
        status_code: HTTP status code

    Returns:
        Flask JSON response with status code
    """
    response = {
        'success': True,
        'message': message,
        'data': data
    }

    return jsonify(response), status_code


def error_response(
    message: str = 'An error occurred',
    status_code: int = 400,
    errors: Optional[Dict] = None,
    error_code: Optional[str] = None
):
    """
    Create an error API response.

    Args:
        message: Error message
        status_code: HTTP status code
        errors: Dictionary of field-specific errors
        error_code: Machine-readable error code

    Returns:
        Flask JSON response with status code
    """
    response = {
        'success': False,
        'message': message
    }

    if errors:
        response['errors'] = errors

    if error_code:
        response['error_code'] = error_code

    return jsonify(response), status_code


def paginated_response(
    data: list,
    page: int,
    per_page: int,
    total: int,
    message: str = 'Success'
):
    """
    Create a paginated API response.

    Args:
        data: List of items for current page
        page: Current page number
        per_page: Items per page
        total: Total number of items
        message: Success message

    Returns:
        Flask JSON response with pagination metadata
    """
    total_pages = (total + per_page - 1) // per_page

    response = {
        'success': True,
        'message': message,
        'data': data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1
        }
    }

    return jsonify(response), 200


def job_status_response(
    job_id: str,
    status: str,
    progress: int = 0,
    result: Optional[Dict] = None,
    error: Optional[str] = None
):
    """
    Create a job status response.

    Args:
        job_id: Unique job identifier
        status: Job status (queued, processing, completed, failed)
        progress: Progress percentage (0-100)
        result: Job result data (if completed)
        error: Error message (if failed)

    Returns:
        Flask JSON response
    """
    response = {
        'success': True,
        'job_id': job_id,
        'status': status,
        'progress': progress
    }

    if status == 'completed' and result:
        response['result'] = result

    if status == 'failed' and error:
        response['error'] = error

    return jsonify(response), 200


def validation_error_response(errors: Dict[str, str]):
    """
    Create a validation error response.

    Args:
        errors: Dictionary mapping field names to error messages

    Returns:
        Flask JSON response with 422 status
    """
    return error_response(
        message='Validation failed',
        status_code=422,
        errors=errors,
        error_code='VALIDATION_ERROR'
    )


def not_found_response(resource: str = 'Resource'):
    """
    Create a not found response.

    Args:
        resource: Name of the resource that wasn't found

    Returns:
        Flask JSON response with 404 status
    """
    return error_response(
        message=f'{resource} not found',
        status_code=404,
        error_code='NOT_FOUND'
    )


def unauthorized_response(message: str = 'Authentication required'):
    """
    Create an unauthorized response.

    Args:
        message: Error message

    Returns:
        Flask JSON response with 401 status
    """
    return error_response(
        message=message,
        status_code=401,
        error_code='UNAUTHORIZED'
    )


def forbidden_response(message: str = 'Access denied'):
    """
    Create a forbidden response.

    Args:
        message: Error message

    Returns:
        Flask JSON response with 403 status
    """
    return error_response(
        message=message,
        status_code=403,
        error_code='FORBIDDEN'
    )

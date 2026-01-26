"""
2D to 3D Conversion API Routes
Handles image upload and 3D model generation endpoints.
"""

import os
import uuid
import logging
from flask import Blueprint, request, jsonify, current_app, send_file
from werkzeug.utils import secure_filename

from utils.file_handler import FileHandler
from utils.validators import validate_image_file
from utils.response_formatter import success_response, error_response
from services.conversion_service import ConversionService
from services.conversion_db_service import ConversionDatabaseService

# Create blueprint
bp = Blueprint('conversion', __name__)
logger = logging.getLogger(__name__)


def get_user_id_from_request():
    """
    Extract user ID from request headers (from Supabase JWT token).
    """
    try:
        # Get Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            current_app.logger.error('No Authorization header found')
            return None

        # Extract token
        token = auth_header.split(' ')[1]

        # Get Supabase client and verify token
        from supabase_client.supabase_config import get_supabase
        supabase = get_supabase()

        # Get user from token
        user_response = supabase.auth.get_user(token)
        user_data = user_response.user

        if not user_data:
            current_app.logger.error('Invalid or expired token')
            return None

        current_app.logger.info(f'Authenticated user: {user_data.id} ({user_data.email})')
        return str(user_data.id)

    except Exception as e:
        current_app.logger.error(f'Error extracting user ID from token: {str(e)}')
        return None


@bp.route('/2d-to-3d', methods=['POST'])
def convert_2d_to_3d():
    """
    Convert a 2D image to a 3D model.

    Request:
        - file: Image file (PNG, JPG, JPEG, GIF)
        - output_format: Desired output format (obj, glb, gltf) [optional, default: glb]
        - quality: Conversion quality (low, medium, high) [optional, default: medium]

    Returns:
        JSON response with conversion job details or the 3D model file.
    """
    try:
        # Get user ID from auth token
        user_id = get_user_id_from_request()
        if not user_id:
            return error_response('Authentication required. Please log in.', 401)

        # Check if file is present in request
        if 'file' not in request.files:
            return error_response('No file provided', 400)

        file = request.files['file']

        # Check if file has a name
        if file.filename == '':
            return error_response('No file selected', 400)

        # Validate file
        validation_result = validate_image_file(file)
        if not validation_result['valid']:
            return error_response(validation_result['message'], 400)

        # Get optional parameters
        output_format = request.form.get('output_format', 'glb').lower()
        quality = request.form.get('quality', 'medium').lower()

        # Validate output format
        allowed_formats = current_app.config.get('ALLOWED_3D_EXTENSIONS', {'obj', 'glb', 'gltf'})
        if output_format not in allowed_formats:
            return error_response(f'Invalid output format. Allowed: {", ".join(allowed_formats)}', 400)

        # Validate quality
        if quality not in ['low', 'medium', 'high']:
            return error_response('Invalid quality. Allowed: low, medium, high', 400)

        # Generate unique job ID
        job_id = str(uuid.uuid4())

        # Save uploaded file
        file_handler = FileHandler(current_app.config['UPLOAD_FOLDER'])
        input_path = file_handler.save_upload(file, job_id, 'input')

        if not input_path:
            return error_response('Failed to save uploaded file', 500)

        logger.info(f'File uploaded successfully: {input_path}, Job ID: {job_id}')

        # Initialize conversion service
        conversion_service = ConversionService()

        # Perform conversion
        result = conversion_service.convert(
            input_path=input_path,
            job_id=job_id,
            output_format=output_format,
            quality=quality
        )

        if not result['success']:
            return error_response(result.get('message', 'Conversion failed'), 500)

        # Save conversion to database
        logger.info(f'🔵 ATTEMPTING TO SAVE TO DATABASE - Job ID: {job_id}, User ID: {user_id}')
        try:
            logger.info('🔵 Creating ConversionDatabaseService instance...')
            db_service = ConversionDatabaseService()
            logger.info('✅ ConversionDatabaseService created successfully')

            # Calculate file size
            output_file_path = result.get('output_file', '')
            file_size = '0 MB'
            if os.path.exists(output_file_path):
                size_bytes = os.path.getsize(output_file_path)
                file_size = f'{size_bytes / (1024 * 1024):.2f} MB'
                logger.info(f'✅ File size calculated: {file_size}')

            # Prepare conversion data for database
            conversion_data = {
                'file_name': secure_filename(file.filename),
                'original_image_url': f'/uploads/input/{os.path.basename(input_path)}',
                'model_url': f'/api/convert/download/{job_id}',
                'thumbnail_url': f'/uploads/input/{os.path.basename(input_path)}',
                'output_format': output_format,
                'quality': quality,
                'status': 'completed',
                'file_size': file_size,
                'settings': {
                    'method': result.get('method', 'MiDaS'),
                    'processing_time': result.get('processing_time', 0)
                }
            }
            logger.info(f'✅ Conversion data prepared: {conversion_data}')

            logger.info('🔵 Calling db_service.save_conversion()...')
            db_result = db_service.save_conversion(user_id, conversion_data)
            logger.info(f'✅ save_conversion returned: {db_result}')

            if db_result['success']:
                logger.info(f'✅ SUCCESS! Conversion saved to database: {job_id}')
            else:
                logger.warning(f'⚠️  FAILED to save conversion to database: {db_result.get("message")}')
                logger.warning(f'⚠️  Error details: {db_result.get("error")}')

        except Exception as db_error:
            logger.error(f'❌ DATABASE SAVE EXCEPTION: {str(db_error)}')
            import traceback
            logger.error(f'❌ Full traceback: {traceback.format_exc()}')
            # Continue even if database save fails

        return success_response({
            'job_id': job_id,
            'status': 'completed',
            'output_file': result['output_file'],
            'download_url': f'/api/convert/download/{job_id}',
            'preview_url': result.get('preview_url'),
            'metadata': result.get('metadata', {})
        }, 'Conversion completed successfully')

    except Exception as e:
        logger.error(f'Conversion error: {str(e)}')
        return error_response(f'Conversion failed: {str(e)}', 500)


@bp.route('/download/<job_id>', methods=['GET', 'OPTIONS'])
def download_model(job_id):
    """
    Download or preview the generated 3D model.

    Args:
        job_id: Unique job identifier

    Query Parameters:
        download: Set to 'true' for download, 'false' for preview (default: false)

    Returns:
        3D model file for download or preview
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        response = current_app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    try:
        # Validate job_id format
        try:
            uuid.UUID(job_id)
        except ValueError:
            return error_response('Invalid job ID format', 400)

        # Find the output file
        output_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'output')
        output_files = [f for f in os.listdir(output_folder) if f.startswith(job_id)]

        if not output_files:
            return error_response('Model not found. It may have expired.', 404)

        output_path = os.path.join(output_folder, output_files[0])

        # Determine MIME type based on file extension
        extension = os.path.splitext(output_files[0])[1].lower()

        # Check if this is a download request or preview request
        is_download = request.args.get('download', 'false').lower() == 'true'

        # For preview mode, use text/plain for OBJ files to ensure browser compatibility
        mime_types = {
            '.obj': 'text/plain' if not is_download else 'model/obj',
            '.glb': 'model/gltf-binary',
            '.gltf': 'model/gltf+json',
            '.fbx': 'application/octet-stream'
        }
        mime_type = mime_types.get(extension, 'application/octet-stream')

        response = send_file(
            output_path,
            mimetype=mime_type,
            as_attachment=is_download,
            download_name=f'animate_model_{job_id[:8]}{extension}'
        )

        # Add CORS headers explicitly for all model files
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Cross-Origin-Resource-Policy'] = 'cross-origin'
        response.headers['Cache-Control'] = 'no-cache'

        return response

    except Exception as e:
        logger.error(f'Download error: {str(e)}')
        return error_response(f'Download failed: {str(e)}', 500)


@bp.route('/history', methods=['GET'])
def get_conversion_history():
    """
    Get conversion history for the authenticated user.

    Query Parameters:
        limit: Number of conversions to return (default: 10)
        offset: Number of conversions to skip (default: 0)
        status: Filter by status (optional)

    Returns:
        JSON with conversion history
    """
    try:
        user_id = get_user_id_from_request()
        if not user_id:
            return error_response('Authentication required. Please log in.', 401)

        limit = int(request.args.get('limit', 10))
        offset = int(request.args.get('offset', 0))
        status = request.args.get('status')

        db_service = ConversionDatabaseService()
        result = db_service.get_user_conversions(user_id, limit, offset, status)

        if not result['success']:
            return error_response(result.get('message', 'Failed to fetch history'), 500)

        return success_response(result['data'], 'History fetched successfully')

    except Exception as e:
        logger.error(f'History fetch error: {str(e)}')
        return error_response(f'Failed to fetch history: {str(e)}', 500)


@bp.route('/history/<conversion_id>', methods=['GET'])
def get_conversion_by_id(conversion_id):
    """
    Get a specific conversion by ID.

    Args:
        conversion_id: Conversion ID

    Returns:
        JSON with conversion details
    """
    try:
        user_id = get_user_id_from_request()

        db_service = ConversionDatabaseService()
        result = db_service.get_conversion_by_id(conversion_id, user_id)

        if not result['success']:
            return error_response(result.get('message', 'Conversion not found'), 404)

        return success_response(result['data'], 'Conversion fetched successfully')

    except Exception as e:
        logger.error(f'Conversion fetch error: {str(e)}')
        return error_response(f'Failed to fetch conversion: {str(e)}', 500)


@bp.route('/history/<conversion_id>', methods=['DELETE'])
def delete_conversion(conversion_id):
    """
    Delete a conversion.

    Args:
        conversion_id: Conversion ID

    Returns:
        JSON with success message
    """
    try:
        user_id = get_user_id_from_request()

        db_service = ConversionDatabaseService()
        result = db_service.delete_conversion(conversion_id, user_id)

        if not result['success']:
            return error_response(result.get('message', 'Failed to delete conversion'), 400)

        return success_response({}, 'Conversion deleted successfully')

    except Exception as e:
        logger.error(f'Conversion delete error: {str(e)}')
        return error_response(f'Failed to delete conversion: {str(e)}', 500)


@bp.route('/stats', methods=['GET'])
def get_user_conversion_stats():
    """
    Get conversion statistics for the authenticated user.

    Returns:
        JSON with user's conversion statistics
    """
    try:
        user_id = get_user_id_from_request()

        db_service = ConversionDatabaseService()
        result = db_service.get_user_stats(user_id)

        if not result['success']:
            return error_response(result.get('message', 'Failed to fetch stats'), 500)

        return success_response(result['data'], 'Stats fetched successfully')

    except Exception as e:
        logger.error(f'Stats fetch error: {str(e)}')
        return error_response(f'Failed to fetch stats: {str(e)}', 500)


@bp.route('/status/<job_id>', methods=['GET'])
def get_conversion_status(job_id):
    """
    Get the status of a conversion job.

    Args:
        job_id: Unique job identifier

    Returns:
        JSON with job status and progress
    """
    try:
        # Validate job_id format
        try:
            uuid.UUID(job_id)
        except ValueError:
            return error_response('Invalid job ID format', 400)

        # Check for output file
        output_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'output')
        output_files = [f for f in os.listdir(output_folder) if f.startswith(job_id)]

        if output_files:
            return success_response({
                'job_id': job_id,
                'status': 'completed',
                'progress': 100,
                'download_url': f'/api/convert/download/{job_id}'
            })

        # Check for input file (job started but not completed)
        input_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'input')
        input_files = [f for f in os.listdir(input_folder) if f.startswith(job_id)]

        if input_files:
            return success_response({
                'job_id': job_id,
                'status': 'processing',
                'progress': 50
            })

        return error_response('Job not found', 404)

    except Exception as e:
        logger.error(f'Status check error: {str(e)}')
        return error_response(f'Status check failed: {str(e)}', 500)


@bp.route('/supported-formats', methods=['GET'])
def get_supported_formats():
    """
    Get list of supported input and output formats.

    Returns:
        JSON with supported formats
    """
    return success_response({
        'input_formats': list(current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg', 'gif'})),
        'output_formats': list(current_app.config.get('ALLOWED_3D_EXTENSIONS', {'obj', 'glb', 'gltf'})),
        'quality_levels': ['low', 'medium', 'high'],
        'max_file_size_mb': current_app.config.get('MAX_CONTENT_LENGTH', 100 * 1024 * 1024) // (1024 * 1024)
    })

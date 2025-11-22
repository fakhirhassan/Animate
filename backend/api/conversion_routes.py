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

# Create blueprint
bp = Blueprint('conversion', __name__)
logger = logging.getLogger(__name__)


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


@bp.route('/download/<job_id>', methods=['GET'])
def download_model(job_id):
    """
    Download or view the generated 3D model.

    Args:
        job_id: Unique job identifier
        Query params:
            - download: If 'true', force download. Otherwise serve for viewing.

    Returns:
        3D model file
    """
    try:
        # Validate job_id format
        try:
            uuid.UUID(job_id)
        except ValueError:
            return error_response('Invalid job ID format', 400)

        # Find the output file
        output_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'output')

        if not os.path.exists(output_folder):
            return error_response('Output folder not found', 404)

        output_files = [f for f in os.listdir(output_folder) if f.startswith(job_id)]

        if not output_files:
            return error_response('Model not found. It may have expired.', 404)

        output_path = os.path.join(output_folder, output_files[0])

        # Determine MIME type based on file extension
        extension = os.path.splitext(output_files[0])[1].lower()
        mime_types = {
            '.obj': 'text/plain',  # OBJ is text-based, easier for browsers to handle
            '.glb': 'model/gltf-binary',
            '.gltf': 'model/gltf+json',
            '.fbx': 'application/octet-stream'
        }
        mime_type = mime_types.get(extension, 'application/octet-stream')

        # Check if user wants to download or just view
        force_download = request.args.get('download', 'false').lower() == 'true'

        return send_file(
            output_path,
            mimetype=mime_type,
            as_attachment=force_download,
            download_name=f'animate_model_{job_id[:8]}{extension}'
        )

    except Exception as e:
        logger.error(f'Download error: {str(e)}')
        return error_response(f'Download failed: {str(e)}', 500)


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

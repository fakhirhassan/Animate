"""
Input Validation Utilities
Validates file uploads, request data, and user inputs.
"""

import os
import logging
from typing import Dict, Any, Optional
from werkzeug.datastructures import FileStorage

logger = logging.getLogger(__name__)

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mov', 'avi'}
ALLOWED_3D_EXTENSIONS = {'obj', 'glb', 'gltf', 'fbx', 'ply', 'stl'}

# File size limits (in bytes)
MAX_IMAGE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB
MAX_3D_SIZE = 100 * 1024 * 1024  # 100MB

# Image magic bytes for validation
IMAGE_SIGNATURES = {
    b'\x89PNG\r\n\x1a\n': 'png',
    b'\xff\xd8\xff': 'jpg',
    b'GIF87a': 'gif',
    b'GIF89a': 'gif',
    b'RIFF': 'webp',  # WebP starts with RIFF
    b'BM': 'bmp'
}


def validate_image_file(file: FileStorage) -> Dict[str, Any]:
    """
    Validate an uploaded image file.

    Checks:
    - File presence and name
    - File extension
    - File size
    - Magic bytes (actual file type)

    Args:
        file: Werkzeug FileStorage object

    Returns:
        Dictionary with 'valid' boolean and 'message' string
    """
    # Check if file exists
    if file is None:
        return {'valid': False, 'message': 'No file provided'}

    # Check filename
    if file.filename == '':
        return {'valid': False, 'message': 'No file selected'}

    filename = file.filename.lower()

    # Check extension
    if not validate_file_extension(filename, ALLOWED_IMAGE_EXTENSIONS):
        return {
            'valid': False,
            'message': f'Invalid file type. Allowed: {", ".join(ALLOWED_IMAGE_EXTENSIONS)}'
        }

    # Check file size (need to read to get size)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer

    if file_size > MAX_IMAGE_SIZE:
        return {
            'valid': False,
            'message': f'File too large. Maximum size: {MAX_IMAGE_SIZE // (1024*1024)}MB'
        }

    if file_size == 0:
        return {'valid': False, 'message': 'File is empty'}

    # Validate magic bytes
    magic_validation = _validate_magic_bytes(file, 'image')
    if not magic_validation['valid']:
        return magic_validation

    return {'valid': True, 'message': 'File is valid', 'size': file_size}


def validate_video_file(file: FileStorage) -> Dict[str, Any]:
    """
    Validate an uploaded video file.

    Args:
        file: Werkzeug FileStorage object

    Returns:
        Dictionary with 'valid' boolean and 'message' string
    """
    if file is None:
        return {'valid': False, 'message': 'No file provided'}

    if file.filename == '':
        return {'valid': False, 'message': 'No file selected'}

    filename = file.filename.lower()

    if not validate_file_extension(filename, ALLOWED_VIDEO_EXTENSIONS):
        return {
            'valid': False,
            'message': f'Invalid file type. Allowed: {", ".join(ALLOWED_VIDEO_EXTENSIONS)}'
        }

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_VIDEO_SIZE:
        return {
            'valid': False,
            'message': f'File too large. Maximum size: {MAX_VIDEO_SIZE // (1024*1024)}MB'
        }

    return {'valid': True, 'message': 'File is valid', 'size': file_size}


def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
    """
    Check if file has an allowed extension.

    Args:
        filename: Name of the file
        allowed_extensions: Set of allowed extensions

    Returns:
        True if extension is allowed
    """
    if '.' not in filename:
        return False

    extension = filename.rsplit('.', 1)[1].lower()
    return extension in allowed_extensions


def _validate_magic_bytes(file: FileStorage, file_type: str) -> Dict[str, Any]:
    """
    Validate file by checking magic bytes.

    Args:
        file: FileStorage object
        file_type: Type of file ('image', 'video')

    Returns:
        Validation result dictionary
    """
    try:
        # Read first 12 bytes for magic number check
        header = file.read(12)
        file.seek(0)  # Reset file pointer

        if file_type == 'image':
            for signature, ext in IMAGE_SIGNATURES.items():
                if header.startswith(signature):
                    return {'valid': True, 'detected_type': ext}

            return {
                'valid': False,
                'message': 'File content does not match a valid image format'
            }

        return {'valid': True}

    except Exception as e:
        logger.error(f'Magic bytes validation error: {str(e)}')
        return {'valid': False, 'message': 'Could not validate file content'}


def validate_email(email: str) -> bool:
    """
    Basic email validation.

    Args:
        email: Email address to validate

    Returns:
        True if email format is valid
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password(password: str) -> Dict[str, Any]:
    """
    Validate password strength.

    Args:
        password: Password to validate

    Returns:
        Dictionary with validation result and feedback
    """
    errors = []

    if len(password) < 8:
        errors.append('Password must be at least 8 characters')

    if not any(c.isupper() for c in password):
        errors.append('Password must contain at least one uppercase letter')

    if not any(c.islower() for c in password):
        errors.append('Password must contain at least one lowercase letter')

    if not any(c.isdigit() for c in password):
        errors.append('Password must contain at least one number')

    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'strength': 'strong' if len(errors) == 0 else 'weak'
    }


def validate_job_id(job_id: str) -> bool:
    """
    Validate UUID format for job IDs.

    Args:
        job_id: Job ID to validate

    Returns:
        True if valid UUID format
    """
    import uuid
    try:
        uuid.UUID(job_id)
        return True
    except ValueError:
        return False


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal attacks.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename
    """
    from werkzeug.utils import secure_filename
    return secure_filename(filename)

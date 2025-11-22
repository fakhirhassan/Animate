"""
File Handler Utility
Handles file uploads, downloads, and temporary file management.
"""

import os
import shutil
import logging
from datetime import datetime, timedelta
from typing import Optional, List
from werkzeug.utils import secure_filename
from werkzeug.datastructures import FileStorage

logger = logging.getLogger(__name__)


class FileHandler:
    """
    Handles file operations for the AniMate backend.

    Features:
    - Secure file uploads
    - Organized directory structure
    - Automatic cleanup of old files
    - File validation
    """

    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mov', 'avi'}
    ALLOWED_3D_EXTENSIONS = {'obj', 'glb', 'gltf', 'fbx', 'ply', 'stl'}

    def __init__(self, upload_folder: str):
        """
        Initialize the file handler.

        Args:
            upload_folder: Base directory for file storage
        """
        self.upload_folder = upload_folder
        self.input_folder = os.path.join(upload_folder, 'input')
        self.output_folder = os.path.join(upload_folder, 'output')

        # Ensure directories exist
        self._ensure_directories()

    def _ensure_directories(self):
        """Create necessary directories if they don't exist."""
        for folder in [self.upload_folder, self.input_folder, self.output_folder]:
            if not os.path.exists(folder):
                os.makedirs(folder)
                logger.info(f'Created directory: {folder}')

    def save_upload(
        self,
        file: FileStorage,
        job_id: str,
        subfolder: str = 'input'
    ) -> Optional[str]:
        """
        Save an uploaded file.

        Args:
            file: Werkzeug FileStorage object
            job_id: Unique job identifier
            subfolder: Subdirectory (input/output)

        Returns:
            Full path to saved file or None on failure
        """
        try:
            # Secure the filename
            original_filename = secure_filename(file.filename)
            extension = self._get_extension(original_filename)

            # Create unique filename with job_id
            new_filename = f'{job_id}.{extension}'

            # Determine target folder
            target_folder = self.input_folder if subfolder == 'input' else self.output_folder
            file_path = os.path.join(target_folder, new_filename)

            # Save file
            file.save(file_path)
            logger.info(f'File saved: {file_path}')

            return file_path

        except Exception as e:
            logger.error(f'Error saving file: {str(e)}')
            return None

    def get_file_path(self, job_id: str, subfolder: str = 'output') -> Optional[str]:
        """
        Get the path to a file by job ID.

        Args:
            job_id: Job identifier
            subfolder: Subdirectory to search

        Returns:
            File path if found, None otherwise
        """
        target_folder = self.output_folder if subfolder == 'output' else self.input_folder

        # Look for file matching job_id
        for filename in os.listdir(target_folder):
            if filename.startswith(job_id):
                return os.path.join(target_folder, filename)

        return None

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file.

        Args:
            file_path: Path to file

        Returns:
            True if deleted, False otherwise
        """
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f'File deleted: {file_path}')
                return True
            return False

        except Exception as e:
            logger.error(f'Error deleting file: {str(e)}')
            return False

    def delete_job_files(self, job_id: str) -> bool:
        """
        Delete all files associated with a job.

        Args:
            job_id: Job identifier

        Returns:
            True if successful
        """
        try:
            deleted = 0

            for folder in [self.input_folder, self.output_folder]:
                for filename in os.listdir(folder):
                    if filename.startswith(job_id):
                        file_path = os.path.join(folder, filename)
                        os.remove(file_path)
                        deleted += 1

            logger.info(f'Deleted {deleted} files for job: {job_id}')
            return True

        except Exception as e:
            logger.error(f'Error deleting job files: {str(e)}')
            return False

    def cleanup_old_files(self, max_age_hours: int = 24) -> int:
        """
        Remove files older than specified age.

        Args:
            max_age_hours: Maximum file age in hours

        Returns:
            Number of files deleted
        """
        deleted = 0
        cutoff_time = datetime.now() - timedelta(hours=max_age_hours)

        try:
            for folder in [self.input_folder, self.output_folder]:
                for filename in os.listdir(folder):
                    file_path = os.path.join(folder, filename)

                    # Check file modification time
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))

                    if file_mtime < cutoff_time:
                        os.remove(file_path)
                        deleted += 1

            logger.info(f'Cleaned up {deleted} old files')
            return deleted

        except Exception as e:
            logger.error(f'Error during cleanup: {str(e)}')
            return deleted

    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get information about a file.

        Args:
            file_path: Path to file

        Returns:
            Dictionary with file info or None
        """
        try:
            if not os.path.exists(file_path):
                return None

            stat = os.stat(file_path)

            return {
                'path': file_path,
                'filename': os.path.basename(file_path),
                'size_bytes': stat.st_size,
                'size_mb': round(stat.st_size / (1024 * 1024), 2),
                'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'extension': self._get_extension(file_path)
            }

        except Exception as e:
            logger.error(f'Error getting file info: {str(e)}')
            return None

    def list_files(self, subfolder: str = 'output') -> List[dict]:
        """
        List all files in a subfolder.

        Args:
            subfolder: Subdirectory to list

        Returns:
            List of file info dictionaries
        """
        target_folder = self.output_folder if subfolder == 'output' else self.input_folder
        files = []

        try:
            for filename in os.listdir(target_folder):
                file_path = os.path.join(target_folder, filename)
                info = self.get_file_info(file_path)
                if info:
                    files.append(info)

            return files

        except Exception as e:
            logger.error(f'Error listing files: {str(e)}')
            return []

    def _get_extension(self, filename: str) -> str:
        """Extract file extension."""
        if '.' in filename:
            return filename.rsplit('.', 1)[1].lower()
        return ''

    def is_allowed_image(self, filename: str) -> bool:
        """Check if file is an allowed image type."""
        return self._get_extension(filename) in self.ALLOWED_IMAGE_EXTENSIONS

    def is_allowed_video(self, filename: str) -> bool:
        """Check if file is an allowed video type."""
        return self._get_extension(filename) in self.ALLOWED_VIDEO_EXTENSIONS

    def is_allowed_3d(self, filename: str) -> bool:
        """Check if file is an allowed 3D model type."""
        return self._get_extension(filename) in self.ALLOWED_3D_EXTENSIONS

    def get_storage_stats(self) -> dict:
        """Get storage usage statistics."""
        try:
            input_size = sum(
                os.path.getsize(os.path.join(self.input_folder, f))
                for f in os.listdir(self.input_folder)
            )
            output_size = sum(
                os.path.getsize(os.path.join(self.output_folder, f))
                for f in os.listdir(self.output_folder)
            )

            return {
                'input_folder': {
                    'files': len(os.listdir(self.input_folder)),
                    'size_mb': round(input_size / (1024 * 1024), 2)
                },
                'output_folder': {
                    'files': len(os.listdir(self.output_folder)),
                    'size_mb': round(output_size / (1024 * 1024), 2)
                },
                'total_size_mb': round((input_size + output_size) / (1024 * 1024), 2)
            }

        except Exception as e:
            logger.error(f'Error getting storage stats: {str(e)}')
            return {}

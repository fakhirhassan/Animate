"""
Storage Service
Handles file storage operations (local and cloud).
"""

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Check for boto3 availability (AWS S3)
BOTO3_AVAILABLE = False
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    logger.info('boto3 not available, S3 storage disabled')


class StorageService:
    """
    Abstract storage service supporting local and cloud storage.

    Features:
    - Local file storage
    - AWS S3 integration (optional)
    - File URL generation
    - Storage quota management
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the storage service.

        Args:
            config: Storage configuration dictionary
        """
        self.config = config or {}
        self.use_s3 = self.config.get('use_s3', False) and BOTO3_AVAILABLE
        self.local_path = self.config.get('local_path', 'uploads')

        if self.use_s3:
            self._init_s3()
        else:
            self._init_local()

    def _init_s3(self):
        """Initialize S3 client."""
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.config.get('aws_access_key_id'),
                aws_secret_access_key=self.config.get('aws_secret_access_key'),
                region_name=self.config.get('aws_region', 'us-east-1')
            )
            self.bucket_name = self.config.get('s3_bucket')
            logger.info(f'S3 storage initialized: bucket={self.bucket_name}')

        except Exception as e:
            logger.error(f'Failed to initialize S3: {str(e)}')
            self.use_s3 = False
            self._init_local()

    def _init_local(self):
        """Initialize local storage."""
        if not os.path.exists(self.local_path):
            os.makedirs(self.local_path)
        logger.info(f'Local storage initialized: {self.local_path}')

    def save_file(
        self,
        file_data: bytes,
        filename: str,
        folder: str = ''
    ) -> Optional[str]:
        """
        Save a file to storage.

        Args:
            file_data: File content as bytes
            filename: Destination filename
            folder: Optional subfolder

        Returns:
            File path/URL or None on failure
        """
        if self.use_s3:
            return self._save_to_s3(file_data, filename, folder)
        else:
            return self._save_to_local(file_data, filename, folder)

    def _save_to_s3(
        self,
        file_data: bytes,
        filename: str,
        folder: str
    ) -> Optional[str]:
        """Save file to S3."""
        try:
            key = f'{folder}/{filename}' if folder else filename

            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_data
            )

            url = f'https://{self.bucket_name}.s3.amazonaws.com/{key}'
            logger.info(f'Saved to S3: {key}')
            return url

        except Exception as e:
            logger.error(f'S3 save error: {str(e)}')
            return None

    def _save_to_local(
        self,
        file_data: bytes,
        filename: str,
        folder: str
    ) -> Optional[str]:
        """Save file to local storage."""
        try:
            # Create folder if needed
            target_folder = os.path.join(self.local_path, folder) if folder else self.local_path
            if not os.path.exists(target_folder):
                os.makedirs(target_folder)

            file_path = os.path.join(target_folder, filename)

            with open(file_path, 'wb') as f:
                f.write(file_data)

            logger.info(f'Saved to local: {file_path}')
            return file_path

        except Exception as e:
            logger.error(f'Local save error: {str(e)}')
            return None

    def get_file(self, path: str) -> Optional[bytes]:
        """
        Retrieve a file from storage.

        Args:
            path: File path or S3 key

        Returns:
            File content as bytes or None
        """
        if self.use_s3:
            return self._get_from_s3(path)
        else:
            return self._get_from_local(path)

    def _get_from_s3(self, key: str) -> Optional[bytes]:
        """Get file from S3."""
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return response['Body'].read()

        except Exception as e:
            logger.error(f'S3 get error: {str(e)}')
            return None

    def _get_from_local(self, path: str) -> Optional[bytes]:
        """Get file from local storage."""
        try:
            full_path = path if os.path.isabs(path) else os.path.join(self.local_path, path)

            with open(full_path, 'rb') as f:
                return f.read()

        except Exception as e:
            logger.error(f'Local get error: {str(e)}')
            return None

    def delete_file(self, path: str) -> bool:
        """
        Delete a file from storage.

        Args:
            path: File path or S3 key

        Returns:
            True if deleted successfully
        """
        if self.use_s3:
            return self._delete_from_s3(path)
        else:
            return self._delete_from_local(path)

    def _delete_from_s3(self, key: str) -> bool:
        """Delete file from S3."""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            logger.info(f'Deleted from S3: {key}')
            return True

        except Exception as e:
            logger.error(f'S3 delete error: {str(e)}')
            return False

    def _delete_from_local(self, path: str) -> bool:
        """Delete file from local storage."""
        try:
            full_path = path if os.path.isabs(path) else os.path.join(self.local_path, path)

            if os.path.exists(full_path):
                os.remove(full_path)
                logger.info(f'Deleted from local: {full_path}')
                return True

            return False

        except Exception as e:
            logger.error(f'Local delete error: {str(e)}')
            return False

    def file_exists(self, path: str) -> bool:
        """
        Check if a file exists.

        Args:
            path: File path or S3 key

        Returns:
            True if file exists
        """
        if self.use_s3:
            try:
                self.s3_client.head_object(
                    Bucket=self.bucket_name,
                    Key=path
                )
                return True
            except Exception:
                return False
        else:
            full_path = path if os.path.isabs(path) else os.path.join(self.local_path, path)
            return os.path.exists(full_path)

    def get_file_url(self, path: str, expires_in: int = 3600) -> Optional[str]:
        """
        Get a URL for accessing a file.

        Args:
            path: File path or S3 key
            expires_in: URL expiration time in seconds (S3 only)

        Returns:
            File URL
        """
        if self.use_s3:
            try:
                url = self.s3_client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': self.bucket_name, 'Key': path},
                    ExpiresIn=expires_in
                )
                return url
            except Exception as e:
                logger.error(f'Error generating presigned URL: {str(e)}')
                return None
        else:
            # Return local path for local storage
            return path

    def get_storage_info(self) -> Dict[str, Any]:
        """
        Get storage information.

        Returns:
            Storage configuration and usage info
        """
        info = {
            'type': 's3' if self.use_s3 else 'local',
            'path': self.bucket_name if self.use_s3 else self.local_path
        }

        if not self.use_s3:
            # Calculate local storage usage
            total_size = 0
            file_count = 0

            for root, dirs, files in os.walk(self.local_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    total_size += os.path.getsize(file_path)
                    file_count += 1

            info['usage'] = {
                'files': file_count,
                'size_bytes': total_size,
                'size_mb': round(total_size / (1024 * 1024), 2)
            }

        return info

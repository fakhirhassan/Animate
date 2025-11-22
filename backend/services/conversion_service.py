"""
Conversion Service
Business logic for 2D to 3D conversion operations.
"""

import os
import logging
from typing import Dict, Any, Optional
from flask import current_app

from models.two_d_to_three_d import TwoDToThreeDConverter

logger = logging.getLogger(__name__)


class ConversionService:
    """
    Service layer for handling conversion operations.

    Responsibilities:
    - Initialize and manage converter instances
    - Handle conversion workflow
    - Manage job status and results
    """

    _converter_instance: Optional[TwoDToThreeDConverter] = None

    def __init__(self):
        """Initialize the conversion service."""
        self.upload_folder = self._get_upload_folder()

    def _get_upload_folder(self) -> str:
        """Get upload folder from config or default."""
        try:
            return current_app.config.get('UPLOAD_FOLDER', 'uploads')
        except RuntimeError:
            return 'uploads'

    @classmethod
    def get_converter(cls) -> TwoDToThreeDConverter:
        """
        Get or create the converter instance (singleton pattern).

        Returns:
            TwoDToThreeDConverter instance
        """
        if cls._converter_instance is None:
            try:
                model_path = current_app.config.get(
                    'MODEL_WEIGHTS_PATH',
                    'models/two_d_to_three_d/model_weights'
                )
            except RuntimeError:
                model_path = 'models/two_d_to_three_d/model_weights'

            cls._converter_instance = TwoDToThreeDConverter(
                config={'model_weights_path': model_path}
            )

        return cls._converter_instance

    def convert(
        self,
        input_path: str,
        job_id: str,
        output_format: str = 'glb',
        quality: str = 'medium'
    ) -> Dict[str, Any]:
        """
        Perform 2D to 3D conversion.

        Args:
            input_path: Path to input image
            job_id: Unique job identifier
            output_format: Desired output format
            quality: Conversion quality level

        Returns:
            Dictionary with conversion results
        """
        try:
            logger.info(f'Starting conversion for job: {job_id}')

            # Validate input file exists
            if not os.path.exists(input_path):
                return {
                    'success': False,
                    'message': f'Input file not found: {input_path}'
                }

            # Get output path
            output_folder = os.path.join(self.upload_folder, 'output')
            if not os.path.exists(output_folder):
                os.makedirs(output_folder)

            output_path = os.path.join(output_folder, job_id)

            # Get converter and perform conversion
            converter = self.get_converter()
            result = converter.convert(
                input_path=input_path,
                output_path=output_path,
                output_format=output_format,
                quality=quality
            )

            if result['success']:
                # Clean up input file after successful conversion
                try:
                    os.remove(input_path)
                    logger.info(f'Cleaned up input file: {input_path}')
                except Exception as e:
                    logger.warning(f'Could not clean up input file: {str(e)}')

                return {
                    'success': True,
                    'output_file': result['output_path'],
                    'preview_url': None,  # TODO: Generate preview image
                    'metadata': result.get('metadata', {})
                }
            else:
                return {
                    'success': False,
                    'message': result.get('error', 'Conversion failed')
                }

        except Exception as e:
            logger.error(f'Conversion service error: {str(e)}')
            return {
                'success': False,
                'message': str(e)
            }

    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of a conversion job.

        Args:
            job_id: Job identifier

        Returns:
            Job status information
        """
        try:
            output_folder = os.path.join(self.upload_folder, 'output')
            input_folder = os.path.join(self.upload_folder, 'input')

            # Check for output file (completed)
            output_files = [f for f in os.listdir(output_folder) if f.startswith(job_id)]
            if output_files:
                output_path = os.path.join(output_folder, output_files[0])
                return {
                    'status': 'completed',
                    'progress': 100,
                    'output_file': output_path,
                    'download_url': f'/api/convert/download/{job_id}'
                }

            # Check for input file (processing)
            input_files = [f for f in os.listdir(input_folder) if f.startswith(job_id)]
            if input_files:
                return {
                    'status': 'processing',
                    'progress': 50
                }

            return {
                'status': 'not_found',
                'progress': 0
            }

        except Exception as e:
            logger.error(f'Error getting job status: {str(e)}')
            return {
                'status': 'error',
                'message': str(e)
            }

    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a conversion job.

        Args:
            job_id: Job identifier

        Returns:
            True if cancelled successfully
        """
        # TODO: Implement job cancellation for async processing
        logger.info(f'Cancel requested for job: {job_id}')
        return True

    def cleanup_job(self, job_id: str) -> bool:
        """
        Clean up files associated with a job.

        Args:
            job_id: Job identifier

        Returns:
            True if cleanup successful
        """
        try:
            output_folder = os.path.join(self.upload_folder, 'output')
            input_folder = os.path.join(self.upload_folder, 'input')

            deleted = 0
            for folder in [input_folder, output_folder]:
                for filename in os.listdir(folder):
                    if filename.startswith(job_id):
                        os.remove(os.path.join(folder, filename))
                        deleted += 1

            logger.info(f'Cleaned up {deleted} files for job: {job_id}')
            return True

        except Exception as e:
            logger.error(f'Error cleaning up job: {str(e)}')
            return False

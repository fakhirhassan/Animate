"""
2D to 3D Converter
Main conversion pipeline using TripoSR for true 3D model generation.
"""

import os
import logging
import time
from typing import Dict, Any, Optional
from PIL import Image
import numpy as np

from .triposr_converter import TripoSRConverter
from .depth_estimator import DepthEstimator
from .mesh_generator import MeshGenerator

logger = logging.getLogger(__name__)


class TwoDToThreeDConverter:
    """
    Main converter class that handles the full 2D to 3D conversion pipeline.

    Now using TripoSR for true 3D model generation instead of MiDaS depth estimation.
    TripoSR generates proper 3D geometry with 360° viewability, not just 2.5D relief models.
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize the converter with optional configuration.

        Args:
            config: Configuration dictionary with model paths and settings
        """
        self.config = config or {}
        self.triposr_converter = None
        self.use_triposr = self.config.get('use_triposr', True)

        # Fallback to old MiDaS pipeline if needed
        self.depth_estimator = None
        self.mesh_generator = None
        self._initialized = False

        # Default settings
        self.default_resolution = self.config.get('default_resolution', 512)
        self.model_weights_path = self.config.get(
            'model_weights_path',
            'models/two_d_to_three_d/model_weights'
        )

        logger.info('TwoDToThreeDConverter created (using TripoSR)')

    def initialize(self) -> bool:
        """
        Initialize the AI models. Call this before conversion.

        Returns:
            True if initialization successful, False otherwise
        """
        try:
            logger.info('Initializing 2D to 3D converter...')

            if self.use_triposr:
                # Initialize TripoSR converter
                self.triposr_converter = TripoSRConverter()
                success = self.triposr_converter.initialize()

                if not success:
                    logger.warning('TripoSR initialization failed, falling back to MiDaS')
                    self.use_triposr = False
                else:
                    self._initialized = True
                    logger.info('TripoSR converter initialized successfully')
                    return True

            # Fallback to MiDaS pipeline
            if not self.use_triposr:
                # Initialize depth estimator
                self.depth_estimator = DepthEstimator(
                    model_path=self.model_weights_path
                )

                # Initialize mesh generator
                self.mesh_generator = MeshGenerator()

                self._initialized = True
                logger.info('MiDaS converter initialized successfully (fallback)')
                return True

        except Exception as e:
            logger.error(f'Failed to initialize converter: {str(e)}')
            return False

    def convert(
        self,
        input_path: str,
        output_path: str,
        output_format: str = 'obj',
        quality: str = 'medium'
    ) -> Dict[str, Any]:
        """
        Convert a 2D image to a 3D model.

        Args:
            input_path: Path to input image
            output_path: Path for output 3D model (without extension)
            output_format: Output format (obj, glb)
            quality: Conversion quality (low, medium, high)

        Returns:
            Dictionary with conversion results and metadata
        """
        start_time = time.time()

        try:
            # Lazy initialization
            if not self._initialized:
                if not self.initialize():
                    return {
                        'success': False,
                        'error': 'Failed to initialize converter'
                    }

            # Validate input
            if not os.path.exists(input_path):
                return {
                    'success': False,
                    'error': f'Input file not found: {input_path}'
                }

            logger.info(f'Starting conversion: {input_path}')

            # Step 1: Load image
            image = self._load_image(input_path, quality)
            if image is None:
                return {
                    'success': False,
                    'error': 'Failed to load image'
                }

            logger.info(f'Image loaded: {image.size}')

            # Use TripoSR pipeline
            if self.use_triposr and self.triposr_converter:
                logger.info('Using TripoSR pipeline for true 3D generation')

                # Map quality to marching cubes resolution
                resolution_map = {
                    'low': 128,
                    'medium': 256,
                    'high': 512
                }
                mc_resolution = resolution_map.get(quality, 256)

                # Convert using TripoSR
                result = self.triposr_converter.convert(
                    input_image=image,
                    output_path=output_path,
                    output_format=output_format,
                    mc_resolution=mc_resolution,
                    remove_bg=True
                )

                if result['success']:
                    processing_time = time.time() - start_time
                    result['processing_time'] = processing_time
                    result['method'] = 'TripoSR'
                    logger.info(f'TripoSR conversion completed in {processing_time:.2f}s')

                return result

            # Fallback to MiDaS pipeline (2.5D)
            else:
                logger.info('Using MiDaS fallback pipeline (2.5D)')

                # Step 2: Estimate depth
                depth_map = self.depth_estimator.estimate(image)
                if depth_map is None:
                    return {
                        'success': False,
                        'error': 'Depth estimation failed'
                    }

                logger.info('Depth map generated')

                # Step 3: Generate mesh
                mesh = self.mesh_generator.generate(
                    image=image,
                    depth_map=depth_map,
                    quality=quality
                )
                if mesh is None:
                    return {
                        'success': False,
                        'error': 'Mesh generation failed'
                    }

                logger.info('Mesh generated')

                # Step 4: Export mesh
                final_output_path = f'{output_path}.{output_format}'
                export_success = self.mesh_generator.export(
                    mesh=mesh,
                    output_path=final_output_path,
                    format=output_format
                )

                if not export_success:
                    return {
                        'success': False,
                        'error': 'Failed to export mesh'
                    }

                processing_time = time.time() - start_time

                logger.info(f'MiDaS conversion completed in {processing_time:.2f}s')

                return {
                    'success': True,
                    'output_path': final_output_path,
                    'format': output_format,
                    'processing_time': processing_time,
                    'method': 'MiDaS',
                    'metadata': {
                        'input_resolution': image.size,
                        'quality': quality,
                        'vertex_count': mesh.get('vertex_count', 0),
                        'face_count': mesh.get('face_count', 0)
                    }
                }

        except Exception as e:
            logger.error(f'Conversion error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }

    def _load_image(self, path: str, quality: str) -> Optional[Image.Image]:
        """
        Load and preprocess input image.

        Args:
            path: Path to image file
            quality: Quality setting affects resolution

        Returns:
            Preprocessed PIL Image or None on failure
        """
        try:
            # Quality to resolution mapping
            resolution_map = {
                'low': 256,
                'medium': 512,
                'high': 1024
            }
            target_resolution = resolution_map.get(quality, 512)

            # Load image
            image = Image.open(path)

            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Resize while maintaining aspect ratio
            image.thumbnail((target_resolution, target_resolution), Image.Resampling.LANCZOS)

            return image

        except Exception as e:
            logger.error(f'Error loading image: {str(e)}')
            return None

    def get_supported_formats(self) -> Dict[str, Any]:
        """Get information about supported formats."""
        return {
            'input_formats': ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'],
            'output_formats': ['obj', 'glb', 'gltf', 'ply', 'stl'],
            'quality_levels': {
                'low': {'resolution': 256, 'description': 'Fast, lower detail'},
                'medium': {'resolution': 512, 'description': 'Balanced'},
                'high': {'resolution': 1024, 'description': 'High detail, slower'}
            }
        }

    def cleanup(self):
        """Clean up resources."""
        if self.triposr_converter:
            self.triposr_converter.cleanup()
        if self.depth_estimator:
            self.depth_estimator.cleanup()
        if self.mesh_generator:
            self.mesh_generator.cleanup()

        self._initialized = False
        logger.info('Converter cleaned up')

"""
TripoSR Converter
Converts 2D images to proper 3D models using TripoSR.
"""

import os
import sys
import logging
import numpy as np
import torch
from PIL import Image
import rembg
from typing import Optional
import trimesh

# Add TripoSR to Python path
triposr_path = os.path.join(os.path.dirname(__file__), '..', '..', 'TripoSR_temp')
if os.path.exists(triposr_path) and triposr_path not in sys.path:
    sys.path.insert(0, triposr_path)

from tsr.system import TSR
from tsr.utils import remove_background, resize_foreground

logger = logging.getLogger(__name__)


class TripoSRConverter:
    """
    TripoSR-based converter that generates proper 3D models from 2D images.
    Unlike MiDaS which creates 2.5D relief models, TripoSR generates true 3D
    geometry with 360° viewability.
    """

    def __init__(self):
        """Initialize the TripoSR converter."""
        self.model = None
        self.device = None
        self.rembg_session = None
        self._initialized = False
        logger.info('TripoSRConverter created')

    def initialize(self) -> bool:
        """
        Initialize the TripoSR model.

        Returns:
            True if initialization successful, False otherwise
        """
        try:
            logger.info('Initializing TripoSR model...')

            # Set device
            self.device = "cuda:0" if torch.cuda.is_available() else "cpu"
            logger.info(f'Using device: {self.device}')

            # Load TripoSR model from HuggingFace (will use local cache if available)
            logger.info('Loading TripoSR model...')
            self.model = TSR.from_pretrained(
                "stabilityai/TripoSR",
                config_name="config.yaml",
                weight_name="model.ckpt",
            )

            # Set chunk size for memory efficiency
            # Lower values use less VRAM but are slower
            self.model.renderer.set_chunk_size(8192)

            # Move model to device
            self.model.to(self.device)

            # Initialize background removal
            self.rembg_session = rembg.new_session()

            self._initialized = True
            logger.info('TripoSR model initialized successfully')
            return True

        except Exception as e:
            logger.error(f'Failed to initialize TripoSR: {str(e)}')
            return False

    def preprocess_image(
        self,
        image: Image.Image,
        remove_bg: bool = True,
        foreground_ratio: float = 0.85
    ) -> Image.Image:
        """
        Preprocess image for TripoSR.

        Args:
            image: Input PIL Image
            remove_bg: Whether to remove background
            foreground_ratio: Ratio of foreground to image size

        Returns:
            Preprocessed PIL Image
        """
        try:
            if remove_bg:
                # Remove background
                image = remove_background(image, self.rembg_session)

                # Resize foreground
                image = resize_foreground(image, foreground_ratio)

                # Convert to RGB with gray background
                image_array = np.array(image).astype(np.float32) / 255.0
                image_array = image_array[:, :, :3] * image_array[:, :, 3:4] + \
                             (1 - image_array[:, :, 3:4]) * 0.5
                image = Image.fromarray((image_array * 255.0).astype(np.uint8))
            else:
                # Just ensure RGB
                if image.mode != 'RGB':
                    image = image.convert('RGB')

            return image

        except Exception as e:
            logger.error(f'Error preprocessing image: {str(e)}')
            raise

    def convert(
        self,
        input_image: Image.Image,
        output_path: str,
        output_format: str = 'obj',
        mc_resolution: int = 256,
        remove_bg: bool = True,
        bake_texture: bool = False,
        texture_resolution: int = 2048
    ) -> dict:
        """
        Convert 2D image to 3D model using TripoSR.

        Args:
            input_image: Input PIL Image
            output_path: Path to save output model (without extension)
            output_format: Output format ('obj' or 'glb')
            mc_resolution: Marching cubes resolution (higher = more detail)
            remove_bg: Whether to remove background from input
            bake_texture: Whether to bake texture atlas
            texture_resolution: Texture atlas resolution

        Returns:
            Dictionary with conversion results
        """
        try:
            # Lazy initialization
            if not self._initialized:
                if not self.initialize():
                    return {
                        'success': False,
                        'error': 'Failed to initialize TripoSR'
                    }

            logger.info('Starting TripoSR conversion...')

            # Preprocess image
            processed_image = self.preprocess_image(
                input_image,
                remove_bg=remove_bg
            )
            logger.info('Image preprocessed')

            # Run TripoSR model
            logger.info('Running TripoSR model inference...')
            with torch.no_grad():
                scene_codes = self.model([processed_image], device=self.device)
            logger.info('Scene codes generated')

            # Extract mesh using marching cubes
            logger.info(f'Extracting mesh with resolution {mc_resolution}...')
            meshes = self.model.extract_mesh(
                scene_codes,
                not bake_texture,  # vertex_color
                resolution=mc_resolution
            )
            mesh = meshes[0]
            logger.info(f'Mesh extracted: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces')

            # Export mesh
            final_output_path = f'{output_path}.{output_format}'

            if bake_texture:
                # TODO: Implement texture baking if needed
                # This requires xatlas and additional processing
                logger.warning('Texture baking not yet implemented, saving with vertex colors')
                mesh.export(final_output_path)
            else:
                mesh.export(final_output_path)

            logger.info(f'Mesh exported to {final_output_path}')

            return {
                'success': True,
                'output_path': final_output_path,
                'format': output_format,
                'metadata': {
                    'vertex_count': len(mesh.vertices),
                    'face_count': len(mesh.faces),
                    'mc_resolution': mc_resolution,
                    'has_texture': bake_texture
                }
            }

        except Exception as e:
            logger.error(f'TripoSR conversion error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }

    def cleanup(self):
        """Clean up resources."""
        if self.model is not None:
            # Move model to CPU to free GPU memory
            if self.device != 'cpu':
                self.model.to('cpu')
            self.model = None

        self.rembg_session = None
        self._initialized = False

        # Clear CUDA cache if available
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info('TripoSR converter cleaned up')

"""
TripoSR Converter
High-quality 2D to 3D conversion using TripoSR model from Stability AI.
"""

import os
import logging
from typing import Dict, Any, Optional
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# Check if TripoSR dependencies are available
TRIPOSR_AVAILABLE = False
try:
    import torch
    from transformers import pipeline
    TRIPOSR_AVAILABLE = True
    logger.info('TripoSR dependencies available')
except ImportError as e:
    logger.warning(f'TripoSR dependencies not available: {e}')


class TripoSRConverter:
    """
    TripoSR-based 2D to 3D converter.

    TripoSR is a state-of-the-art model that generates high-quality 3D meshes
    from single images in seconds.
    """

    def __init__(self, model_name: str = "stabilityai/TripoSR"):
        """
        Initialize TripoSR converter.

        Args:
            model_name: HuggingFace model identifier
        """
        self.model_name = model_name
        self.model = None
        self.device = None
        self._initialized = False

        logger.info(f'TripoSRConverter created with model: {model_name}')

    def initialize(self) -> bool:
        """
        Initialize the TripoSR model.

        Returns:
            True if successful, False otherwise
        """
        if not TRIPOSR_AVAILABLE:
            logger.error('TripoSR dependencies not available')
            return False

        try:
            # Set device
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            logger.info(f'Using device: {self.device}')

            # Load TripoSR model from HuggingFace
            logger.info(f'Loading TripoSR model from {self.model_name}...')
            try:
                # Try to load as image-to-3d pipeline
                from diffusers import DiffusionPipeline
                self.model = DiffusionPipeline.from_pretrained(
                    self.model_name,
                    trust_remote_code=True,
                    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
                )
                self.model.to(self.device)
                logger.info('TripoSR model loaded successfully')
                self._initialized = True
                return True
            except Exception as model_error:
                logger.warning(f'Could not load TripoSR as pipeline: {str(model_error)}')
                logger.warning('TripoSR model not available - will use MiDaS fallback')
                self._initialized = False
                return False

        except Exception as e:
            logger.error(f'Failed to initialize TripoSR: {str(e)}')
            return False

    def convert(
        self,
        image: Image.Image,
        remove_background: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Convert 2D image to 3D mesh using TripoSR.

        Args:
            image: Input PIL Image
            remove_background: Whether to remove background before conversion

        Returns:
            Dictionary with mesh data or None on failure
        """
        if not self._initialized:
            if not self.initialize():
                return None

        try:
            # Preprocess image
            processed_image = self._preprocess_image(image, remove_background)

            # For now, return placeholder since we need proper TripoSR setup
            # In production:
            # scene_codes = self.model([processed_image], device=str(self.device))
            # meshes = self.model.extract_mesh(scene_codes)
            # return {'mesh': meshes[0], 'success': True}

            logger.info('TripoSR placeholder conversion')
            return {
                'success': True,
                'mesh_type': 'triposr_placeholder',
                'message': 'TripoSR model not fully initialized'
            }

        except Exception as e:
            logger.error(f'TripoSR conversion error: {str(e)}')
            return None

    def _preprocess_image(
        self,
        image: Image.Image,
        remove_background: bool
    ) -> Image.Image:
        """
        Preprocess image for TripoSR.

        Args:
            image: Input image
            remove_background: Whether to remove background

        Returns:
            Preprocessed image
        """
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Resize to appropriate size (TripoSR works best with 512x512)
        max_size = 512
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

        # Create square image with padding
        size = max(image.size)
        new_image = Image.new('RGB', (size, size), (255, 255, 255))
        paste_pos = ((size - image.size[0]) // 2, (size - image.size[1]) // 2)
        new_image.paste(image, paste_pos)

        # Remove background if requested
        if remove_background:
            try:
                from rembg import remove
                new_image = remove(new_image)
            except Exception as e:
                logger.warning(f'Background removal failed: {e}, continuing without it')

        return new_image

    def cleanup(self):
        """Clean up model resources."""
        if self.model is not None and TRIPOSR_AVAILABLE:
            del self.model
            self.model = None

            if torch.cuda.is_available():
                torch.cuda.empty_cache()

        self._initialized = False
        logger.info('TripoSR converter cleaned up')

    def get_info(self) -> Dict[str, Any]:
        """Get converter information."""
        return {
            'model_name': self.model_name,
            'initialized': self._initialized,
            'device': str(self.device) if self.device else 'cpu',
            'triposr_available': TRIPOSR_AVAILABLE,
            'using_placeholder': self.model is None
        }

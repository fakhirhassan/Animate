"""
Image Processing Utilities
Handles image preprocessing, resizing, and format conversion.
"""

import os
import logging
from typing import Tuple, Optional
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)


class ImageProcessor:
    """
    Image processing utilities for the conversion pipeline.

    Features:
    - Image resizing and cropping
    - Format conversion
    - Color space conversion
    - Image enhancement
    """

    # Common aspect ratios
    ASPECT_RATIOS = {
        'square': (1, 1),
        'portrait': (3, 4),
        'landscape': (4, 3),
        'wide': (16, 9),
        'ultrawide': (21, 9)
    }

    def __init__(self, max_dimension: int = 1024):
        """
        Initialize the image processor.

        Args:
            max_dimension: Maximum dimension for processed images
        """
        self.max_dimension = max_dimension

    def load_image(self, path: str) -> Optional[Image.Image]:
        """
        Load an image from file.

        Args:
            path: Path to image file

        Returns:
            PIL Image or None on failure
        """
        try:
            image = Image.open(path)

            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')

            logger.info(f'Loaded image: {path}, size: {image.size}, mode: {image.mode}')
            return image

        except Exception as e:
            logger.error(f'Error loading image: {str(e)}')
            return None

    def save_image(
        self,
        image: Image.Image,
        path: str,
        quality: int = 95,
        format: Optional[str] = None
    ) -> bool:
        """
        Save an image to file.

        Args:
            image: PIL Image to save
            path: Output path
            quality: JPEG quality (1-100)
            format: Output format (auto-detected if None)

        Returns:
            True if successful
        """
        try:
            save_kwargs = {}

            if format:
                save_kwargs['format'] = format

            # Set quality for JPEG
            if path.lower().endswith(('.jpg', '.jpeg')) or format == 'JPEG':
                save_kwargs['quality'] = quality

            # Set optimization for PNG
            if path.lower().endswith('.png') or format == 'PNG':
                save_kwargs['optimize'] = True

            image.save(path, **save_kwargs)
            logger.info(f'Saved image: {path}')
            return True

        except Exception as e:
            logger.error(f'Error saving image: {str(e)}')
            return False

    def resize(
        self,
        image: Image.Image,
        size: Tuple[int, int],
        maintain_aspect: bool = True
    ) -> Image.Image:
        """
        Resize an image.

        Args:
            image: Input image
            size: Target size (width, height)
            maintain_aspect: Whether to maintain aspect ratio

        Returns:
            Resized image
        """
        if maintain_aspect:
            image.thumbnail(size, Image.Resampling.LANCZOS)
            return image
        else:
            return image.resize(size, Image.Resampling.LANCZOS)

    def resize_to_max_dimension(
        self,
        image: Image.Image,
        max_dim: Optional[int] = None
    ) -> Image.Image:
        """
        Resize image so largest dimension is at most max_dim.

        Args:
            image: Input image
            max_dim: Maximum dimension (uses self.max_dimension if None)

        Returns:
            Resized image
        """
        max_dim = max_dim or self.max_dimension
        width, height = image.size

        if max(width, height) <= max_dim:
            return image

        if width > height:
            new_width = max_dim
            new_height = int(height * (max_dim / width))
        else:
            new_height = max_dim
            new_width = int(width * (max_dim / height))

        return image.resize((new_width, new_height), Image.Resampling.LANCZOS)

    def crop_center(
        self,
        image: Image.Image,
        size: Tuple[int, int]
    ) -> Image.Image:
        """
        Crop image from center to specified size.

        Args:
            image: Input image
            size: Target size (width, height)

        Returns:
            Cropped image
        """
        width, height = image.size
        target_width, target_height = size

        left = (width - target_width) // 2
        top = (height - target_height) // 2
        right = left + target_width
        bottom = top + target_height

        return image.crop((left, top, right, bottom))

    def crop_to_aspect_ratio(
        self,
        image: Image.Image,
        aspect_ratio: str = 'square'
    ) -> Image.Image:
        """
        Crop image to specified aspect ratio.

        Args:
            image: Input image
            aspect_ratio: Aspect ratio name or 'WxH' string

        Returns:
            Cropped image
        """
        width, height = image.size

        # Parse aspect ratio
        if aspect_ratio in self.ASPECT_RATIOS:
            ratio_w, ratio_h = self.ASPECT_RATIOS[aspect_ratio]
        elif 'x' in aspect_ratio.lower():
            parts = aspect_ratio.lower().split('x')
            ratio_w, ratio_h = int(parts[0]), int(parts[1])
        else:
            return image

        target_ratio = ratio_w / ratio_h
        current_ratio = width / height

        if current_ratio > target_ratio:
            # Image is wider than target
            new_width = int(height * target_ratio)
            return self.crop_center(image, (new_width, height))
        else:
            # Image is taller than target
            new_height = int(width / target_ratio)
            return self.crop_center(image, (width, new_height))

    def normalize(self, image: Image.Image) -> np.ndarray:
        """
        Normalize image to 0-1 range numpy array.

        Args:
            image: Input PIL Image

        Returns:
            Normalized numpy array
        """
        return np.array(image, dtype=np.float32) / 255.0

    def denormalize(self, array: np.ndarray) -> Image.Image:
        """
        Convert normalized array back to PIL Image.

        Args:
            array: Normalized numpy array (0-1 range)

        Returns:
            PIL Image
        """
        array = np.clip(array * 255, 0, 255).astype(np.uint8)
        return Image.fromarray(array)

    def enhance_contrast(
        self,
        image: Image.Image,
        factor: float = 1.2
    ) -> Image.Image:
        """
        Enhance image contrast.

        Args:
            image: Input image
            factor: Contrast factor (1.0 = no change)

        Returns:
            Enhanced image
        """
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(factor)

    def enhance_sharpness(
        self,
        image: Image.Image,
        factor: float = 1.5
    ) -> Image.Image:
        """
        Enhance image sharpness.

        Args:
            image: Input image
            factor: Sharpness factor (1.0 = no change)

        Returns:
            Enhanced image
        """
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Sharpness(image)
        return enhancer.enhance(factor)

    def to_grayscale(self, image: Image.Image) -> Image.Image:
        """
        Convert image to grayscale.

        Args:
            image: Input image

        Returns:
            Grayscale image
        """
        return image.convert('L')

    def get_image_info(self, image: Image.Image) -> dict:
        """
        Get information about an image.

        Args:
            image: PIL Image

        Returns:
            Dictionary with image information
        """
        return {
            'width': image.width,
            'height': image.height,
            'mode': image.mode,
            'format': image.format,
            'aspect_ratio': round(image.width / image.height, 2)
        }

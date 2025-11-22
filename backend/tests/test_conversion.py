"""
Tests for 2D to 3D Conversion
"""

import os
import pytest
import tempfile
from PIL import Image
import numpy as np

from models.two_d_to_three_d import TwoDToThreeDConverter, DepthEstimator, MeshGenerator


class TestDepthEstimator:
    """Tests for the depth estimation module."""

    def test_init(self):
        """Test depth estimator initialization."""
        estimator = DepthEstimator()
        assert estimator is not None
        assert estimator.model_type == 'midas'

    def test_placeholder_depth(self):
        """Test placeholder depth generation."""
        estimator = DepthEstimator()

        # Create test image
        test_image = Image.new('RGB', (256, 256), color='white')

        # Generate depth
        depth_map = estimator._placeholder_depth(test_image)

        assert depth_map is not None
        assert depth_map.shape == (256, 256)
        assert depth_map.min() >= 0
        assert depth_map.max() <= 1

    def test_normalize_depth(self):
        """Test depth normalization."""
        estimator = DepthEstimator()

        # Create test depth array
        raw_depth = np.array([[0, 50, 100], [25, 75, 125]], dtype=np.float32)

        normalized = estimator._normalize_depth(raw_depth)

        assert normalized.min() == 0
        assert normalized.max() == 1


class TestMeshGenerator:
    """Tests for the mesh generation module."""

    def test_init(self):
        """Test mesh generator initialization."""
        generator = MeshGenerator()
        assert generator is not None

    def test_depth_to_pointcloud(self):
        """Test point cloud generation from depth map."""
        generator = MeshGenerator()

        # Create test data
        test_image = Image.new('RGB', (64, 64), color='red')
        depth_map = np.random.rand(64, 64).astype(np.float32)

        points, colors = generator._depth_to_pointcloud(
            test_image, depth_map, depth_scale=1.0
        )

        assert points.shape[0] == 64 * 64
        assert points.shape[1] == 3
        assert colors.shape[0] == 64 * 64
        assert colors.shape[1] == 3

    def test_placeholder_mesh(self):
        """Test placeholder mesh creation."""
        generator = MeshGenerator()

        points = np.random.rand(100, 3).astype(np.float32)
        colors = np.random.rand(100, 3).astype(np.float32)

        mesh = generator._create_placeholder_mesh(points, colors)

        assert mesh is not None
        assert 'vertices' in mesh
        assert 'faces' in mesh
        assert mesh['vertex_count'] == 100


class TestTwoDToThreeDConverter:
    """Tests for the main converter class."""

    def test_init(self):
        """Test converter initialization."""
        converter = TwoDToThreeDConverter()
        assert converter is not None
        assert not converter._initialized

    def test_supported_formats(self):
        """Test getting supported formats."""
        converter = TwoDToThreeDConverter()
        formats = converter.get_supported_formats()

        assert 'input_formats' in formats
        assert 'output_formats' in formats
        assert 'quality_levels' in formats
        assert 'png' in formats['input_formats']
        assert 'glb' in formats['output_formats']

    def test_load_image(self):
        """Test image loading."""
        converter = TwoDToThreeDConverter()

        # Create temporary test image
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            test_image = Image.new('RGB', (512, 512), color='blue')
            test_image.save(f.name)

            loaded = converter._load_image(f.name, 'medium')

            assert loaded is not None
            assert loaded.mode == 'RGB'
            assert max(loaded.size) <= 512

            os.unlink(f.name)

    def test_convert_invalid_path(self):
        """Test conversion with invalid input path."""
        converter = TwoDToThreeDConverter()

        result = converter.convert(
            input_path='/nonexistent/path/image.png',
            output_path='/tmp/output',
            output_format='glb',
            quality='medium'
        )

        assert not result['success']
        assert 'error' in result


class TestConversionIntegration:
    """Integration tests for the full conversion pipeline."""

    @pytest.fixture
    def test_image_path(self):
        """Create a temporary test image."""
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
            # Create a gradient image for better depth estimation
            img = Image.new('RGB', (256, 256))
            pixels = img.load()
            for i in range(256):
                for j in range(256):
                    pixels[i, j] = (i, j, (i + j) // 2)
            img.save(f.name)
            yield f.name
            os.unlink(f.name)

    @pytest.fixture
    def output_dir(self):
        """Create a temporary output directory."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    def test_full_conversion_pipeline(self, test_image_path, output_dir):
        """Test the full conversion from 2D image to 3D model."""
        converter = TwoDToThreeDConverter()

        output_path = os.path.join(output_dir, 'test_model')

        result = converter.convert(
            input_path=test_image_path,
            output_path=output_path,
            output_format='obj',  # OBJ for placeholder export
            quality='low'
        )

        assert result['success']
        assert 'output_path' in result
        assert os.path.exists(result['output_path'])


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

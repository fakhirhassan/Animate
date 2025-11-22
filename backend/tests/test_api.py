"""
Tests for API Endpoints
"""

import os
import io
import pytest
import tempfile
from PIL import Image

# Import app factory
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app


@pytest.fixture
def app():
    """Create application for testing."""
    app = create_app('testing')
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def test_image():
    """Create a test image file."""
    img = Image.new('RGB', (256, 256), color='blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    return img_bytes


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_check(self, client):
        """Test the health check endpoint."""
        response = client.get('/health')
        assert response.status_code == 200

        data = response.get_json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'AniMate Backend'

    def test_root_endpoint(self, client):
        """Test the root endpoint."""
        response = client.get('/')
        assert response.status_code == 200

        data = response.get_json()
        assert 'message' in data
        assert 'endpoints' in data


class TestConversionEndpoints:
    """Tests for conversion API endpoints."""

    def test_supported_formats(self, client):
        """Test getting supported formats."""
        response = client.get('/api/convert/supported-formats')
        assert response.status_code == 200

        data = response.get_json()
        assert data['success']
        assert 'input_formats' in data['data']
        assert 'output_formats' in data['data']

    def test_convert_no_file(self, client):
        """Test conversion without file."""
        response = client.post('/api/convert/2d-to-3d')
        assert response.status_code == 400

        data = response.get_json()
        assert not data['success']
        assert 'No file provided' in data['message']

    def test_convert_empty_filename(self, client, test_image):
        """Test conversion with empty filename."""
        response = client.post(
            '/api/convert/2d-to-3d',
            data={'file': (test_image, '')},
            content_type='multipart/form-data'
        )
        assert response.status_code == 400

    def test_convert_invalid_format(self, client, test_image):
        """Test conversion with invalid output format."""
        response = client.post(
            '/api/convert/2d-to-3d',
            data={
                'file': (test_image, 'test.png'),
                'output_format': 'invalid'
            },
            content_type='multipart/form-data'
        )
        assert response.status_code == 400

        data = response.get_json()
        assert 'Invalid output format' in data['message']

    def test_convert_invalid_quality(self, client, test_image):
        """Test conversion with invalid quality."""
        response = client.post(
            '/api/convert/2d-to-3d',
            data={
                'file': (test_image, 'test.png'),
                'quality': 'ultra'
            },
            content_type='multipart/form-data'
        )
        assert response.status_code == 400

        data = response.get_json()
        assert 'Invalid quality' in data['message']

    def test_status_invalid_job_id(self, client):
        """Test status check with invalid job ID."""
        response = client.get('/api/convert/status/invalid-id')
        assert response.status_code == 400

        data = response.get_json()
        assert 'Invalid job ID format' in data['message']

    def test_download_invalid_job_id(self, client):
        """Test download with invalid job ID."""
        response = client.get('/api/convert/download/invalid-id')
        assert response.status_code == 400


class TestAuthEndpoints:
    """Tests for authentication endpoints."""

    def test_login_no_data(self, client):
        """Test login without data."""
        response = client.post('/api/auth/login')
        assert response.status_code == 400

    def test_login_missing_fields(self, client):
        """Test login with missing fields."""
        response = client.post(
            '/api/auth/login',
            json={'email': 'test@example.com'}
        )
        assert response.status_code == 400

        data = response.get_json()
        assert 'required' in data['message'].lower()

    def test_login_success(self, client):
        """Test successful login (mock)."""
        response = client.post(
            '/api/auth/login',
            json={
                'email': 'test@example.com',
                'password': 'password123'
            }
        )
        assert response.status_code == 200

        data = response.get_json()
        assert data['success']
        assert 'user' in data['data']
        assert 'token' in data['data']

    def test_signup_no_data(self, client):
        """Test signup without data."""
        response = client.post('/api/auth/signup')
        assert response.status_code == 400

    def test_signup_success(self, client):
        """Test successful signup (mock)."""
        response = client.post(
            '/api/auth/signup',
            json={
                'name': 'Test User',
                'email': 'newuser@example.com',
                'password': 'password123',
                'role': 'creator'
            }
        )
        assert response.status_code == 200

        data = response.get_json()
        assert data['success']
        assert 'user' in data['data']

    def test_logout(self, client):
        """Test logout endpoint."""
        response = client.post('/api/auth/logout')
        assert response.status_code == 200

    def test_get_current_user(self, client):
        """Test getting current user (mock)."""
        response = client.get('/api/auth/me')
        assert response.status_code == 200


class TestAnimationEndpoints:
    """Tests for animation API endpoints."""

    def test_list_styles(self, client):
        """Test listing animation styles."""
        response = client.get('/api/animation/styles')
        assert response.status_code == 200

        data = response.get_json()
        assert data['success']
        assert 'styles' in data['data']

    def test_list_templates(self, client):
        """Test listing animation templates."""
        response = client.get('/api/animation/templates')
        assert response.status_code == 200

        data = response.get_json()
        assert data['success']
        assert 'templates' in data['data']


class TestVoiceEndpoints:
    """Tests for voice API endpoints."""

    def test_list_voices(self, client):
        """Test listing available voices."""
        response = client.get('/api/voice/voices')
        assert response.status_code == 200

        data = response.get_json()
        assert data['success']
        assert 'voices' in data['data']
        assert 'languages' in data['data']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

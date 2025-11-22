"""
Configuration classes for different environments.
"""

import os
from datetime import timedelta


class Config:
    """Base configuration class."""

    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')

    # CORS settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:3001').split(',')

    # File upload settings
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'webm', 'mov'}
    ALLOWED_3D_EXTENSIONS = {'obj', 'glb', 'gltf', 'fbx'}

    # Model settings
    MODEL_WEIGHTS_PATH = os.getenv('MODEL_WEIGHTS_PATH', 'models/two_d_to_three_d/model_weights')

    # API settings
    API_RATE_LIMIT = os.getenv('API_RATE_LIMIT', '100 per hour')

    # JWT settings (for future auth)
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Database settings (for future use)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # External API keys (for future integrations)
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY', '')

    # Storage settings
    USE_S3_STORAGE = os.getenv('USE_S3_STORAGE', 'false').lower() == 'true'
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET', '')
    AWS_S3_REGION = os.getenv('AWS_S3_REGION', 'us-east-1')

    # Processing settings
    MAX_PROCESSING_TIME = 300  # 5 minutes max processing time
    ENABLE_GPU = os.getenv('ENABLE_GPU', 'true').lower() == 'true'


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    TESTING = False

    # Development database (SQLite)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///dev_animate.db'
    )

    # More verbose logging in development
    LOG_LEVEL = 'DEBUG'


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False

    # Production database (PostgreSQL recommended)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', '')

    # Stricter security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # Production logging
    LOG_LEVEL = 'INFO'

    # Override CORS for production
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'https://your-production-domain.com').split(',')


class TestingConfig(Config):
    """Testing configuration."""

    DEBUG = True
    TESTING = True

    # Test database
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test_animate.db'

    # Disable rate limiting in tests
    API_RATE_LIMIT = '1000 per hour'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

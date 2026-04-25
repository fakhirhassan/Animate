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
    MAX_PROCESSING_TIME = 600  # 10 minutes max processing time (video gen is slow)
    ENABLE_GPU = os.getenv('ENABLE_GPU', 'true').lower() == 'true'

    # RunPod Cloud GPU settings
    # Set GPU_MODE to 'cloud' to use RunPod, 'local' for local GPU, 'auto' tries local first
    GPU_MODE = os.getenv('GPU_MODE', 'auto')  # 'local', 'cloud', 'auto'
    RUNPOD_API_KEY = os.getenv('RUNPOD_API_KEY', '')
    RUNPOD_ENDPOINT_ID = os.getenv('RUNPOD_ENDPOINT_ID', '')
    RUNPOD_T2I_ENDPOINT_ID = os.getenv('RUNPOD_T2I_ENDPOINT_ID', '')
    # 3D endpoint (TRELLIS). Falls back to RUNPOD_ENDPOINT_ID if unset.
    RUNPOD_3D_ENDPOINT_ID = os.getenv('RUNPOD_3D_ENDPOINT_ID', '')

    # Animation pipeline settings
    VIDEO_MODEL = os.getenv('VIDEO_MODEL', '1.3b')
    DEFAULT_VOICE = os.getenv('DEFAULT_VOICE', 'af_heart')
    DEFAULT_NUM_CLIPS = int(os.getenv('DEFAULT_NUM_CLIPS', '4'))
    # RTX A4000: 81 frames = 5s clips at 16fps (was 33=2s on Mac, GPU is much faster)
    DEFAULT_FRAMES_PER_CLIP = int(os.getenv('DEFAULT_FRAMES_PER_CLIP', '81'))
    # RTX A4000: use standard 480p (832x480) — was cramped 448x256 on Mac
    DEFAULT_VIDEO_WIDTH = int(os.getenv('DEFAULT_VIDEO_WIDTH', '832'))
    DEFAULT_VIDEO_HEIGHT = int(os.getenv('DEFAULT_VIDEO_HEIGHT', '480'))
    # RTX A4000: more inference steps = better quality (faster than Mac)
    DEFAULT_INFERENCE_STEPS = int(os.getenv('DEFAULT_INFERENCE_STEPS', '30'))


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

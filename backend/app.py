"""
AniMate Flask Backend
Main application entry point for AI-powered animation generation.
"""

import os
import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import configuration
from config import config

# Import API routes
from api import conversion_routes, auth_routes, script_routes, voice_routes, animation_routes, admin_routes


def create_app(config_name=None):
    """
    Application factory pattern for Flask app creation.

    Args:
        config_name: Configuration environment (development, production, testing)

    Returns:
        Flask application instance
    """
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Configure logging
    setup_logging(app)

    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        },
        r"/uploads/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "OPTIONS"],
            "allow_headers": ["Content-Type"],
            "supports_credentials": False
        }
    })

    # Register blueprints (API routes)
    register_blueprints(app)

    # Register error handlers
    register_error_handlers(app)

    # Create upload directories if they don't exist
    create_upload_directories(app)

    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'service': 'AniMate Backend',
            'version': '1.0.0'
        }), 200

    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'message': 'Welcome to AniMate AI Backend',
            'version': '1.0.0',
            'endpoints': {
                'health': '/health',
                'api': '/api',
                'conversion': '/api/convert',
                'auth': '/api/auth',
            }
        }), 200

    # Serve uploaded files (images and models)
    @app.route('/uploads/<path:filename>', methods=['GET'])
    def serve_upload(filename):
        """Serve uploaded files (images, models, etc.)"""
        upload_folder = app.config['UPLOAD_FOLDER']
        return send_from_directory(upload_folder, filename)

    app.logger.info(f'AniMate backend started in {config_name} mode')

    return app


def setup_logging(app):
    """Configure application logging."""
    log_level = logging.DEBUG if app.config['DEBUG'] else logging.INFO

    # Create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # File handler for logging
    file_handler = logging.FileHandler('logs/animate.log')
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))

    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    app.logger.setLevel(log_level)


def register_blueprints(app):
    """Register all API blueprints."""
    app.register_blueprint(conversion_routes.bp, url_prefix='/api/convert')
    app.register_blueprint(auth_routes.bp, url_prefix='/api/auth')
    app.register_blueprint(script_routes.bp, url_prefix='/api/script')
    app.register_blueprint(voice_routes.bp, url_prefix='/api/voice')
    app.register_blueprint(animation_routes.bp, url_prefix='/api/animation')
    app.register_blueprint(admin_routes.bp, url_prefix='/api/admin')

    app.logger.info('All blueprints registered successfully')


def register_error_handlers(app):
    """Register global error handlers."""

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'error': 'Bad Request',
            'message': str(error.description) if hasattr(error, 'description') else 'Invalid request'
        }), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'success': False,
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': 'Access denied'
        }), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Not Found',
            'message': 'Resource not found'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Internal server error: {error}')
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500


def create_upload_directories(app):
    """Create necessary upload directories."""
    directories = [
        app.config['UPLOAD_FOLDER'],
        os.path.join(app.config['UPLOAD_FOLDER'], 'input'),
        os.path.join(app.config['UPLOAD_FOLDER'], 'output'),
        'logs'
    ]

    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            app.logger.info(f'Created directory: {directory}')


# Create the application instance
app = create_app()


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'

    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )

#!/usr/bin/env python3
"""
Database Setup Script
Initializes the database and creates necessary tables.
"""

import os
import sys
import argparse
import logging

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def setup_database(env: str = 'development'):
    """
    Setup the database for the specified environment.

    Args:
        env: Environment (development, production, testing)
    """
    logger.info(f'Setting up database for {env} environment...')

    # Set environment
    os.environ['FLASK_ENV'] = env

    try:
        from app import create_app
        from database.models import db

        app = create_app(env)

        with app.app_context():
            # Create all tables
            db.create_all()
            logger.info('Database tables created successfully')

            # Print table info
            tables = db.engine.table_names()
            logger.info(f'Tables created: {tables}')

    except ImportError as e:
        logger.warning(f'Database models not yet implemented: {str(e)}')
        logger.info('Skipping database setup - will be implemented later')

    except Exception as e:
        logger.error(f'Database setup failed: {str(e)}')
        sys.exit(1)


def create_admin_user(email: str, password: str, name: str = 'Admin'):
    """
    Create an admin user.

    Args:
        email: Admin email
        password: Admin password
        name: Admin name
    """
    logger.info(f'Creating admin user: {email}')

    try:
        from app import create_app
        from database.models import db, User

        app = create_app('development')

        with app.app_context():
            # Check if user exists
            existing = User.query.filter_by(email=email).first()
            if existing:
                logger.warning(f'User already exists: {email}')
                return

            # Create admin user
            admin = User(
                name=name,
                email=email,
                role='admin'
            )
            admin.set_password(password)

            db.session.add(admin)
            db.session.commit()

            logger.info('Admin user created successfully')

    except ImportError:
        logger.warning('User model not yet implemented')

    except Exception as e:
        logger.error(f'Failed to create admin user: {str(e)}')


def seed_test_data():
    """Seed the database with test data."""
    logger.info('Seeding test data...')

    try:
        from app import create_app
        from database.models import db

        app = create_app('development')

        with app.app_context():
            # TODO: Add test data seeding
            logger.info('Test data seeding not yet implemented')

    except ImportError:
        logger.warning('Database models not yet implemented')


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Database setup and management for AniMate'
    )
    parser.add_argument(
        '--env',
        type=str,
        choices=['development', 'production', 'testing'],
        default='development',
        help='Environment (default: development)'
    )
    parser.add_argument(
        '--create-admin',
        action='store_true',
        help='Create admin user'
    )
    parser.add_argument(
        '--admin-email',
        type=str,
        default='admin@animate.ai',
        help='Admin email'
    )
    parser.add_argument(
        '--admin-password',
        type=str,
        default='admin123',
        help='Admin password'
    )
    parser.add_argument(
        '--seed',
        action='store_true',
        help='Seed test data'
    )

    args = parser.parse_args()

    logger.info('AniMate Database Setup')
    logger.info('=' * 50)

    # Setup database
    setup_database(args.env)

    # Create admin if requested
    if args.create_admin:
        create_admin_user(
            email=args.admin_email,
            password=args.admin_password
        )

    # Seed data if requested
    if args.seed:
        seed_test_data()

    logger.info('Database setup complete!')


if __name__ == '__main__':
    main()

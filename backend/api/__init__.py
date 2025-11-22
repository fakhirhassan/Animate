"""
API Routes Package
Contains all API endpoint blueprints for AniMate backend.
"""

from . import conversion_routes
from . import auth_routes
from . import script_routes
from . import voice_routes
from . import animation_routes

__all__ = [
    'conversion_routes',
    'auth_routes',
    'script_routes',
    'voice_routes',
    'animation_routes'
]

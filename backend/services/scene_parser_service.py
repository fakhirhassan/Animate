"""
Scene Parser Service
Wraps the SceneParser model for use by API routes.
"""

import logging
from typing import Dict, Any, Optional

from models.script_processor.scene_parser import SceneParser

logger = logging.getLogger(__name__)

# Singleton instance
_parser: Optional[SceneParser] = None


def get_parser() -> SceneParser:
    """Get or create the scene parser singleton."""
    global _parser
    if _parser is None:
        _parser = SceneParser()
    return _parser


def check_availability() -> Dict[str, Any]:
    """Check if the scene parser (Ollama) is available."""
    parser = get_parser()
    available = parser.is_available()
    return {
        "available": available,
        "model": parser.model_name,
        "message": "Ready" if available else "Ollama not running or model not pulled",
    }


def parse_scene(script_text: str) -> Dict[str, Any]:
    """
    Parse a text description into structured scene data.

    Args:
        script_text: Natural language scene description

    Returns:
        Structured scene data

    Raises:
        RuntimeError: If Ollama is not available
        ValueError: If LLM response cannot be parsed
    """
    parser = get_parser()
    scene_data = parser.parse(script_text)
    logger.info(
        f"Scene parsed: {len(scene_data.get('objects', []))} objects, "
        f"{len(scene_data.get('actions', []))} actions, "
        f"duration={scene_data.get('duration')}s"
    )
    return scene_data

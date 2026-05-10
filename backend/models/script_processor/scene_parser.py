"""
Scene Parser using Ollama (Llama 3.1)
Converts user text descriptions into structured scene JSON.
"""

import json
import logging
import re
from typing import Dict, Any, Optional

import ollama

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a 3D animation scene parser. Given a text description of a scene, you must output ONLY valid JSON (no markdown, no explanation) that describes the scene with the following structure:

{
  "objects": [
    {
      "name": "unique_object_id",
      "description": "detailed description for 3D model generation",
      "position": [x, y, z],
      "scale": [1, 1, 1],
      "rotation": [0, 0, 0]
    }
  ],
  "actions": [
    {
      "object": "object_name",
      "type": "move|rotate|scale|bounce|wave",
      "target": [x, y, z],
      "duration": 2.0,
      "delay": 0.0,
      "easing": "linear|easeIn|easeOut|easeInOut"
    }
  ],
  "dialogue": [
    {
      "object": "object_name",
      "text": "what they say",
      "timestamp": 1.0,
      "emotion": "neutral|happy|sad|angry|excited|scared"
    }
  ],
  "music": {
    "style": "description of background music mood and genre",
    "duration": 5
  },
  "camera": {
    "position": [x, y, z],
    "lookAt": [0, 0, 0]
  },
  "duration": 5,
  "title": "Short scene title"
}

Rules:
- Position objects on a ground plane (y=0 for ground level)
- Keep positions reasonable (-10 to 10 range for x,z)
- Objects should be spaced apart so they don't overlap
- Camera should be positioned to see all objects (typically z=8-15, y=3-6)
- Duration should match the actions described
- Each object needs a unique name (lowercase, underscores)
- Description should be detailed enough for 3D model generation (e.g. "a red cartoon duck with orange feet" not just "duck")
- Output ONLY the JSON object, nothing else"""

MODEL_NAME = "llama3.1:8b"


class SceneParser:
    """Parses text descriptions into structured scene data using Ollama."""

    def __init__(self, model_name: str = MODEL_NAME):
        self.model_name = model_name
        self._available = None
        logger.info(f"SceneParser initialized with model: {model_name}")

    def is_available(self) -> bool:
        """Check if Ollama and the model are available."""
        if self._available is not None:
            return self._available
        try:
            models = ollama.list()
            model_names = [m.model for m in models.models]
            self._available = any(self.model_name in name for name in model_names)
            if not self._available:
                logger.warning(
                    f"Model {self.model_name} not found. Available: {model_names}"
                )
            return self._available
        except Exception as e:
            logger.error(f"Ollama not available: {e}")
            self._available = False
            return False

    def parse(self, user_text: str) -> Dict[str, Any]:
        """
        Parse a text description into a structured scene.

        Args:
            user_text: Natural language scene description

        Returns:
            Structured scene data dict
        """
        if not self.is_available():
            raise RuntimeError(
                "Ollama is not running or model is not available. "
                f"Run: ollama pull {self.model_name}"
            )

        logger.info(f"Parsing scene: {user_text[:100]}...")

        # Wrap the user's prompt so the model treats it as data to transform,
        # not a request directed at itself. This avoids spurious refusals
        # like "I can't help you with that" on perfectly benign scene text.
        framed_user = (
            "Convert the following scene description into the JSON schema "
            "defined in the system message. Output JSON only.\n\n"
            f"Scene description:\n{user_text}"
        )

        response = ollama.chat(
            model=self.model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": framed_user},
            ],
            # format="json" forces Ollama to emit syntactically valid JSON,
            # which both prevents prose-style refusals and removes the need
            # to strip markdown fences.
            format="json",
            options={"temperature": 0.3, "num_predict": 2048},
        )

        raw = response.message.content.strip()
        logger.info(f"Ollama response ({len(raw)} chars): {raw[:300]}")

        if not raw:
            raise ValueError("Ollama returned an empty response")

        try:
            scene = self._extract_json(raw)
        except ValueError as e:
            logger.error(
                f"Scene parse failed.\n  User input: {user_text[:200]}\n"
                f"  Ollama said: {raw[:300]}"
            )
            raise

        scene = self._validate_scene(scene)
        return scene

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract JSON from LLM response, handling markdown code blocks."""
        # Try direct parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting from markdown code block
        match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Try finding first { to last }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Could not parse JSON from LLM response: {text[:200]}")

    def _validate_scene(self, scene: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and fill defaults for scene data."""
        # Ensure required keys
        if "objects" not in scene:
            scene["objects"] = []
        if "actions" not in scene:
            scene["actions"] = []
        if "dialogue" not in scene:
            scene["dialogue"] = []
        if "duration" not in scene:
            scene["duration"] = 5
        if "title" not in scene:
            scene["title"] = "Untitled Scene"

        if "camera" not in scene:
            scene["camera"] = {"position": [0, 4, 10], "lookAt": [0, 0, 0]}

        if "music" not in scene:
            scene["music"] = {"style": "ambient background", "duration": scene["duration"]}

        # Validate objects
        for obj in scene["objects"]:
            if "name" not in obj:
                obj["name"] = "unnamed_object"
            if "description" not in obj:
                obj["description"] = obj["name"]
            if "position" not in obj:
                obj["position"] = [0, 0, 0]
            if "scale" not in obj:
                obj["scale"] = [1, 1, 1]
            if "rotation" not in obj:
                obj["rotation"] = [0, 0, 0]

        # Validate actions
        for action in scene["actions"]:
            if "type" not in action:
                action["type"] = "move"
            if "duration" not in action:
                action["duration"] = 2.0
            if "delay" not in action:
                action["delay"] = 0.0
            if "easing" not in action:
                action["easing"] = "easeInOut"

        # Validate dialogue
        for line in scene["dialogue"]:
            if "timestamp" not in line:
                line["timestamp"] = 0.0
            if "emotion" not in line:
                line["emotion"] = "neutral"

        return scene

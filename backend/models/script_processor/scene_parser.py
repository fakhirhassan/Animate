"""
Scene Parser
Converts user text descriptions into structured scene JSON.
Auto-routes between Gemini, Groq, and local Ollama based on which
API keys are configured (Gemini > Groq > Ollama).
"""

import json
import logging
import os
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '').strip()
GROQ_MODEL = os.getenv('GROQ_SCENE_MODEL', 'llama-3.1-8b-instant')
GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '').strip()
GEMINI_MODEL = os.getenv('GEMINI_SCENE_MODEL', 'gemini-2.0-flash')
GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

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
        self.backend = self._select_backend()
        logger.info(f"SceneParser initialized: backend={self.backend}, model={model_name}")

    @staticmethod
    def _select_backend() -> str:
        if GEMINI_API_KEY:
            return 'gemini'
        if GROQ_API_KEY:
            return 'groq'
        return 'ollama'

    def is_available(self) -> bool:
        """Check if the selected backend is reachable."""
        if self._available is not None:
            return self._available
        if self.backend in ('gemini', 'groq'):
            self._available = True
            return True
        try:
            import ollama
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
                f"Scene parser backend '{self.backend}' is not available. "
                f"For Ollama, run: ollama pull {self.model_name}"
            )

        logger.info(f"Parsing scene via {self.backend}: {user_text[:100]}...")

        framed_user = (
            "Convert the following scene description into the JSON schema "
            "defined in the system message. Output JSON only.\n\n"
            f"Scene description:\n{user_text}"
        )

        if self.backend == 'gemini':
            raw = self._parse_via_gemini(framed_user)
        elif self.backend == 'groq':
            raw = self._parse_via_groq(framed_user)
        else:
            raw = self._parse_via_ollama(framed_user)

        logger.info(f"{self.backend} response ({len(raw)} chars): {raw[:300]}")

        if not raw:
            raise ValueError(f"{self.backend} returned an empty response")

        try:
            scene = self._extract_json(raw)
        except ValueError:
            logger.error(
                f"Scene parse failed.\n  User input: {user_text[:200]}\n"
                f"  {self.backend} said: {raw[:300]}"
            )
            raise

        scene = self._validate_scene(scene)
        return scene

    def _parse_via_ollama(self, framed_user: str) -> str:
        import ollama
        response = ollama.chat(
            model=self.model_name,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": framed_user},
            ],
            format="json",
            options={"temperature": 0.3, "num_predict": 2048},
        )
        return response.message.content.strip()

    def _parse_via_groq(self, framed_user: str) -> str:
        import requests
        resp = requests.post(
            GROQ_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json',
            },
            json={
                'model': GROQ_MODEL,
                'messages': [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": framed_user},
                ],
                'temperature': 0.3,
                'max_tokens': 2048,
                'response_format': {'type': 'json_object'},
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()['choices'][0]['message']['content'].strip()

    def _parse_via_gemini(self, framed_user: str) -> str:
        import requests
        payload = {
            'contents': [
                {'role': 'user', 'parts': [{'text': framed_user}]},
            ],
            'systemInstruction': {'parts': [{'text': SYSTEM_PROMPT}]},
            'generationConfig': {
                'temperature': 0.3,
                'maxOutputTokens': 2048,
                'responseMimeType': 'application/json',
            },
        }
        resp = requests.post(
            f'{GEMINI_URL}/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}',
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        candidates = data.get('candidates', [])
        if not candidates:
            raise RuntimeError(f'Gemini returned no candidates: {data}')
        parts = candidates[0].get('content', {}).get('parts', [])
        return ''.join(p.get('text', '') for p in parts).strip()

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

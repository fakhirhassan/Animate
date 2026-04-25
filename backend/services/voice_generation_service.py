"""
Voice Generation Service
Text-to-speech using Kokoro-82M TTS.
Fast, natural-sounding, runs locally on Mac M4 Pro.
"""

import gc
import logging
import os
import uuid
from typing import Dict, Any, Optional, List

import numpy as np

logger = logging.getLogger(__name__)

_pipeline = None
SAMPLE_RATE = 24000
OUTPUT_DIR = "uploads/output/audio"

# Available Kokoro voices
KOKORO_VOICES = {
    "af_heart": {"name": "Heart (Female)", "language": "en-us"},
    "af_alloy": {"name": "Alloy (Female)", "language": "en-us"},
    "af_aoede": {"name": "Aoede (Female)", "language": "en-us"},
    "af_bella": {"name": "Bella (Female)", "language": "en-us"},
    "af_jessica": {"name": "Jessica (Female)", "language": "en-us"},
    "af_kore": {"name": "Kore (Female)", "language": "en-us"},
    "af_nicole": {"name": "Nicole (Female)", "language": "en-us"},
    "af_nova": {"name": "Nova (Female)", "language": "en-us"},
    "af_river": {"name": "River (Female)", "language": "en-us"},
    "af_sarah": {"name": "Sarah (Female)", "language": "en-us"},
    "af_sky": {"name": "Sky (Female)", "language": "en-us"},
    "am_adam": {"name": "Adam (Male)", "language": "en-us"},
    "am_echo": {"name": "Echo (Male)", "language": "en-us"},
    "am_eric": {"name": "Eric (Male)", "language": "en-us"},
    "am_liam": {"name": "Liam (Male)", "language": "en-us"},
    "am_michael": {"name": "Michael (Male)", "language": "en-us"},
    "am_onyx": {"name": "Onyx (Male)", "language": "en-us"},
    "bf_emma": {"name": "Emma (Female, British)", "language": "en-gb"},
    "bf_isabella": {"name": "Isabella (Female, British)", "language": "en-gb"},
    "bm_daniel": {"name": "Daniel (Male, British)", "language": "en-gb"},
    "bm_fable": {"name": "Fable (Male, British)", "language": "en-gb"},
    "bm_george": {"name": "George (Male, British)", "language": "en-gb"},
    "bm_lewis": {"name": "Lewis (Male, British)", "language": "en-gb"},
}

DEFAULT_VOICE = "af_heart"


def _load_pipeline():
    """Load Kokoro TTS pipeline (lazy loading)."""
    global _pipeline
    if _pipeline is not None:
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    logger.info("Loading Kokoro-82M TTS pipeline...")
    from kokoro import KPipeline

    # 'a' = American English, 'b' = British English
    _pipeline = KPipeline(lang_code='a')
    logger.info("Kokoro-82M TTS pipeline loaded")


def generate_speech(
    text: str,
    voice_preset: str = DEFAULT_VOICE,
) -> Dict[str, Any]:
    """
    Generate speech audio from text using Kokoro-82M.

    Args:
        text: Text to convert to speech
        voice_preset: Kokoro voice ID (e.g., 'af_heart', 'am_adam')

    Returns:
        Dict with audio_url, filename, duration, filepath
    """
    _load_pipeline()

    # Map old Bark presets to Kokoro voices for backwards compatibility
    if voice_preset.startswith("v2/en_speaker"):
        voice_preset = DEFAULT_VOICE

    if voice_preset not in KOKORO_VOICES:
        logger.warning(f"Unknown voice '{voice_preset}', using default '{DEFAULT_VOICE}'")
        voice_preset = DEFAULT_VOICE

    logger.info(f"Generating speech: '{text[:80]}...' with voice {voice_preset}")

    # Generate audio — Kokoro handles long text automatically
    all_audio = []
    for _, _, audio in _pipeline(text, voice=voice_preset):
        all_audio.append(audio)

    if not all_audio:
        raise RuntimeError("Kokoro TTS produced no audio output")

    # Concatenate all audio segments
    full_audio = np.concatenate(all_audio) if len(all_audio) > 1 else all_audio[0]

    # Save as WAV
    import soundfile as sf

    audio_id = str(uuid.uuid4())[:8]
    filename = f"speech_{audio_id}.wav"
    filepath = os.path.join(OUTPUT_DIR, filename)

    sf.write(filepath, full_audio, SAMPLE_RATE)

    duration = len(full_audio) / SAMPLE_RATE
    audio_url = f"/uploads/output/audio/{filename}"

    logger.info(f"Speech saved: {filepath} ({duration:.1f}s)")

    return {
        "audio_id": audio_id,
        "audio_url": audio_url,
        "filename": filename,
        "filepath": filepath,
        "duration": round(duration, 2),
        "voice_preset": voice_preset,
    }


def get_voice_gender(voice_preset: str) -> str:
    """Return 'male', 'female', or 'neutral' for a Kokoro voice preset.

    Kokoro naming convention: 'af_*' / 'bf_*' = female, 'am_*' / 'bm_*' = male.
    """
    if not voice_preset:
        return "neutral"
    prefix = voice_preset[:2].lower()
    if prefix in ("af", "bf"):
        return "female"
    if prefix in ("am", "bm"):
        return "male"
    info = KOKORO_VOICES.get(voice_preset, {})
    name = info.get("name", "").lower()
    if "female" in name:
        return "female"
    if "male" in name:
        return "male"
    return "neutral"


def get_available_voices() -> List[Dict[str, str]]:
    """Return list of available Kokoro voice presets."""
    return [
        {
            "id": vid,
            "name": info["name"],
            "language": info["language"],
            "gender": get_voice_gender(vid),
        }
        for vid, info in KOKORO_VOICES.items()
    ]


def unload_model():
    """Unload Kokoro model to free memory."""
    global _pipeline
    if _pipeline is not None:
        del _pipeline
        _pipeline = None
        gc.collect()
        logger.info("Kokoro TTS model unloaded")

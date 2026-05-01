"""
Video Edit API Routes
Renders an edited version of an existing video asset (trim, crop, music, voice)
and saves the result as a new conversion row.
"""

import os
import uuid
import logging
import shutil
from flask import Blueprint, request

from utils.response_formatter import success_response, error_response
from utils.auth import login_required
from services.conversion_db_service import ConversionDatabaseService

bp = Blueprint("edit", __name__)
logger = logging.getLogger(__name__)


_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC_UPLOAD_DIR = os.path.join(_BACKEND_DIR, "uploads", "input", "music")
SOURCE_UPLOAD_DIR = os.path.join(_BACKEND_DIR, "uploads", "input", "edits")

ALLOWED_VIDEO_EXTS = (".mp4", ".mov", ".webm", ".mkv", ".m4v")
MAX_VIDEO_BYTES = 100 * 1024 * 1024  # 100MB, matches MAX_CONTENT_LENGTH


def _file_size_str(rel_url: str) -> str:
    try:
        rel = rel_url.lstrip("/")
        full = os.path.join(_BACKEND_DIR, rel)
        if os.path.exists(full):
            return f"{os.path.getsize(full) / (1024 * 1024):.2f} MB"
    except Exception:
        pass
    return ""


@bp.route("/voices", methods=["GET"])
def list_voices():
    """Return the Kokoro voice presets the editor can mux in."""
    try:
        from services.voice_generation_service import KOKORO_VOICES
        presets = [
            {"id": vid, "name": meta["name"], "language": meta["language"]}
            for vid, meta in KOKORO_VOICES.items()
        ]
        return success_response({"presets": presets}, "OK")
    except Exception as e:
        logger.error(f"Voice list error: {e}")
        return error_response("Failed to load voices", 500)


@bp.route("/upload-music", methods=["POST"])
@login_required
def upload_music():
    """
    Upload an audio file to use as background music in an edit.
    Returns a /uploads/... URL the client passes back to /render.
    """
    try:
        if "file" not in request.files:
            return error_response("No file provided", 400)
        file = request.files["file"]
        if not file.filename:
            return error_response("No file selected", 400)

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in (".mp3", ".wav", ".m4a", ".aac", ".ogg"):
            return error_response("Unsupported audio format", 400)

        os.makedirs(MUSIC_UPLOAD_DIR, exist_ok=True)
        new_id = str(uuid.uuid4())[:8]
        new_name = f"music_{new_id}{ext}"
        full_path = os.path.join(MUSIC_UPLOAD_DIR, new_name)
        file.save(full_path)

        url = f"/uploads/input/music/{new_name}"
        return success_response({"url": url, "filename": new_name}, "Uploaded")
    except Exception as e:
        logger.error(f"Music upload error: {e}")
        return error_response(f"Upload failed: {e}", 500)


@bp.route("/upload-source", methods=["POST"])
@login_required
def upload_source():
    """
    Upload a video from the user's computer to use as the edit source.
    Returns a /uploads/... URL the client passes back to /render as `source_url`.
    """
    try:
        if "file" not in request.files:
            return error_response("No file provided", 400)
        file = request.files["file"]
        if not file.filename:
            return error_response("No file selected", 400)

        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_VIDEO_EXTS:
            return error_response(
                f"Unsupported video format. Allowed: {', '.join(ALLOWED_VIDEO_EXTS)}",
                400,
            )

        # Size check (Flask's MAX_CONTENT_LENGTH would catch this too, but a
        # nicer error message helps the user understand what's wrong).
        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size > MAX_VIDEO_BYTES:
            return error_response(
                f"Video too large ({size / (1024 * 1024):.1f}MB). Max 100MB.",
                400,
            )

        os.makedirs(SOURCE_UPLOAD_DIR, exist_ok=True)
        new_id = str(uuid.uuid4())[:8]
        new_name = f"upload_{new_id}{ext}"
        full_path = os.path.join(SOURCE_UPLOAD_DIR, new_name)
        file.save(full_path)

        url = f"/uploads/input/edits/{new_name}"
        # Probe duration so the frontend can prefill the trim window.
        try:
            from services.video_edit_service import _probe_duration
            duration = _probe_duration(full_path)
        except Exception:
            duration = 0.0

        return success_response(
            {"url": url, "filename": file.filename, "duration": round(duration, 2)},
            "Uploaded",
        )
    except Exception as e:
        logger.error(f"Source upload error: {e}")
        return error_response(f"Upload failed: {e}", 500)


@bp.route("/render", methods=["POST"])
@login_required
def render():
    """
    Apply trim/crop/music/voice to an existing video and save as a new edit.

    Request body (JSON):
        Either `source_id` OR `source_url` (not both required):
        - source_id: str — ID of an existing conversion row to edit
        - source_url: str — /uploads/... path of an uploaded video (from /upload-source)

        - trim_start: float — seconds, default 0
        - trim_end: float — seconds, default = full source duration
        - aspect: '16:9' | '9:16' | '1:1' | '4:5' | 'original' (default 'original')
        - music_url: str — uploaded music URL (optional)
        - music_volume: float — 0..2, default 0.3
        - voice_text: str — narration to synthesize via Kokoro (optional)
        - voice_preset: Kokoro voice id (default 'af_heart')
        - voice_volume: float — 0..2, default 1.0
        - keep_original_audio: bool — default true
        - original_audio_volume: float — 0..2, default 1.0
    """
    try:
        user_id = getattr(request, "user_id", None)
        data = request.get_json(silent=True) or {}

        source_id = data.get("source_id")
        source_url = (data.get("source_url") or "").strip()

        if not source_id and not source_url:
            return error_response("source_id or source_url is required", 400)

        db_service = ConversionDatabaseService()

        if source_id:
            # Resolve from DB — must belong to this user.
            source_lookup = db_service.get_conversion_by_id(source_id, user_id)
            if not source_lookup.get("success"):
                return error_response("Source video not found", 404)
            source_row = source_lookup["data"]
            if source_row.get("type") != "animation":
                return error_response("Source must be an animation", 400)
            source_url = source_row.get("model_url") or ""
        else:
            # Uploaded source — only allow paths under /uploads/input/edits/
            # to prevent users passing arbitrary server paths.
            if not source_url.startswith("/uploads/input/edits/"):
                return error_response("Invalid source_url", 400)

        # Synthesize voice if narration text was provided.
        voice_path = None
        voice_text = (data.get("voice_text") or "").strip()
        if voice_text:
            try:
                from services.voice_generation_service import generate_speech
                speech = generate_speech(
                    text=voice_text,
                    voice_preset=data.get("voice_preset", "af_heart"),
                )
                voice_path = speech.get("filepath")
            except Exception as e:
                logger.error(f"Voice generation failed: {e}")
                return error_response(f"Voice generation failed: {e}", 503)

        # Render.
        from services.video_edit_service import render_edit
        result = render_edit(
            source_path=source_url,
            trim_start=float(data.get("trim_start", 0)),
            trim_end=(float(data["trim_end"]) if data.get("trim_end") not in (None, "") else None),
            aspect=data.get("aspect", "original"),
            music_path=data.get("music_url") or None,
            music_volume=float(data.get("music_volume", 0.3)),
            voice_path=voice_path,
            voice_volume=float(data.get("voice_volume", 1.0)),
            keep_original_audio=bool(data.get("keep_original_audio", True)),
            original_audio_volume=float(data.get("original_audio_volume", 1.0)),
        )

        # Persist as a new animation row so it appears in Assets / Recents.
        try:
            db_service.save_conversion(user_id, {
                "type": "animation",
                "file_name": result["filename"],
                "original_image_url": "",
                "model_url": result["output_url"],
                "thumbnail_url": result["output_url"],
                "output_format": "mp4",
                "quality": "medium",
                "status": "completed",
                "file_size": _file_size_str(result["output_url"]),
                "settings": {
                    "edited_from": source_id or source_url,
                    "edit_source_kind": "asset" if source_id else "upload",
                    "trim_start": data.get("trim_start", 0),
                    "trim_end": data.get("trim_end"),
                    "aspect": data.get("aspect", "original"),
                    "has_music": bool(data.get("music_url")),
                    "has_voice": bool(voice_text),
                    "voice_text": voice_text or None,
                    "duration": result["duration"],
                },
            })
        except Exception as e:
            logger.error(f"Edit DB save failed (non-fatal): {e}")

        return success_response(result, "Edit rendered")

    except FileNotFoundError as e:
        return error_response(str(e), 404)
    except ValueError as e:
        return error_response(str(e), 400)
    except RuntimeError as e:
        logger.error(f"Edit runtime error: {e}")
        return error_response(str(e), 500)
    except Exception as e:
        logger.error(f"Edit error: {e}")
        return error_response(f"Edit failed: {e}", 500)

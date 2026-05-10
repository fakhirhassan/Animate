"""
Video Edit Service
Composes a single FFmpeg pass that applies trim, crop, music mix, and
narration overlay to a source video. Output is a new MP4 saved alongside
the other generated assets and tracked in the conversions table.

Why a single pass: each FFmpeg re-encode loses a little quality and adds
latency. Building one filter graph keeps the edit lossless beyond the
final encode.
"""

import os
import uuid
import logging
import subprocess
from typing import Dict, Any, Optional, List, Tuple

logger = logging.getLogger(__name__)

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(_BACKEND_DIR, "uploads", "output", "edits")


# Aspect ratio presets — value is (numerator, denominator).
# 'original' means no crop.
ASPECT_RATIOS: Dict[str, Optional[Tuple[int, int]]] = {
    "original": None,
    "16:9": (16, 9),
    "9:16": (9, 16),
    "1:1": (1, 1),
    "4:5": (4, 5),
}


def _ensure_dirs() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def _resolve_uploads_path(url_or_path: str) -> str:
    """Convert a /uploads/... URL to an absolute filesystem path."""
    if os.path.isabs(url_or_path) and os.path.exists(url_or_path):
        return url_or_path
    rel = url_or_path.lstrip("/")
    return os.path.join(_BACKEND_DIR, rel)


def _probe_duration(path: str) -> float:
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            capture_output=True, text=True, timeout=10,
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0


def _probe_has_audio(path: str) -> bool:
    """Return True iff the file contains at least one audio stream.

    Wan-generated videos and many T2V outputs have no audio track. Referencing
    [0:a] in a filter graph against such a file makes FFmpeg abort.
    """
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-select_streams", "a",
                "-show_entries", "stream=index",
                "-of", "csv=p=0",
                path,
            ],
            capture_output=True, text=True, timeout=10,
        )
        return bool(result.stdout.strip())
    except Exception:
        return False


def _build_crop_expr(aspect: str) -> Optional[str]:
    """Build an FFmpeg crop filter expression for a target aspect ratio.

    Centers the crop. Uses input width/height so it works regardless of
    source resolution.
    """
    ratio = ASPECT_RATIOS.get(aspect)
    if ratio is None:
        return None
    num, den = ratio
    # Choose the larger possible centered crop that fits the target ratio.
    # If source is wider than target → crop width. If taller → crop height.
    return (
        f"crop="
        f"'if(gt(iw/ih,{num}/{den}),ih*{num}/{den},iw)':"
        f"'if(gt(iw/ih,{num}/{den}),ih,iw*{den}/{num})'"
    )


def render_edit(
    source_path: str,
    trim_start: float = 0.0,
    trim_end: Optional[float] = None,
    aspect: str = "original",
    music_path: Optional[str] = None,
    music_volume: float = 0.3,
    voice_path: Optional[str] = None,
    voice_volume: float = 1.0,
    keep_original_audio: bool = True,
    original_audio_volume: float = 1.0,
) -> Dict[str, Any]:
    """
    Render an edited video.

    Args:
        source_path: Absolute filesystem path or /uploads/... URL.
        trim_start: Start time in seconds. 0 = beginning.
        trim_end: End time in seconds. None = use full clip duration.
        aspect: One of ASPECT_RATIOS keys.
        music_path: Optional path to a background music file.
        music_volume: 0.0–1.0, default 0.3 so it sits under voice.
        voice_path: Optional path to a narration audio file.
        voice_volume: 0.0–1.0.
        keep_original_audio: If False, drop the source's own audio track.
        original_audio_volume: 0.0–1.0.

    Returns:
        {output_path, output_url, filename, duration}
    """
    _ensure_dirs()

    src = _resolve_uploads_path(source_path)
    if not os.path.exists(src):
        raise FileNotFoundError(f"Source video not found: {source_path}")

    if aspect not in ASPECT_RATIOS:
        raise ValueError(f"Unknown aspect '{aspect}'. Allowed: {list(ASPECT_RATIOS)}")

    src_duration = _probe_duration(src)
    src_has_audio = _probe_has_audio(src)
    if trim_start < 0:
        trim_start = 0.0
    if trim_end is None or trim_end <= 0:
        trim_end = src_duration
    if trim_end > src_duration:
        trim_end = src_duration
    if trim_end <= trim_start:
        raise ValueError("Trim end must be greater than trim start")

    # --- Build inputs --------------------------------------------------
    # Trimming via -ss / -to on each input is exact and avoids decoding
    # frames we won't use.
    inputs: List[str] = ["-ss", f"{trim_start:.3f}", "-to", f"{trim_end:.3f}", "-i", src]

    extra_audio_inputs: List[Tuple[str, float]] = []  # (label, volume)
    next_input_index = 1

    if music_path:
        mpath = _resolve_uploads_path(music_path)
        if not os.path.exists(mpath):
            raise FileNotFoundError(f"Music file not found: {music_path}")
        inputs += ["-i", mpath]
        extra_audio_inputs.append((str(next_input_index), max(0.0, min(2.0, music_volume))))
        next_input_index += 1

    if voice_path:
        vpath = _resolve_uploads_path(voice_path)
        if not os.path.exists(vpath):
            raise FileNotFoundError(f"Voice file not found: {voice_path}")
        inputs += ["-i", vpath]
        extra_audio_inputs.append((str(next_input_index), max(0.0, min(2.0, voice_volume))))
        next_input_index += 1

    # --- Build filter graph -------------------------------------------
    filter_parts: List[str] = []

    # Video chain.
    crop_expr = _build_crop_expr(aspect)
    video_filters: List[str] = []
    if crop_expr:
        video_filters.append(crop_expr)
    # Always re-encode to yuv420p for browser compatibility.
    video_filters.append("format=yuv420p")
    filter_parts.append(f"[0:v]{','.join(video_filters)}[vout]")

    # Audio chain. Skip [0:a] entirely when the source has no audio track,
    # otherwise FFmpeg aborts with "Stream specifier ':a' ... matches no streams".
    audio_streams: List[str] = []
    if keep_original_audio and src_has_audio:
        v = max(0.0, min(2.0, original_audio_volume))
        filter_parts.append(f"[0:a]volume={v}[a0]")
        audio_streams.append("[a0]")

    for label, vol in extra_audio_inputs:
        filter_parts.append(f"[{label}:a]volume={vol}[a{label}]")
        audio_streams.append(f"[a{label}]")

    has_audio = bool(audio_streams)
    if len(audio_streams) > 1:
        filter_parts.append(
            f"{''.join(audio_streams)}amix=inputs={len(audio_streams)}:"
            "duration=longest:dropout_transition=0[aout]"
        )
    elif len(audio_streams) == 1:
        # Rename single stream to [aout] for consistency.
        filter_parts.append(f"{audio_streams[0]}anull[aout]")

    filter_complex = ";".join(filter_parts)

    # --- Output --------------------------------------------------------
    edit_id = str(uuid.uuid4())[:8]
    filename = f"edit_{edit_id}.mp4"
    output_path = os.path.join(OUTPUT_DIR, filename)

    cmd: List[str] = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", filter_complex,
        "-map", "[vout]",
    ]
    if has_audio:
        cmd += ["-map", "[aout]"]
    cmd += [
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        output_path,
    ]

    logger.info(f"Rendering edit {edit_id}: {' '.join(cmd[:4])} ... -> {output_path}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if result.returncode != 0:
        logger.error(f"FFmpeg edit failed: {result.stderr[-800:]}")
        raise RuntimeError(f"FFmpeg failed: {result.stderr[-200:]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError("FFmpeg produced empty output")

    duration = trim_end - trim_start
    output_url = f"/uploads/output/edits/{filename}"

    return {
        "edit_id": edit_id,
        "output_path": output_path,
        "output_url": output_url,
        "filename": filename,
        "duration": round(duration, 2),
    }

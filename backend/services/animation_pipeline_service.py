"""
Animation Pipeline Service
Orchestrates the full pipeline: Scene Parse → Video Generation → Voice → Stitch

Flow:
1. Parse user text into structured scene (Ollama)
2. Build segment prompts with consistent style anchors
3. Generate video clips for each segment (Wan2.1 T2V)
4. Generate voice/dialogue audio (Kokoro TTS)
5. Stitch video clips with crossfade + merge audio (FFmpeg)
6. Return final video with voice
"""

import logging
import os
import subprocess
import uuid
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

OUTPUT_DIR = "uploads/output/animations"
TEMP_DIR = "uploads/output/temp"


def ensure_dirs():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)


def generate_animation(
    text: str,
    num_frames_per_segment: int = 33,
    num_inference_steps: int = 30,
    fps: int = 16,
    voice_preset: str = "af_heart",
    num_clips: int = 4,
) -> Dict[str, Any]:
    """
    Full pipeline: text → parsed scene → video segments + voice → stitched output.

    Args:
        text: User's scene description in natural language
        num_frames_per_segment: Frames per video segment (33=2s, 81=5s)
        num_inference_steps: Quality steps for video generation
        fps: Frames per second
        voice_preset: Kokoro voice preset for dialogue
        num_clips: Number of video clips to generate (more = longer video)

    Returns:
        Dict with final video URL, duration, scene data, etc.
    """
    ensure_dirs()
    job_id = str(uuid.uuid4())[:8]
    job_dir = os.path.join(TEMP_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    logger.info(f"[{job_id}] Starting animation pipeline for: {text[:100]}...")

    # Step 1: Parse scene
    logger.info(f"[{job_id}] Step 1: Parsing scene...")
    try:
        scene = _parse_scene(text)
    except Exception as e:
        logger.error(f"[{job_id}] Scene parsing failed: {e}")
        raise RuntimeError(f"Scene parsing failed. Is Ollama running? Error: {e}")
    logger.info(f"[{job_id}] Scene parsed: {scene.get('title', 'Untitled')}")

    # Step 2: Build segments with consistent prompts
    segments = _build_segments(scene, num_clips)
    logger.info(f"[{job_id}] Built {len(segments)} segments")

    # Step 3: Generate video for each segment
    logger.info(f"[{job_id}] Step 2: Generating {len(segments)} video segments...")
    video_paths = []
    for i, segment in enumerate(segments):
        logger.info(f"[{job_id}] Generating video segment {i+1}/{len(segments)}")
        try:
            video_path = _generate_video_segment(
                segment, job_dir, i,
                num_frames=num_frames_per_segment,
                num_inference_steps=num_inference_steps,
                fps=fps,
            )
            video_paths.append(video_path)
        except Exception as e:
            logger.error(f"[{job_id}] Video segment {i+1} failed: {e}")
            if not video_paths:
                raise RuntimeError(f"Video generation failed on first segment: {e}")
            logger.warning(f"[{job_id}] Continuing with {len(video_paths)} successful segments")
            break

    # Step 4: Unload video model to free memory for TTS
    logger.info(f"[{job_id}] Step 3: Unloading video model, loading TTS...")
    from services.video_generation_service import unload_model as unload_video
    unload_video()

    # Step 5: Generate voice audio for dialogue
    logger.info(f"[{job_id}] Step 4: Generating voice audio...")
    try:
        audio_path = _generate_voice_audio(scene, job_dir, voice_preset)
    except Exception as e:
        logger.error(f"[{job_id}] Voice generation failed: {e}")
        audio_path = None

    # Step 6: Unload TTS model
    from services.voice_generation_service import unload_model as unload_voice
    unload_voice()

    # Step 7: Stitch everything together with crossfades
    logger.info(f"[{job_id}] Step 5: Stitching final video...")
    crossfade_duration = 0.5
    try:
        final_path = _stitch_final_video(
            video_paths, audio_path, job_dir, job_id, fps, crossfade_duration
        )
    except Exception as e:
        logger.error(f"[{job_id}] Stitching failed: {e}")
        if video_paths:
            final_path = video_paths[0]
            logger.warning(f"[{job_id}] Falling back to first video segment")
        else:
            raise RuntimeError(f"Video stitching failed: {e}")

    # Calculate final duration
    clip_duration = num_frames_per_segment / fps
    total_duration = (clip_duration * len(segments)) - (crossfade_duration * max(0, len(segments) - 1))
    final_url = f"/uploads/output/animations/{os.path.basename(final_path)}"

    logger.info(f"[{job_id}] Pipeline complete: {final_path} ({total_duration:.1f}s)")

    return {
        "job_id": job_id,
        "video_url": final_url,
        "filename": os.path.basename(final_path),
        "filepath": final_path,
        "duration": round(total_duration, 2),
        "fps": fps,
        "num_segments": len(segments),
        "scene": scene,
    }


def generate_animation_from_image(
    image,
    text: str = "",
    num_frames: int = 33,
    num_inference_steps: int = 30,
    fps: int = 16,
    voice_preset: str = "af_heart",
) -> Dict[str, Any]:
    """
    Pipeline for image-to-animation with optional voice.
    Note: I2V requires Wan2.2-TI2V-5B. Without it, generates T2V from text description.
    """
    ensure_dirs()
    job_id = str(uuid.uuid4())[:8]
    job_dir = os.path.join(TEMP_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    logger.info(f"[{job_id}] Starting image-to-animation pipeline...")

    # Generate video from text prompt (I2V not available without Wan2.2-5B)
    from services.video_generation_service import generate_video_from_text
    prompt = text if text.strip() else "A scene with smooth cinematic motion, high quality animation"
    try:
        video_result = generate_video_from_text(
            prompt=prompt,
            num_frames=num_frames,
            num_inference_steps=num_inference_steps,
            fps=fps,
        )
        video_path = video_result["filepath"]
    except Exception as e:
        logger.error(f"[{job_id}] Video generation failed: {e}")
        raise RuntimeError(f"Video generation failed: {e}")

    # Unload video model before loading TTS
    from services.video_generation_service import unload_model as unload_video
    unload_video()

    # Generate voice if text is provided
    audio_path = None
    if text.strip():
        try:
            audio_path = _generate_voice_audio_from_text(text, job_dir, voice_preset)
        except Exception as e:
            logger.error(f"[{job_id}] Voice generation failed: {e}")
            audio_path = None
        from services.voice_generation_service import unload_model as unload_voice
        unload_voice()

    # Combine video + audio
    final_filename = f"animation_{job_id}.mp4"
    final_path = os.path.join(OUTPUT_DIR, final_filename)

    try:
        if audio_path:
            _merge_video_audio(video_path, audio_path, final_path)
        else:
            _copy_file(video_path, final_path)
    except Exception as e:
        logger.error(f"[{job_id}] Merge failed, using video only: {e}")
        _copy_file(video_path, final_path)

    duration = num_frames / fps
    final_url = f"/uploads/output/animations/{final_filename}"

    logger.info(f"[{job_id}] Image-to-animation complete: {final_path}")

    return {
        "job_id": job_id,
        "video_url": final_url,
        "filename": final_filename,
        "filepath": final_path,
        "duration": round(duration, 2),
        "fps": fps,
        "has_audio": audio_path is not None,
    }


# --- Internal helpers ---

def _parse_scene(text: str) -> Dict[str, Any]:
    """Parse text into structured scene using Ollama."""
    from services.scene_parser_service import parse_scene
    return parse_scene(text)


def _build_segments(scene: Dict[str, Any], num_clips: int = 4) -> List[Dict[str, str]]:
    """
    Break a parsed scene into video generation segments.
    Each segment gets a detailed, consistent prompt for visual continuity.
    """
    segments = []
    dialogue_lines = scene.get("dialogue", [])
    actions = scene.get("actions", [])
    objects = scene.get("objects", [])

    # Build consistent subject/setting description
    obj_descriptions = {
        obj["name"]: obj.get("description", obj["name"]) for obj in objects
    }
    all_subjects = ", ".join(obj_descriptions.values()) if obj_descriptions else "a scene"

    # Style anchors for visual consistency across clips
    style = "cinematic, smooth motion, consistent lighting, high quality, 4K"
    setting = scene.get("scene_settings", {})
    environment = setting.get("environment", "")
    lighting = setting.get("lighting", "natural lighting")
    if environment:
        style += f", {environment}"
    if lighting:
        style += f", {lighting}"

    if dialogue_lines:
        # Create segments based on dialogue
        for i, line in enumerate(dialogue_lines):
            obj_name = line.get("object", line.get("speaker", "character"))
            obj_desc = obj_descriptions.get(obj_name, obj_name)
            emotion = line.get("emotion", "neutral")
            dialogue_text = line.get("text", "")

            prompt = (
                f"A {obj_desc} with a {emotion} expression, "
                f"speaking animatedly. "
                f"Scene with {all_subjects}. "
                f"{style}."
            )
            segments.append({
                "prompt": prompt,
                "dialogue": dialogue_text,
            })
    elif actions:
        # Create segments based on actions
        for action in actions:
            obj_name = action.get("object", action.get("actor", "object"))
            obj_desc = obj_descriptions.get(obj_name, obj_name)
            action_type = action.get("type", action.get("action", "move"))

            prompt = (
                f"A {obj_desc} performing a {action_type} motion. "
                f"Scene with {all_subjects}. "
                f"{style}."
            )
            segments.append({
                "prompt": prompt,
                "dialogue": "",
            })
    else:
        # Generate num_clips segments from the overall description
        for i in range(num_clips):
            phase = ["beginning", "continuing", "progressing", "concluding"][min(i, 3)]
            prompt = (
                f"A scene with {all_subjects}, {phase} of the sequence. "
                f"{style}."
            )
            segments.append({
                "prompt": prompt,
                "dialogue": "",
            })

    # Pad or trim to desired number of clips
    while len(segments) < num_clips:
        last = segments[-1].copy()
        segments.append(last)

    return segments[:num_clips]


def _generate_video_segment(
    segment: Dict, job_dir: str, index: int,
    num_frames: int = 33, num_inference_steps: int = 30, fps: int = 16,
) -> str:
    """Generate a single video segment using Wan2.1 T2V."""
    from services.video_generation_service import generate_video_from_text

    result = generate_video_from_text(
        prompt=segment["prompt"],
        num_frames=num_frames,
        num_inference_steps=num_inference_steps,
        fps=fps,
    )

    return result["filepath"]


def _generate_voice_audio(
    scene: Dict[str, Any], job_dir: str, voice_preset: str
) -> Optional[str]:
    """Generate combined voice audio from all dialogue lines."""
    dialogue_lines = scene.get("dialogue", [])
    if not dialogue_lines:
        return None

    full_text = " ".join(line.get("text", "") for line in dialogue_lines)
    if not full_text.strip():
        return None

    return _generate_voice_audio_from_text(full_text, job_dir, voice_preset)


def _generate_voice_audio_from_text(
    text: str, job_dir: str, voice_preset: str
) -> str:
    """Generate voice audio from text using Kokoro TTS."""
    from services.voice_generation_service import generate_speech

    result = generate_speech(text=text, voice_preset=voice_preset)
    return result["filepath"]


def _stitch_final_video(
    video_paths: List[str], audio_path: Optional[str],
    job_dir: str, job_id: str, fps: int, crossfade: float = 0.5
) -> str:
    """Stitch multiple video segments with crossfade transitions and optional audio."""
    final_filename = f"animation_{job_id}.mp4"
    final_path = os.path.join(OUTPUT_DIR, final_filename)

    if len(video_paths) == 1 and audio_path is None:
        _copy_file(video_paths[0], final_path)
        return final_path

    # Concatenate video segments with crossfade if multiple
    if len(video_paths) > 1:
        concat_video_path = os.path.join(job_dir, "concat.mp4")
        _concat_videos_with_crossfade(video_paths, concat_video_path, crossfade)
    else:
        concat_video_path = video_paths[0]

    # Merge with audio if available
    if audio_path:
        _merge_video_audio(concat_video_path, audio_path, final_path)
    else:
        _copy_file(concat_video_path, final_path)

    return final_path


def _concat_videos_with_crossfade(
    video_paths: List[str], output_path: str, crossfade: float = 0.5
):
    """Concatenate videos with crossfade transitions using ffmpeg xfade filter."""
    if len(video_paths) == 1:
        _copy_file(video_paths[0], output_path)
        return

    # Get duration of first clip to calculate offsets
    probe_cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_paths[0]
    ]
    try:
        result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
        clip_duration = float(result.stdout.strip())
    except Exception:
        clip_duration = 2.0  # fallback

    if len(video_paths) == 2:
        # Simple 2-clip crossfade
        offset = clip_duration - crossfade
        cmd = [
            "ffmpeg", "-y",
            "-i", video_paths[0], "-i", video_paths[1],
            "-filter_complex",
            f"[0][1]xfade=transition=fade:duration={crossfade}:offset={offset}",
            "-c:v", "libx264", "-preset", "fast",
            output_path
        ]
    else:
        # Multi-clip crossfade chain
        inputs = []
        for vp in video_paths:
            inputs.extend(["-i", vp])

        # Build xfade filter chain
        filter_parts = []
        offset = clip_duration - crossfade
        prev_label = "0"

        for i in range(1, len(video_paths)):
            out_label = f"v{i}"
            if i == 1:
                filter_parts.append(
                    f"[{prev_label}][{i}]xfade=transition=fade:duration={crossfade}:offset={offset}[{out_label}]"
                )
            else:
                filter_parts.append(
                    f"[{prev_label}][{i}]xfade=transition=fade:duration={crossfade}:offset={offset}[{out_label}]"
                )
            offset += clip_duration - crossfade
            prev_label = out_label

        # Last output doesn't need a label
        filter_parts[-1] = filter_parts[-1].rsplit("[", 1)[0]

        filter_complex = "; ".join(filter_parts)

        cmd = ["ffmpeg", "-y"] + inputs + [
            "-filter_complex", filter_complex,
            "-c:v", "libx264", "-preset", "fast",
            output_path
        ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if result.returncode != 0:
        logger.warning(f"Crossfade failed, falling back to simple concat: {result.stderr[:200]}")
        _concat_videos_simple(video_paths, output_path, os.path.dirname(output_path))
        return

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        logger.warning(f"Crossfade produced empty file, falling back to simple concat")
        _concat_videos_simple(video_paths, output_path, os.path.dirname(output_path))
        return

    logger.info(f"Crossfaded {len(video_paths)} videos → {output_path}")


def _concat_videos_simple(video_paths: List[str], output_path: str, job_dir: str):
    """Simple concatenation without crossfade (fallback)."""
    list_file = os.path.join(job_dir, "concat_list.txt")
    with open(list_file, "w") as f:
        for vp in video_paths:
            f.write(f"file '{os.path.abspath(vp)}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", list_file,
        "-c", "copy",
        output_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        logger.error(f"FFmpeg concat error: {result.stderr}")
        raise RuntimeError(f"FFmpeg concat failed: {result.stderr[:200]}")

    logger.info(f"Concatenated {len(video_paths)} videos → {output_path}")


def _merge_video_audio(video_path: str, audio_path: str, output_path: str):
    """Merge a video file with an audio file using ffmpeg."""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac",
        "-shortest",
        output_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        logger.error(f"FFmpeg merge error: {result.stderr}")
        raise RuntimeError(f"FFmpeg merge failed: {result.stderr[:200]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        raise RuntimeError("FFmpeg merge produced empty output file")

    logger.info(f"Merged video + audio → {output_path}")


def _copy_file(src: str, dst: str):
    """Copy a file."""
    import shutil
    shutil.copy2(src, dst)

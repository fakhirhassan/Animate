# MESH — Animation Pipeline Implementation Plan

**Created**: March 8, 2026
**Branch**: `testing`
**Hardware**: Mac M4 Pro 24GB (primary), University AI PC with NVIDIA GPU (secondary)
**Constraint**: Fully local, no paid APIs

---

## Goal

Generate **15-20 second coherent animated videos with natural voiceover** from text descriptions or images. Everything runs locally.

---

## Architecture Overview

```
User Input (Text or Image)
    │
    ▼
┌─────────────────────────────────┐
│  STEP 1: Scene Parser (Ollama)  │
│  llama3.1:8b                    │
│  Text → Structured JSON         │
│  (objects, actions, dialogue,   │
│   camera, duration)             │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  STEP 2: Video Generation       │
│                                 │
│  Clip 1: T2V (text-to-video)   │
│     → extract last frame        │
│  Clip 2: I2V (last frame → vid)│
│     → extract last frame        │
│  Clip 3: I2V (last frame → vid)│
│     → extract last frame        │
│  Clip 4: I2V (last frame → vid)│
│                                 │
│  Models:                        │
│  • Wan2.1-T2V-1.3B (fast/480p) │
│  • Wan2.2-TI2V-5B (quality/720p│
│    + I2V chaining support)      │
│                                 │
│  = 4 clips × 5 sec = 20 sec    │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  STEP 3: Voice Generation       │
│  Kokoro-82M (via MLX)           │
│  Scene dialogue → natural voice │
│  Apache 2.0, #1 on TTS Arena   │
│  ~1.5 sec generation time       │
│  26 voices, 8 languages         │
└─────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────┐
│  STEP 4: FFmpeg Composition     │
│  • Crossfade transitions (0.5s) │
│  • Merge video + voice audio    │
│  • Output: final MP4            │
└─────────────────────────────────┘
    │
    ▼
  Final 15-20 sec MP4 with voice
```

---

## Models & Downloads

### Required Models

| Model | Purpose | Size | HuggingFace ID |
|-------|---------|------|----------------|
| **Wan2.1-T2V-1.3B** | Fast text-to-video (480p) | ~5.5GB | `Wan-AI/Wan2.1-T2V-1.3B-Diffusers` |
| **Wan2.2-TI2V-5B** | Quality T2V + I2V chaining (720p) | ~10GB | `Wan-AI/Wan2.2-TI2V-5B` |
| **Kokoro-82M** | Text-to-speech | ~600MB | via `pip install kokoro mlx-audio` |
| **Ollama llama3.1:8b** | Scene parsing | ~4.7GB | via `ollama pull llama3.1:8b` |

### Download Commands

```bash
# Step 1: Clear broken caches
rm -rf ~/.cache/huggingface/hub/models--Wan-AI--Wan2.1-T2V-1.3B
rm -rf ~/.cache/huggingface/hub/models--suno--bark
rm -rf ~/.cache/huggingface/hub/models--hunyuanvideo-community--HunyuanVideo-1.5-Diffusers-480p_t2v
rm -rf ~/.cache/huggingface/hub/models--stabilityai--TripoSR
rm -rf ~/.cache/huggingface/hub/models--facebook--dino-vitb16
rm -rf ~/.cache/huggingface/hub/.locks/*

# Step 2: Download Wan2.1-T2V-1.3B (~5.5GB)
cd ~/Desktop/Projects/Mesh/backend
source venv/bin/activate
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download('Wan-AI/Wan2.1-T2V-1.3B-Diffusers', resume_download=True)
print('Wan2.1 T2V 1.3B done!')
"

# Step 3: Download Wan2.2-TI2V-5B (~10GB)
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download('Wan-AI/Wan2.2-TI2V-5B', resume_download=True)
print('Wan2.2 TI2V 5B done!')
"

# Step 4: Install Kokoro TTS
pip install mlx-audio kokoro soundfile

# Step 5: Ollama for scene parsing
brew install ollama
ollama serve &
ollama pull llama3.1:8b

# Step 6: FFmpeg
brew install ffmpeg

# Step 7: Wan2.2-Mac fork (MPS optimizations)
cd ~/Desktop/Projects
git clone https://github.com/HighDoping/Wan2.2-Mac.git
cd Wan2.2-Mac
pip install -r requirements.txt
```

---

## Performance Expectations

### Mac M4 Pro 24GB

| Model | Resolution | Frames | Duration | Gen Time |
|-------|-----------|--------|----------|----------|
| Wan2.1-T2V-1.3B | 480×832 | 33 (~2s) | 2 sec | ~15-20 min |
| Wan2.1-T2V-1.3B | 480×832 | 81 (~5s) | 5 sec | ~30-45 min |
| Wan2.2-TI2V-5B | 720p | 25 (~5s) | 5 sec | ~47-90 min |
| **Full 20s pipeline** | 480p | 4 clips | 20 sec | **~2-3 hours** |

### University AI PC (NVIDIA GPU)

| GPU | Model | Resolution | Time per 5s clip |
|-----|-------|-----------|-----------------|
| RTX 4090 | Wan2.1-14B | 480p | ~5 min |
| A100 | Wan2.1-14B | 720p | ~9 min |
| RTX 4090 | Wan2.1-1.3B | 480p | ~1-2 min |
| **RTX 4090 Full 20s** | 14B | 480p | **~20 min** |

---

## Implementation Phases

### Phase 1: Model Setup & Verification ⬜
- [ ] Clear broken HuggingFace cache
- [ ] Download Wan2.1-T2V-1.3B-Diffusers
- [ ] Download Wan2.2-TI2V-5B
- [ ] Install Kokoro TTS (mlx-audio + kokoro)
- [ ] Install & configure Ollama with llama3.1:8b
- [ ] Install FFmpeg
- [ ] Clone Wan2.2-Mac fork
- [ ] Verify each model loads on M4 Pro without crashing

### Phase 2: Replace Bark → Kokoro TTS ⬜
**Files to modify:**
- `backend/services/voice_generation_service.py` — rewrite to use Kokoro
- `backend/requirements.txt` — remove bark, add kokoro + mlx-audio + soundfile

**What changes:**
- Remove all Bark imports and logic
- Use `kokoro.KPipeline(lang_code='a')` for English
- Support multiple voice presets (Kokoro has 26 voices)
- Generate WAV at 24kHz
- Handle long text splitting (Kokoro handles this natively)

### Phase 3: Add Wan2.2-TI2V-5B Support ⬜
**Files to modify:**
- `backend/models/video_generator/wan_video.py` — add Wan2.2 TI2V support
- `backend/services/video_generation_service.py` — expose both models

**What changes:**
- Add `WAN22_TI2V_MODEL_ID = "Wan-AI/Wan2.2-TI2V-5B"`
- Add I2V generation method using the TI2V model
- Support model selection (1.3B fast vs 5B quality)
- Add `extract_last_frame()` method for chaining
- MPS config: `--offload_model True --convert_model_dtype --t5_quant --device mps`
- Set `PYTORCH_ENABLE_MPS_FALLBACK=1` environment variable

### Phase 4: Implement Last-Frame Chaining ⬜
**Files to modify:**
- `backend/services/animation_pipeline_service.py` — rewrite pipeline

**New pipeline flow:**
```python
def generate_animation(text, num_clips=4, frames_per_clip=81):
    # 1. Parse scene into segments
    scene = parse_scene(text)  # Ollama
    segments = build_segments(scene, num_clips)

    # 2. Generate clip 1 from text (T2V)
    clip_1 = generate_t2v(segments[0].prompt, frames=frames_per_clip)
    clips = [clip_1]

    # 3. Chain remaining clips using I2V
    for i in range(1, num_clips):
        last_frame = extract_last_frame(clips[-1])
        clip_n = generate_i2v(last_frame, segments[i].prompt, frames=frames_per_clip)
        clips.append(clip_n)

    # 4. Generate voice
    dialogue = extract_dialogue(scene)
    voice_audio = kokoro_generate(dialogue)

    # 5. Stitch with crossfades + voice
    final = ffmpeg_stitch(clips, voice_audio, crossfade=0.5)
    return final
```

**Segment prompt engineering:**
- Each segment prompt must reference the same characters/setting for visual continuity
- Include consistent style tags: "cinematic, smooth motion, consistent lighting"
- Camera direction hints: "camera slowly pans right", "medium shot"

### Phase 5: FFmpeg Crossfade Transitions ⬜
**Files to modify:**
- `backend/services/animation_pipeline_service.py` — update stitching

**FFmpeg crossfade command:**
```bash
ffmpeg -i clip1.mp4 -i clip2.mp4 \
  -filter_complex "xfade=transition=fade:duration=0.5:offset=4.5" \
  -y output.mp4
```

**For multiple clips, chain xfade filters:**
```bash
ffmpeg -i c1.mp4 -i c2.mp4 -i c3.mp4 -i c4.mp4 \
  -filter_complex \
  "[0][1]xfade=transition=fade:duration=0.5:offset=4.5[v1]; \
   [v1][2]xfade=transition=fade:duration=0.5:offset=9.0[v2]; \
   [v2][3]xfade=transition=fade:duration=0.5:offset=13.5" \
  -y final.mp4
```

### Phase 6: End-to-End Testing ⬜
- [ ] Test scene parser with sample prompts
- [ ] Test T2V generation (Wan2.1-1.3B)
- [ ] Test I2V generation (Wan2.2-TI2V-5B)
- [ ] Test last-frame extraction
- [ ] Test clip chaining (T2V → I2V → I2V → I2V)
- [ ] Test Kokoro voice generation
- [ ] Test FFmpeg crossfade stitching
- [ ] Test full pipeline: text → 20s video with voice
- [ ] Test image-to-animation pipeline
- [ ] Test API endpoints

**Test prompts:**
```
"A cat walking through a garden, looking around curiously"
"A robot standing in a futuristic city, then walking forward"
"A bird flying over a mountain landscape at sunset"
```

### Phase 7: Frontend Animation UI ⬜
**Files to create/modify:**
- `frontend/app/(dashboard)/creator/animate/page.tsx` — animation generator page

**UI Components:**
- Text input area for scene description
- Image upload for image-to-animation
- Model selection (Fast 480p / Quality 720p)
- Voice preset selector (Kokoro's 26 voices)
- Number of clips slider (2-6, default 4)
- Generation progress indicator (polling /api/animation/status)
- Video player for output preview
- Download MP4 button

### Phase 8: University AI PC Support ⬜
**Files to modify:**
- `backend/models/video_generator/wan_video.py` — CUDA optimization
- `backend/config.py` — GPU config

**What changes:**
- Auto-detect CUDA vs MPS
- Use float16 on CUDA (faster than float32)
- Enable model CPU offloading on CUDA for larger models
- Support Wan2.1-14B on NVIDIA GPUs (24GB+ VRAM)
- Add config option: `VIDEO_MODEL = "1.3b" | "5b" | "14b"`

---

## Key Technical Details

### Last-Frame Chaining (Critical for Coherence)
The key technique for 15-20 second coherent videos:
1. Generate Clip 1 using T2V from text prompt
2. Extract the **last frame** of Clip 1
3. Feed that frame + next segment prompt into I2V to generate Clip 2
4. Repeat for Clips 3, 4
5. This maintains visual continuity — same characters, same scene, same style

**Important**: Extract frame from video file (decoded pixel), NOT from latent space (we don't have access to latent space via diffusers export_to_video). Use PIL/OpenCV to extract last frame from MP4.

### Segment Prompt Engineering
For coherent multi-clip videos, each segment prompt must:
- Reference the **same subject** consistently ("a orange tabby cat" not "a cat" then "an animal")
- Maintain **same setting** ("in a sunlit garden with flowers")
- Add **motion continuity** ("continuing to walk forward")
- Include **style anchors** ("cinematic, natural lighting, 4K quality")

Example for "A cat walking through a garden":
```
Segment 1: "A orange tabby cat begins walking through a sunlit garden with colorful flowers, medium shot, cinematic, natural lighting"
Segment 2: "A orange tabby cat walking through a sunlit garden, looking at butterflies, medium shot, cinematic, natural lighting"
Segment 3: "A orange tabby cat in a sunlit garden, pausing to sniff a red flower, medium shot, cinematic, natural lighting"
Segment 4: "A orange tabby cat walking away through a sunlit garden path, wide shot pulling back, cinematic, natural lighting"
```

### Memory Management on M4 Pro (24GB)
Models must be loaded/unloaded sequentially:
```
1. Load Ollama → Parse scene → (Ollama stays in background, ~4GB)
2. Load Wan video model → Generate all clips → Unload Wan
3. Load Kokoro → Generate voice → Unload Kokoro
4. FFmpeg stitch (no ML model needed)
```

### MPS-Specific Requirements
- VAE must use float32 (float16 causes NaN on MPS)
- Set `PYTORCH_ENABLE_MPS_FALLBACK=1` for unsupported ops
- Enable VAE tiling for memory efficiency
- Use `--offload_model True` for Wan2.2-TI2V-5B

---

## File Structure (Backend Changes)

```
backend/
├── models/
│   └── video_generator/
│       ├── __init__.py
│       └── wan_video.py          # UPDATE: Add Wan2.2 TI2V support
├── services/
│   ├── animation_pipeline_service.py  # REWRITE: Last-frame chaining pipeline
│   ├── video_generation_service.py    # UPDATE: Support both models
│   ├── voice_generation_service.py    # REWRITE: Bark → Kokoro
│   └── scene_parser_service.py        # KEEP: Already uses Ollama
├── api/
│   ├── animation_routes.py       # UPDATE: Add model selection, progress
│   └── voice_routes.py           # UPDATE: Kokoro voice presets
├── config.py                     # UPDATE: Add video model config
└── requirements.txt              # UPDATE: Remove bark, add kokoro
```

---

## API Endpoints (Updated)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/animation/generate` | POST | Full text → 20s video pipeline |
| `POST /api/animation/image-animate` | POST | Image → animated video with voice |
| `POST /api/animation/text-to-video` | POST | Single clip T2V |
| `POST /api/animation/image-to-video` | POST | Single clip I2V |
| `GET /api/animation/status/:jobId` | GET | Generation progress |
| `GET /api/animation/check` | GET | Model availability |
| `POST /api/animation/unload` | POST | Free GPU memory |
| `POST /api/voice/generate` | POST | Kokoro TTS generation |
| `GET /api/voice/presets` | GET | List Kokoro voices |
| `POST /api/script/analyze` | POST | Ollama scene parsing |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wan2.2-TI2V-5B doesn't fit in 24GB | HIGH | Fall back to Wan2.1-1.3B T2V only, skip I2V chaining, use consistent prompts |
| Clip chaining still looks inconsistent | MEDIUM | Stronger prompt engineering, longer crossfades, voice narration masks visual jumps |
| Generation too slow for demo | MEDIUM | Pre-generate demo videos, show live generation of a short clip during demo |
| Kokoro voice quality issues | LOW | Kokoro is well-tested, fallback to edge-tts (free Microsoft cloud TTS, no API key) |
| Ollama scene parsing errors | LOW | Add validation, fallback to simpler prompt splitting |

---

## Demo Strategy for FYP Presentation

1. **Pre-generate** 2-3 impressive 20-second videos before the demo
2. **Live demo**: Show a quick single-clip generation (~15-20 min on Mac, or faster on uni PC)
3. **Show the pipeline**: Scene parse → video gen → voice → stitch (each step visible)
4. **Show both modes**: Text-to-animation AND image-to-animation
5. **Highlight the engineering**: Last-frame chaining, scene parsing, voice sync

---

## Progress Tracker

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Model Setup | ✅ Partial | Wan2.1-1.3B downloaded, Kokoro installed, Ollama ready, FFmpeg ready. Wan2.2-5B not yet downloaded. |
| Phase 2: Kokoro TTS | ✅ Done | voice_generation_service.py rewritten to use Kokoro-82M. 22 voices available. |
| Phase 3: Wan2.2 Support | ⬜ Deferred | Code prepared for local model paths. Will add when 5B model is downloaded. |
| Phase 4: Last-Frame Chaining | ⬜ Deferred | Requires Wan2.2-TI2V-5B for I2V. Currently using consistent T2V prompts instead. |
| Phase 5: FFmpeg Crossfades | ✅ Done | animation_pipeline_service.py updated with xfade transitions between clips. |
| Phase 6: E2E Testing | ⬜ Not Started | |
| Phase 7: Frontend UI | ✅ Done | animate/page.tsx updated with voice selector, num_clips, pipeline steps. api.ts updated. |
| Phase 8: NVIDIA GPU Support | ⬜ Not Started | |

---

## Code Changes Log

### March 8, 2026 — Phase 2 & 5 Complete

**Files modified:**

1. `backend/models/video_generator/wan_video.py`
   - Updated to use local model path (`./models/Wan-AI/Wan2.1-T2V-1.3B-Diffusers`) with HF fallback
   - Removed I2V pipeline (14B model too large, waiting for Wan2.2-5B)
   - Added `_resolve_model_path()` helper

2. `backend/services/voice_generation_service.py`
   - Complete rewrite: Bark → Kokoro-82M
   - 22 voice presets (American + British, male + female)
   - Default voice: `af_heart`
   - Backwards-compatible with old Bark preset names

3. `backend/services/video_generation_service.py`
   - Removed `generate_video_from_image()` (no I2V model available)
   - Updated model name in status check

4. `backend/services/animation_pipeline_service.py`
   - Added sequential model loading/unloading for memory management
   - Added FFmpeg crossfade transitions between clips
   - Improved segment prompt engineering with style anchors
   - Added `num_clips` parameter for controlling video length
   - Fallback to simple concat if crossfade fails

5. `backend/api/animation_routes.py`
   - Updated to use Kokoro voice presets (default: af_heart)
   - Added `num_clips` parameter
   - Removed I2V endpoint (temporarily)
   - Unload endpoint now unloads both video + voice models

6. `backend/api/voice_routes.py`
   - Updated to use Kokoro presets
   - Dynamic preset listing from voice service

7. `backend/requirements.txt`
   - Removed Bark dependency
   - Added `kokoro>=0.9` and `soundfile>=0.12.0`

8. `backend/config.py`
   - Added animation pipeline config (VIDEO_MODEL, DEFAULT_VOICE, etc.)
   - Increased MAX_PROCESSING_TIME to 600s (video gen is slow)

### March 8, 2026 — Phase 7 (Frontend UI) Complete

**Files modified:**

9. `frontend/app/(dashboard)/creator/animate/page.tsx`
   - Rewrote to use full animation pipeline (`text` field, not `prompt`)
   - Added voice preset selector (loads from backend API)
   - Added num_clips control (1-8 clips)
   - Updated pipeline progress to show 4 steps (parse → video → voice → stitch)
   - Fixed generation time estimate ("15-30+ minutes")
   - Removed HunyuanVideo references
   - Updated example prompts with dialogue for voice demo

10. `frontend/lib/api.ts`
    - Rewrote `animationAPI` to match new backend endpoints
    - Added `animationAPI.generate()` with `text` field + voice/clips params
    - Added `animationAPI.textToVideo()` for single clip generation
    - Added `animationAPI.imageAnimate()` for image-to-animation
    - Added `voiceAPI` with `generate()` and `getPresets()`
    - Increased timeout to 30 min for full pipeline

---

*Last Updated: March 8, 2026*

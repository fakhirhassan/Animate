# MESH/AniMate - FYP Implementation Plan

## Project Vision

**Goal:** Create an AI-powered platform that converts text descriptions into fully animated 3D scenes with voice and music.

**Example Input:**
```
"A duck running toward a stop board saying 'watch out!' with playful background music"
```

**Example Output:**
- 3D animated scene with duck and stop board
- Duck moves toward the stop board
- Voice says "watch out!"
- Background music plays

---

## Current State (~35% Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Frontend (Next.js) | ✅ Done | Dashboard, auth, UI components |
| Backend (Flask) | ✅ Done | API structure, routes |
| Authentication | ✅ Done | Supabase auth |
| 2D → 3D (TripoSR) | ✅ Done | Basic quality, working |
| 3D Model Viewer | ✅ Fixed | React Three Fiber - OBJ & GLB support |
| Text → Animation | ❌ Not started | Main FYP feature |
| Voice Generation | ❌ Not started | |
| Music Generation | ❌ Not started | |

### Completed Today (January 23, 2026)

| Task | Description | Status |
|------|-------------|--------|
| **Phase 0: 3D Preview Bug** | Fixed ModelViewer component | ✅ DONE |
| | Issue: Model component only loaded OBJ, ignored GLB/GLTF | |
| | Fix: Created unified Model loader with format auto-detection | |
| | Added GLTFLoader support alongside OBJLoader | |

### Known Issues (Resolved)

| Issue | Description | Status |
|-------|-------------|--------|
| ~~3D Preview Not Working~~ | ~~GLB/OBJ models not displaying~~ | ✅ FIXED |

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INPUT                                      │
│         "A duck running toward a stop board saying 'watch out!'"            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STEP 1: SCENE PARSER                                 │
│                              (LLM-based)                                     │
│                                                                              │
│  Input: Natural language text                                                │
│  Output: Structured JSON                                                     │
│                                                                              │
│  {                                                                           │
│    "objects": [                                                              │
│      {"id": "obj_1", "name": "duck", "type": "character"},                  │
│      {"id": "obj_2", "name": "stop board", "type": "prop"}                  │
│    ],                                                                        │
│    "actions": [                                                              │
│      {                                                                       │
│        "actor": "obj_1",                                                     │
│        "action": "run",                                                      │
│        "target": "obj_2",                                                    │
│        "type": "movement"                                                    │
│      }                                                                       │
│    ],                                                                        │
│    "dialogue": [                                                             │
│      {"speaker": "obj_1", "text": "watch out!", "emotion": "urgent"}        │
│    ],                                                                        │
│    "audio": {                                                                │
│      "music_style": "playful",                                               │
│      "mood": "lighthearted"                                                  │
│    }                                                                         │
│  }                                                                           │
│                                                                              │
│  Technology: Claude API (Anthropic)                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 2: 3D ASSET GENERATION                             │
│                           (Hunyuan3D-2)                                      │
│                                                                              │
│  For each object in scene:                                                   │
│    "duck" ──────────────► Hunyuan3D ──────────────► duck.glb                │
│    "stop board" ─────────► Hunyuan3D ──────────────► stop_board.glb         │
│                                                                              │
│  Technology: Hunyuan3D-2-Mac (MPS backend)                                   │
│  Hardware: M4 Pro Mac (24GB RAM)                                             │
│  Time: ~2-4 min per object                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        STEP 3: SCENE COMPOSER                                │
│                                                                              │
│  - Place objects in 3D space                                                 │
│  - Set initial positions based on relationships                              │
│  - Configure camera angle                                                    │
│  - Set up lighting                                                           │
│  - Create ground/environment                                                 │
│                                                                              │
│  Output: scene.json (Three.js compatible scene graph)                        │
│                                                                              │
│  Technology: Custom Python + Three.js format                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STEP 4: ANIMATION ENGINE                               │
│                                                                              │
│  Parse actions and create animation timeline:                                │
│                                                                              │
│  Timeline:                                                                   │
│  0s ──────── 2s ──────── 4s ──────── 6s                                     │
│  │           │           │           │                                       │
│  │  Duck     │   Duck    │   Duck    │                                       │
│  │  starts   │   running │   arrives │                                       │
│  │           │           │   + speaks│                                       │
│                                                                              │
│  Animation Types:                                                            │
│  - Movement: walk, run, fly, jump, move_to                                   │
│  - Rotation: turn, look_at, spin                                             │
│  - Static: stand, sit, wait                                                  │
│                                                                              │
│  Technology: Custom animation system + pre-built motion library              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STEP 5: VOICE GENERATION                               │
│                              (Bark)                                          │
│                                                                              │
│  For each dialogue entry:                                                    │
│    "watch out!" + emotion:"urgent" ──► Bark ──► audio_clip_1.wav            │
│                                                                              │
│  Features:                                                                   │
│  - Multiple voice styles                                                     │
│  - Emotion support (happy, sad, angry, urgent)                               │
│  - Sound effects (laughing, sighing)                                         │
│                                                                              │
│  Technology: Bark (Suno AI) - runs locally on Mac                            │
│  RAM: ~8GB                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       STEP 6: MUSIC GENERATION                               │
│                           (MusicGen)                                         │
│                                                                              │
│  Input: music_style + mood from scene parser                                 │
│    "playful, lighthearted" ──► MusicGen ──► background_music.wav            │
│                                                                              │
│  Features:                                                                   │
│  - Genre control (orchestral, electronic, jazz, etc.)                        │
│  - Mood control (happy, tense, sad, epic)                                    │
│  - Duration control (match scene length)                                     │
│                                                                              │
│  Technology: MusicGen (Meta) - runs locally on Mac                           │
│  RAM: ~8GB                                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 7: FINAL COMPOSITION                               │
│                                                                              │
│  Combine all elements:                                                       │
│  - 3D scene with models                                                      │
│  - Animation timeline                                                        │
│  - Voice clips (synced to timeline)                                          │
│  - Background music                                                          │
│                                                                              │
│  Output Options:                                                             │
│  - Interactive 3D viewer (browser)                                           │
│  - **Export as video (MP4)** ← PRIMARY OUTPUT                                │
│                                                                              │
│  Technology: React Three Fiber + Web Audio API                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### AI Models

| Component | Model | Why This Choice | Runs on Mac M4? |
|-----------|-------|-----------------|-----------------|
| **3D Generation** | Hunyuan3D-2-Mac | Best quality open-source, Mac fork exists | ✅ Yes (2-4 min) |
| **Scene Parser** | Claude API | Better quality, reliable parsing | ✅ Yes (API) |
| **Voice (TTS)** | Bark | Realistic, emotional, offline | ✅ Yes |
| **Music** | MusicGen | Text-to-music, offline | ✅ Yes |

### Existing Stack (Keep)

| Component | Technology | Status |
|-----------|------------|--------|
| Frontend | Next.js 14 + React Three Fiber | ✅ Keep |
| Backend | Flask 3.0 | ✅ Keep |
| Database | Supabase (PostgreSQL) | ✅ Keep |
| Auth | Supabase Auth | ✅ Keep |
| 3D Viewer | React Three Fiber | ✅ Keep |

### New Dependencies

| Package | Purpose | Install Location |
|---------|---------|------------------|
| `hunyuan3d` | 3D generation | Separate conda env |
| `bark` | Voice generation | Backend venv |
| `audiocraft` | Music generation | Backend venv |
| `anthropic` | Claude API for scene parsing | Backend venv |
| `ffmpeg` | Video export (MP4) | System install |

---

## Implementation Phases

### Phase 1: Hunyuan3D Setup (Priority: HIGH)
**Goal:** Replace TripoSR with Hunyuan3D for better 3D quality

| Task | Description | Est. Time |
|------|-------------|-----------|
| 1.1 | Clone Hunyuan3D-2-Mac repository | 15 min |
| 1.2 | Create conda environment | 15 min |
| 1.3 | Install dependencies (PyTorch MPS) | 30 min |
| 1.4 | Download model weights | 30 min (download) |
| 1.5 | Test standalone generation | 30 min |
| 1.6 | Create API wrapper for Flask integration | 1 hr |
| 1.7 | Update backend routes | 1 hr |
| 1.8 | Test end-to-end 2D→3D with new model | 30 min |
| **Total** | | **~4-5 hrs** |

**Deliverable:** `/api/convert/2d-to-3d` uses Hunyuan3D instead of TripoSR

---

### Phase 2: Scene Parser (Priority: HIGH)
**Goal:** Convert natural language to structured scene description

| Task | Description | Est. Time |
|------|-------------|-----------|
| 2.1 | Set up Claude API integration | 30 min |
| 2.2 | Add Anthropic SDK to backend | 15 min |
| 2.3 | Design scene JSON schema | 1 hr |
| 2.4 | Create prompt engineering for scene parsing | 2 hrs |
| 2.5 | Build scene parser module | 2 hrs |
| 2.6 | Create API endpoint `/api/scene/parse` | 1 hr |
| 2.7 | Test with various input prompts | 1 hr |
| **Total** | | **~7-8 hrs** |

**Deliverable:** API that converts "A duck running toward stop board" → JSON

**Schema Design:**
```json
{
  "$schema": "scene_v1",
  "objects": [
    {
      "id": "string",
      "name": "string",
      "type": "character | prop | environment",
      "description": "string (for 3D generation)",
      "initial_position": {"x": 0, "y": 0, "z": 0},
      "scale": 1.0
    }
  ],
  "actions": [
    {
      "id": "string",
      "actor": "object_id",
      "action": "walk | run | fly | jump | stand | sit | turn",
      "target": "object_id | position | null",
      "duration": 2.0,
      "start_time": 0.0
    }
  ],
  "dialogue": [
    {
      "speaker": "object_id",
      "text": "string",
      "emotion": "neutral | happy | sad | angry | urgent",
      "start_time": 0.0
    }
  ],
  "audio": {
    "music_style": "string",
    "mood": "string",
    "duration": 10.0
  },
  "scene_settings": {
    "environment": "outdoor | indoor | abstract",
    "lighting": "day | night | sunset",
    "camera": "front | side | top | dynamic"
  }
}
```

---

### Phase 3: Scene Composer (Priority: HIGH)
**Goal:** Place generated 3D models in a scene

| Task | Description | Est. Time |
|------|-------------|-----------|
| 3.1 | Design scene graph format (Three.js compatible) | 1 hr |
| 3.2 | Build object placement logic | 2 hrs |
| 3.3 | Implement spatial relationships (near, on, behind) | 2 hrs |
| 3.4 | Add camera positioning | 1 hr |
| 3.5 | Add lighting setup | 1 hr |
| 3.6 | Create ground/environment generation | 1 hr |
| 3.7 | Create API endpoint `/api/scene/compose` | 1 hr |
| **Total** | | **~9-10 hrs** |

**Deliverable:** API that takes scene JSON + GLB files → composed scene

---

### Phase 4: Animation Engine (Priority: HIGH)
**Goal:** Animate objects with detailed, realistic movement

| Task | Description | Est. Time |
|------|-------------|-----------|
| 4.1 | Design animation timeline format | 1 hr |
| 4.2 | **Detailed walk cycle implementation** | 4 hrs |
| 4.3 | **Detailed run cycle implementation** | 3 hrs |
| 4.4 | Implement other movements (fly, jump) | 2 hrs |
| 4.5 | Implement rotation animations (turn, look_at) | 1 hr |
| 4.6 | Implement path calculation (A to B) with easing | 2 hrs |
| 4.7 | Create animation blending/transitions | 2 hrs |
| 4.8 | Build timeline synchronization | 1 hr |
| 4.9 | Create API endpoint `/api/scene/animate` | 1 hr |
| 4.10 | Frontend: Animation player component | 2 hrs |
| **Total** | | **~19-20 hrs** |

**Animation Quality:**
- Detailed walk cycles with proper foot placement
- Realistic run cycles with body lean and arm swing
- Smooth transitions between animation states
- Support for different character types (biped, quadruped)

**Deliverable:** Animated 3D scene with realistic movement playing in browser

---

### Phase 5: Voice Generation (Priority: MEDIUM)
**Goal:** Generate voice clips for dialogue

| Task | Description | Est. Time |
|------|-------------|-----------|
| 5.1 | Install Bark in backend environment | 30 min |
| 5.2 | Download Bark model weights | 30 min |
| 5.3 | Create voice generation module | 2 hrs |
| 5.4 | Implement emotion/style control | 1 hr |
| 5.5 | Create API endpoint `/api/audio/voice` | 1 hr |
| 5.6 | Sync voice to animation timeline | 2 hrs |
| 5.7 | Frontend: Audio player integration | 1 hr |
| **Total** | | **~8-9 hrs** |

**Deliverable:** Voice clips generated and synced to scene

---

### Phase 6: Music Generation (Priority: MEDIUM)
**Goal:** Generate background music

| Task | Description | Est. Time |
|------|-------------|-----------|
| 6.1 | Install MusicGen/AudioCraft | 30 min |
| 6.2 | Download model weights | 30 min |
| 6.3 | Create music generation module | 2 hrs |
| 6.4 | Implement style/mood control | 1 hr |
| 6.5 | Create API endpoint `/api/audio/music` | 1 hr |
| 6.6 | Match music duration to scene | 1 hr |
| 6.7 | Frontend: Background music player | 1 hr |
| **Total** | | **~7-8 hrs** |

**Deliverable:** Background music generated and playing with scene

---

### Phase 7: Frontend UI (Priority: HIGH)
**Goal:** Build the text-to-animation interface

| Task | Description | Est. Time |
|------|-------------|-----------|
| 7.1 | **Fix 3D model preview (currently broken)** | 2-3 hrs |
| 7.2 | Create text input page | 1 hr |
| 7.3 | Build generation progress UI | 2 hrs |
| 7.4 | Create scene preview component | 2 hrs |
| 7.5 | Build animation controls (play/pause/seek) | 2 hrs |
| 7.6 | **Video export (MP4)** | 4 hrs |
| 7.7 | Create scene editing UI (optional) | 3 hrs |
| **Total** | | **~16-17 hrs** |

**Export Options:**
- Primary: MP4 video file download
- Optional: GIF export for quick sharing

**Deliverable:** Complete UI for text-to-animation workflow with video export

---

### Phase 8: Integration & Testing (Priority: HIGH)
**Goal:** End-to-end testing and polish

| Task | Description | Est. Time |
|------|-------------|-----------|
| 8.1 | Integration testing | 3 hrs |
| 8.2 | Performance optimization | 3 hrs |
| 8.3 | Error handling & edge cases | 2 hrs |
| 8.4 | Demo preparation | 2 hrs |
| **Total** | | **~10 hrs** |

---

## Timeline Summary

| Phase | Description | Est. Time | Cumulative | Status |
|-------|-------------|-----------|------------|--------|
| 0 | ~~Fix 3D Preview Bug~~ | ~~2-3 hrs~~ | 3 hrs | ✅ DONE |
| 1 | Hunyuan3D Setup | 4-5 hrs | 8 hrs | 🔜 NEXT |
| 2 | Scene Parser (Claude API) | 7-8 hrs | 16 hrs |
| 3 | Scene Composer | 9-10 hrs | 26 hrs |
| 4 | Animation Engine (Detailed) | 19-20 hrs | 46 hrs |
| 5 | Voice Generation | 8-9 hrs | 55 hrs |
| 6 | Music Generation | 7-8 hrs | 63 hrs |
| 7 | Frontend UI + Video Export | 16-17 hrs | 80 hrs |
| 8 | Integration & Testing | 10 hrs | 90 hrs |
| **TOTAL** | | **~88-92 hrs** | |

**Realistic Timeline:** ~4 weeks (working 3-4 hrs/day)

---

## API Endpoints (New)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/scene/parse` | POST | Text → Scene JSON |
| `/api/scene/generate-assets` | POST | Scene JSON → 3D models |
| `/api/scene/compose` | POST | Models → Composed scene |
| `/api/scene/animate` | POST | Scene → Animated scene |
| `/api/audio/voice` | POST | Text → Voice audio |
| `/api/audio/music` | POST | Style → Music audio |
| `/api/scene/render` | POST | Full scene → Video/GIF |
| `/api/scene/full-pipeline` | POST | Text → Complete animation |

---

## File Structure (New)

```
backend/
├── models/
│   ├── hunyuan3d/           # NEW: Hunyuan3D integration
│   │   ├── __init__.py
│   │   ├── generator.py
│   │   └── config.py
│   ├── scene_parser/        # NEW: LLM scene parsing
│   │   ├── __init__.py
│   │   ├── parser.py
│   │   ├── schema.py
│   │   └── prompts.py
│   ├── scene_composer/      # NEW: Scene composition
│   │   ├── __init__.py
│   │   ├── composer.py
│   │   ├── placement.py
│   │   └── environment.py
│   ├── animation_engine/    # NEW: Animation system
│   │   ├── __init__.py
│   │   ├── animator.py
│   │   ├── timeline.py
│   │   ├── movements.py
│   │   └── motion_library/
│   ├── voice_generator/     # NEW: Bark TTS
│   │   ├── __init__.py
│   │   ├── generator.py
│   │   └── emotions.py
│   └── music_generator/     # NEW: MusicGen
│       ├── __init__.py
│       ├── generator.py
│       └── styles.py
├── api/
│   ├── scene_routes.py      # NEW
│   └── audio_routes.py      # NEW
└── ...

frontend/
├── app/
│   └── (dashboard)/
│       └── creator/
│           └── text-to-animation/  # NEW
│               ├── page.tsx
│               └── components/
│                   ├── TextInput.tsx
│                   ├── GenerationProgress.tsx
│                   ├── ScenePreview.tsx
│                   ├── AnimationPlayer.tsx
│                   └── ExportOptions.tsx
└── ...
```

---

## Hardware Requirements

### Development (Your Mac M4 Pro)
- **RAM:** 24GB (sufficient for sequential model loading)
- **Storage:** ~50GB free (model weights)
- **GPU:** M4 Pro (MPS backend)

### Memory Management Strategy
Since all models can't run simultaneously:

```
Step 1: Load LLM → Parse scene → Unload LLM
Step 2: Load Hunyuan3D → Generate models → Unload
Step 3: Compose scene (no heavy models needed)
Step 4: Create animations (no heavy models needed)
Step 5: Load Bark → Generate voice → Unload
Step 6: Load MusicGen → Generate music → Unload
Step 7: Combine everything → Render
```

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hunyuan3D doesn't work on Mac | HIGH | Fallback to TripoSR or cloud API |
| 24GB RAM not enough | MEDIUM | Sequential loading, reduce batch sizes |
| Scene parser misunderstands input | MEDIUM | Better prompts, manual override UI |
| Animation looks robotic | MEDIUM | Pre-built motion library, tweening |
| Generation too slow for demo | LOW | Pre-generate demo scenes |

---

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] **Fix 3D model preview in browser**
- [ ] Text input → 3D scene with 2+ objects
- [ ] Detailed movement animations (walk/run cycles)
- [ ] Voice generation for dialogue
- [ ] Background music
- [ ] Play in browser
- [ ] **Export as MP4 video**

### Nice to Have
- [ ] Multiple camera angles
- [ ] More animation types
- [ ] Scene editing UI
- [ ] Real-time generation progress
- [ ] GIF export option

---

## Demo Scenarios

### Demo 1: Simple Movement
```
Input: "A robot walking forward"
Output: 3D robot with walking animation
```

### Demo 2: Two Objects Interaction
```
Input: "A cat running toward a ball"
Output: 3D cat and ball, cat moves to ball
```

### Demo 3: Full Feature Demo
```
Input: "A knight approaches a castle gate and says 'Open the gates!' with epic music"
Output: Full scene with knight, castle, voice, and orchestral music
```

---

## Decisions Made

| Question | Decision |
|----------|----------|
| **LLM Choice** | ✅ Claude API (better quality) |
| **Animation Detail** | ✅ Detailed walk/run cycles |
| **Export Format** | ✅ MP4 video file |
| **Object Library** | TBD - Generate all via Hunyuan3D |

---

## Next Steps

1. ~~**Review this plan** - confirm scope and approach~~ ✅ DONE
2. ~~**Phase 0** - Fix 3D model preview bug~~ ✅ DONE (Jan 23, 2026)
3. **Phase 1** - Set up Hunyuan3D on your Mac ← **CURRENT**
4. **Phase 2** - Build scene parser with Claude API
5. Continue sequentially...

---

## Work Log

### January 23, 2026 - Phase 0 Completed

**Problem Identified:**
- The `ModelViewer.tsx` component had a `Model` function that only loaded OBJ files
- When a GLB/GLTF file URL was passed, it logged "Not an OBJ file, skipping" and returned null
- The `GLTFModel` component existed but was never used in the Canvas

**Fix Applied:**
1. Renamed `Model` to `OBJModel` (OBJ-specific loader)
2. Rewrote `GLTFModel` to use `GLTFLoader` from three-stdlib
3. Created new unified `Model` component that:
   - Auto-detects file format from URL extension
   - Falls back to content-type header detection for API URLs
   - Routes to appropriate loader (OBJModel or GLTFModel)
4. Added proper centering and scaling for both formats
5. Removed unused `format` prop from assets page

**Files Changed:**
- `frontend/components/creator/ModelViewer.tsx` - Fixed model loading
- `frontend/app/(dashboard)/creator/assets/page.tsx` - Removed unused prop

---

## Next Priority: Phase 1 - Hunyuan3D Setup

**Goal:** Replace TripoSR with Hunyuan3D for better 3D quality

**Tasks:**
1. Clone Hunyuan3D-2-Mac repository
2. Create conda environment
3. Install dependencies (PyTorch MPS)
4. Download model weights
5. Test standalone generation
6. Create API wrapper for Flask integration
7. Update backend routes
8. Test end-to-end 2D→3D with new model

---

*Last Updated: January 23, 2026*
*Status: Phase 0 COMPLETE - Ready to begin Phase 1*

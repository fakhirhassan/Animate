# MESH - AI-Powered Animation & 3D Generation Platform

MESH is a full-stack AI platform for creators: convert 2D images into textured 3D models, generate text-to-video animations, synthesize speech, and stitch full multi-clip scenes — all from a single web app. Built with Next.js 14 (frontend) and Flask 3.0 (backend), with Supabase for auth and a hybrid local/cloud GPU pipeline (Mac M4 Pro for light work, RunPod Serverless for heavy generation).

## Features

- **2D → 3D Conversion (TRELLIS)**: Upload a single image, get a fully textured GLB with PBR materials. Powered by Microsoft TRELLIS running on RunPod cloud GPUs.
- **Text → Video (Wan2.1-T2V-1.3B)**: Generate short videos from text prompts. Auto-routes between local GPU and RunPod cloud based on hardware.
- **Text → Image (SDXL)**: High-quality image generation via RunPod Serverless.
- **Text → Speech (Kokoro-82M)**: 23 voice presets, runs locally on CPU.
- **Scene Parsing (Ollama + llama3.1)**: Convert long-form scripts into per-clip prompts.
- **Full Animation Pipeline**: Script → scenes → video clips → voiceover → FFmpeg stitch → final MP4.
- **Interactive 3D Viewer**: Real-time GLB/OBJ visualization with React Three Fiber, PBR lighting, OrbitControls.
- **Auth & RBAC**: Supabase Auth with creator/admin roles, RLS-protected tables.
- **Admin Dashboard**: User management, conversion analytics, system stats.
- **Hybrid GPU Routing**: `GPU_MODE=auto` picks local or RunPod based on detected VRAM; `cloud` and `local` overrides supported.

## Architecture

```
Mac (always running):
  ├── Next.js Frontend (:3000)
  └── Flask Backend (:5001)
      ├── Auth, Admin, History    → local
      ├── /api/animation/*        → local GPU or RunPod (auto)
      ├── /api/image/generate     → RunPod (SDXL)
      ├── /api/voice/*            → local (Kokoro)
      └── /api/convert/*          → RunPod (TRELLIS image-to-3D)

RunPod Serverless (pay-per-use, scales to zero):
  ├── Wan2.1-T2V-1.3B  (text-to-video)
  ├── SDXL             (text-to-image)
  └── TRELLIS          (image-to-3D, GLB with baked PBR textures)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- Supabase project
- (Optional) RunPod account + API key for cloud GPU features
- FFmpeg, Ollama (for full animation pipeline)

### Backend Setup
```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: Supabase keys + RunPod keys (if using cloud GPU)
PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0 PYTORCH_ENABLE_MPS_FALLBACK=1 PORT=5001 python3 app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### RunPod Worker (TRELLIS image-to-3D)
The TRELLIS worker lives in [runpod-worker/](runpod-worker/). To deploy:

```bash
docker buildx build --platform linux/amd64 \
  -f runpod-worker/Dockerfile.trellis \
  -t <your-dockerhub>/trellis-worker:vX \
  --push .
```

Then create a RunPod Serverless endpoint pointing at the pushed image, attach a Network Volume mounted at `/runpod-volume` (model cache), and put the endpoint ID into `RUNPOD_3D_ENDPOINT_ID` in `backend/.env`.

### Access
- Frontend: http://localhost:3000
- Backend:  http://localhost:5001

## Environment Variables

Key settings in `backend/.env`:

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` / `SUPABASE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Auth + DB |
| `GPU_MODE` | `auto` (default), `local`, or `cloud` |
| `RUNPOD_API_KEY` | RunPod Serverless API key |
| `RUNPOD_ENDPOINT_ID` | Default endpoint (T2V) |
| `RUNPOD_T2I_ENDPOINT_ID` | SDXL text-to-image endpoint |
| `RUNPOD_3D_ENDPOINT_ID` | TRELLIS image-to-3D endpoint |

## Tech Stack

**Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Three Fiber, three-stdlib (GLTFLoader/OBJLoader)

**Backend**: Flask 3.0, Python 3.12, Diffusers, PyTorch, Kokoro, Ollama, FFmpeg

**3D Pipeline (RunPod worker)**: Microsoft TRELLIS, xformers, spconv, kaolin, nvdiffrast, mip-splatting (diff_gaussian_rasterization)

**Database / Auth**: Supabase (PostgreSQL + Auth + Row-Level Security)

**Testing**: pytest, Selenium WebDriver, chromedriver-autoinstaller

## Project Structure

```
Mesh/
├── frontend/              # Next.js 14 app
│   ├── app/(auth)/        # Login / signup
│   ├── app/(dashboard)/   # Creator + admin dashboards
│   ├── components/        # ModelViewer, UI components
│   └── store/, lib/       # Zustand store, axios API client
├── backend/               # Flask 3.0 app
│   ├── api/               # Route blueprints
│   ├── services/          # Business logic (conversion, video, voice, cloud GPU)
│   ├── models/            # Local model wrappers (MiDaS, Wan2.1)
│   └── utils/auth.py      # @login_required decorator
├── runpod-worker/         # RunPod Serverless workers
│   ├── handler_trellis.py # TRELLIS image-to-3D handler
│   ├── Dockerfile.trellis
│   └── handler.py         # T2V / T2I handler
└── docs/                  # PROJECT_PLAN.md, CHANGELOG.md, QA reports
```

## Documentation

- **[PROJECT_PLAN.md](PROJECT_PLAN.md)** — Architecture, roadmap, phase status
- **[CHANGELOG.md](CHANGELOG.md)** — Change history
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** — Detailed install instructions
- **[QA_REPORT.md](QA_REPORT.md)** / **[QA_AUDIT.md](QA_AUDIT.md)** — QA findings + bug log
- **[CLAUDE.md](CLAUDE.md)** — Project conventions for AI-assisted development

## Project Status

~70% complete. TRELLIS image-to-3D pipeline is fully working end-to-end (textured GLB output rendered with PBR lighting in the in-app viewer). Full animation pipeline integrated with RunPod cloud routing. Auth, RBAC, and admin dashboard complete. Remaining work: end-to-end testing of the full multi-clip pipeline, polish, and demo prep.

## License

This project is part of an academic final year project.

---

Built by Fakhir Hassan

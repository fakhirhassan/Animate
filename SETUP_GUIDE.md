# AniMate - AI Lab Installation Guide

Complete setup guide for installing AniMate on the AI Lab PC (NVIDIA GPU).

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Python | 3.10 - 3.12 | 3.12 recommended |
| Node.js | 18+ | 20.x recommended |
| npm | 9+ | comes with Node.js |
| Git | 2.x | any recent version |
| NVIDIA GPU | 14GB+ VRAM | for HunyuanVideo 1.5 |
| CUDA | 11.8+ | 12.x recommended |
| Ollama | latest | for scene parsing LLM |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/fakhirhassan/Animate.git
cd Animate
git checkout hassan
```

---

## Step 2: Backend Setup

### 2.1 Create Python Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

### 2.2 Install Python Dependencies

```bash
pip install --upgrade pip

# Install PyTorch with CUDA support FIRST
# Check your CUDA version with: nvidia-smi
# For CUDA 12.x:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# For CUDA 11.8:
# pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Install all other dependencies
pip install -r requirements.txt

# Install supabase client (not in requirements.txt)
pip install supabase
```

### 2.3 Verify CUDA is Working

```bash
python3 -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"None\"}')"
```

You should see:
```
CUDA available: True
GPU: NVIDIA <your-gpu-name>
```

### 2.4 Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in these **required** values:

```env
# Flask
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=<generate-a-random-string>
PORT=5001
HOST=0.0.0.0

# CORS - Update if frontend runs on a different machine
CORS_ORIGINS=http://localhost:3000,http://<ai-lab-ip>:3000

# Supabase (REQUIRED - get from Supabase dashboard)
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# JWT
JWT_SECRET_KEY=<generate-a-random-string>
JWT_ACCESS_TOKEN_EXPIRES=3600

# GPU
ENABLE_GPU=true

# File uploads
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=104857600
```

**Getting Supabase credentials:**
1. Go to https://supabase.com/dashboard
2. Open your project (or create one)
3. Go to Settings > API
4. Copy:
   - **Project URL** -> `SUPABASE_URL`
   - **anon public key** -> `SUPABASE_KEY`
   - **service_role key** -> `SUPABASE_SERVICE_ROLE_KEY`

### 2.5 Set Up the Database

Run the schema SQL in your Supabase SQL Editor:

1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `backend/database_schema.sql`
3. Run it

This creates the `users`, `conversions`, and `projects` tables with RLS policies.

**If RLS causes issues**, also run `backend/disable_rls.sql` to disable RLS temporarily.

### 2.6 Create Upload Directories

```bash
mkdir -p uploads/input uploads/output uploads/output/videos logs
```

### 2.7 Test Backend

```bash
# Make sure venv is activated
source venv/bin/activate

python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5001
 * AniMate backend started in development mode
```

Test it:
```bash
curl http://localhost:5001/health
# Should return: {"status": "healthy", "service": "AniMate Backend", "version": "1.0.0"}
```

Press `Ctrl+C` to stop.

---

## Step 3: Install Ollama (Scene Parser)

Ollama runs the Llama 3.1 LLM locally for parsing text into structured scene data.

### 3.1 Install Ollama

```bash
# Linux (AI Lab)
curl -fsSL https://ollama.com/install.sh | sh
```

### 3.2 Pull the Model

```bash
ollama pull llama3.1:8b
```

This downloads ~4.7 GB. Wait for it to complete.

### 3.3 Verify Ollama

```bash
# Start Ollama server (may already be running as a service)
ollama serve &

# Test it
ollama run llama3.1:8b "Say hello in one word"
```

You should get a response. Press `Ctrl+D` to exit.

### 3.4 Test Scene Parser

With the backend running:
```bash
curl -X POST http://localhost:5001/api/script/analyze \
  -H "Content-Type: application/json" \
  -d '{"script": "A red ball bouncing on a green field with mountains in the background"}'
```

Should return structured scene JSON with objects, actions, camera, etc.

---

## Step 4: HunyuanVideo 1.5 (Text-to-Video)

The model auto-downloads from HuggingFace on first use (~16GB+). No manual download needed.

### 4.1 Verify GPU Memory

```bash
nvidia-smi
```

You need at least **14GB VRAM** free. The model uses CPU offloading to fit in limited VRAM.

### 4.2 Pre-download the Model (Optional)

To avoid waiting during first API call, you can pre-download:

```bash
# Activate venv
cd backend
source venv/bin/activate

python3 -c "
from diffusers import HunyuanVideoPipeline
import torch
print('Downloading HunyuanVideo 1.5 model...')
pipe = HunyuanVideoPipeline.from_pretrained(
    'hunyuanvideo-community/HunyuanVideo-1.5-Diffusers-480p_t2v',
    torch_dtype=torch.bfloat16,
)
print('Download complete!')
del pipe
"
```

This will download to `~/.cache/huggingface/hub/` (~16GB). Be patient.

### 4.3 Test Video Generation

With the backend running:

```bash
# Check if GPU is available
curl http://localhost:5001/api/animation/check

# Generate a test video (will take 3-10 minutes on first run)
curl -X POST http://localhost:5001/api/animation/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A golden retriever running on a beach at sunset", "num_frames": 31, "num_inference_steps": 20}'
```

The response will contain a `video_url` path to the generated MP4.

---

## Step 5: TripoSR (2D to 3D Conversion)

TripoSR auto-downloads from HuggingFace on first use (~1.6GB).

### 5.1 Install Additional Dependencies

```bash
# These should already be installed from requirements.txt, but verify:
pip install trimesh open3d scikit-image rembg
```

### 5.2 Pre-download TripoSR Model (Optional)

```bash
python3 -c "
from huggingface_hub import snapshot_download
print('Downloading TripoSR model...')
snapshot_download('stabilityai/TripoSR', local_dir='models/two_d_to_three_d/tsr_weights')
print('Done!')
"
```

### 5.3 Known Fix Required

In `backend/models/two_d_to_three_d/tsr/system.py`, line 69 must have `weights_only=False`:

```python
# This should already be fixed in the code, but verify:
ckpt = torch.load(weights, map_location=map_location, weights_only=False)
```

---

## Step 6: Frontend Setup

### 6.1 Install Node.js Dependencies

```bash
cd frontend

# Use --legacy-peer-deps to avoid React 18 peer dep conflicts
npm install --legacy-peer-deps
```

### 6.2 Configure Frontend Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# If frontend and backend are on the SAME machine:
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# If frontend is on a DIFFERENT machine than backend:
# NEXT_PUBLIC_API_URL=http://<ai-lab-ip>:5001/api
```

### 6.3 Build and Run Frontend

```bash
# Development mode
npm run dev

# OR Production build
npm run build
npm run start
```

Frontend runs on http://localhost:3000

---

## Step 7: Running Everything Together

Open 3 terminal windows/tabs:

### Terminal 1: Ollama Server
```bash
ollama serve
# (May already be running as a system service)
```

### Terminal 2: Flask Backend
```bash
cd Animate/backend
source venv/bin/activate
python app.py
```

### Terminal 3: Next.js Frontend
```bash
cd Animate/frontend
npm run dev
```

### Access the App
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- Health Check: http://localhost:5001/health

---

## Step 8: Test the Full Flow

1. Open http://localhost:3000 in your browser
2. Sign up or log in (default test accounts below)
3. Navigate to **Creator > Animate** in the sidebar
4. Type a prompt like: *"A cat walking through a snowy forest"*
5. Click **Generate Video**
6. Wait 3-10 minutes for video generation
7. Preview and download the MP4

### Default Test Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@animate.com | admin123 | Admin |
| creator@animate.com | creator123 | Creator |

---

## Troubleshooting

### CUDA Out of Memory
```
RuntimeError: CUDA out of memory
```
- Reduce resolution: use 480p instead of 720p
- Reduce frames: use 31 instead of 61
- Reduce inference steps: use 20 instead of 30
- Make sure no other GPU processes are running: `nvidia-smi`

### Ollama Connection Refused
```
ConnectionError: Connection refused
```
- Start Ollama: `ollama serve`
- Check if running: `curl http://localhost:11434/api/tags`
- Pull model if missing: `ollama pull llama3.1:8b`

### PyTorch CUDA Not Available
```python
torch.cuda.is_available() returns False
```
- Check CUDA install: `nvcc --version`
- Check NVIDIA driver: `nvidia-smi`
- Reinstall PyTorch with correct CUDA version:
  ```bash
  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
  ```

### Frontend Can't Connect to Backend
- Check backend is running on port 5001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS_ORIGINS in backend `.env` includes the frontend URL
- If accessing from different machine, use the actual IP, not `localhost`

### HuggingFace Download Fails
- Set your HF token: `huggingface-cli login`
- Or set env var: `export HF_TOKEN=your-token`
- Check disk space: model needs ~16GB free
- Try manual download: `huggingface-cli download hunyuanvideo-community/HunyuanVideo-1.5-Diffusers-480p_t2v`

### OpenMP Segfault (open3d + onnxruntime)
Already fixed in `app.py` with:
```python
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
```

### Backend Port 5000 Conflict (macOS only)
We use port 5001. Already configured in `app.py` and `.env`.

---

## Project Structure Reference

```
Animate/
├── backend/
│   ├── app.py                  # Flask entry point (port 5001)
│   ├── config.py               # App configuration
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (create from .env.example)
│   ├── database_schema.sql     # Supabase SQL schema
│   ├── api/                    # Route handlers
│   │   ├── animation_routes.py # POST /api/animation/generate (HunyuanVideo)
│   │   ├── script_routes.py    # POST /api/script/analyze (Ollama)
│   │   ├── conversion_routes.py# POST /api/convert/2d-to-3d (TripoSR)
│   │   ├── auth_routes.py      # Authentication endpoints
│   │   └── admin_routes.py     # Admin endpoints
│   ├── models/
│   │   ├── video_generator/    # HunyuanVideo 1.5 wrapper
│   │   ├── script_processor/   # Ollama scene parser
│   │   └── two_d_to_three_d/   # TripoSR 2D→3D conversion
│   ├── services/               # Business logic layer
│   ├── supabase_client/        # Database client
│   └── uploads/                # Generated files (videos, models)
│
├── frontend/
│   ├── app/                    # Next.js pages
│   │   ├── (auth)/             # Login, signup, etc.
│   │   └── (dashboard)/        # Creator dashboard
│   │       └── creator/
│   │           ├── animate/    # Text-to-video page
│   │           ├── 2d-to-3d/   # 2D to 3D converter
│   │           └── assets/     # Asset management
│   ├── components/             # React components
│   ├── lib/api.ts              # API client (axios)
│   ├── store/                  # Zustand state management
│   └── package.json            # Node dependencies
│
├── SETUP_GUIDE.md              # This file
└── README.md
```

---

## Quick Start Cheat Sheet

```bash
# 1. Clone and checkout
git clone https://github.com/fakhirhassan/Animate.git && cd Animate && git checkout hassan

# 2. Backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt && pip install supabase
cp .env.example .env   # EDIT THIS FILE with Supabase creds!
mkdir -p uploads/input uploads/output uploads/output/videos logs

# 3. Ollama
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1:8b

# 4. Frontend
cd ../frontend && npm install --legacy-peer-deps
cp .env.local.example .env.local   # Edit if needed

# 5. Run (3 terminals)
# T1: ollama serve
# T2: cd backend && source venv/bin/activate && python app.py
# T3: cd frontend && npm run dev

# 6. Open http://localhost:3000
```
okay im in AI computer
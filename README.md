# MESH - AI-Powered 3D Generation Platform

MESH is a full-stack web application that transforms 2D images into 3D models using AI-powered depth estimation. Built with Next.js 14 for the frontend and Flask for the backend.

## Features

- **2D to 3D Conversion**: Upload images and convert them to 3D models using AI
- **Interactive 3D Viewer**: Real-time 3D model visualization with React Three Fiber
- **User Authentication**: Secure login/signup with Supabase Auth
- **Admin Dashboard**: User management and system analytics
- **Multiple Export Formats**: Support for OBJ, GLB, and GLTF formats

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
PORT=5001 python3 app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Tech Stack

**Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Three Fiber, Zustand

**Backend**: Flask, Supabase, PyTorch, Open3D, MiDaS

## Documentation

- **[PROJECT_PLAN.md](PROJECT_PLAN.md)** - Complete project documentation, architecture, and roadmap
- **[CHANGELOG.md](CHANGELOG.md)** - Change history and file location reference

## Project Status

Currently at 30% completion. See [PROJECT_PLAN.md](PROJECT_PLAN.md) for implementation status and roadmap.

## License

This project is part of an academic final year project.

---

Built by Fakhir Hassan

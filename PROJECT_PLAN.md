# MESH - AI-Powered Animation & 3D Generation Platform

## Project Overview

**Name**: MESH (formerly ANIAD/AniMate)
**Type**: Full-stack AI Animation & 3D Generation Platform
**Status**: 30% Complete - Active Development
**Last Updated**: January 2026

### What is MESH?

MESH is a comprehensive platform that transforms creative workflows using AI. The core features include:

1. **2D to 3D Conversion** - Transform 2D images into 3D models using AI depth estimation
2. **AI Script Generation** - Generate animation scripts using AI (planned)
3. **AI Voice Generation** - Create voiceovers using AI (planned)
4. **AI Music Generation** - Generate background music (planned)
5. **Animation Generation** - Create animations from scripts (planned)
6. **Emotion Detection** - Analyze emotions in content (planned)

---

## Current Implementation Status

### Completed (30%)

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | Done | Hero, Features, How It Works, CTA sections |
| User Authentication | Done | Login, Signup, JWT tokens with Supabase Auth |
| Admin Dashboard | Done | User management, system stats, CRUD operations |
| Creator Dashboard | Done | Project overview, stats, navigation |
| 2D to 3D Conversion | Partial | Works with MiDaS depth estimation (2.5D quality) |
| Conversion History | Done | Database persistence, view/download/delete |
| Assets Page | Done | Grid/list view of all user's 3D models |
| User Data Isolation | Done | Each user sees only their own data |
| Role-Based Access | Done | Admin vs Creator permissions |

### Not Yet Implemented (70%)

| Feature | Priority | Description |
|---------|----------|-------------|
| TripoSR Integration | High | True 3D model generation (better than current MiDaS) |
| Script Generation | High | AI-powered animation script creation |
| Voice Generation | Medium | Text-to-speech for animations |
| Music Generation | Medium | AI background music creation |
| Animation Generation | High | Full animation pipeline |
| Real-time Preview | Medium | WebSocket-based progress updates |
| File Storage (S3) | Medium | Production file storage |
| Email Verification | Low | Production email confirmation |
| Rate Limiting | Low | API rate limiting |
| Payment Integration | Low | Subscription/credits system |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2+ | React framework (App Router) |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.4+ | Styling |
| Radix UI + shadcn/ui | Latest | UI components |
| React Three Fiber | 9.4+ | 3D rendering |
| Three.js | 0.181+ | 3D graphics |
| Framer Motion | 12.x | Animations |
| Zustand | 5.x | State management |
| React Hook Form | 7.x | Form handling |
| Zod | 4.x | Validation |
| Axios | 1.13+ | HTTP client |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Flask | 3.0 | Python web framework |
| Supabase | Latest | Database & Auth |
| SQLAlchemy | 2.x | ORM (optional) |
| PyTorch | 2.x | Deep learning |
| Transformers | 4.x | AI models |
| Open3D | 0.18+ | 3D processing |
| Trimesh | 4.x | Mesh operations |
| timm | 0.9+ | MiDaS depth estimation |
| Pillow | 10.x | Image processing |
| OpenCV | 4.8+ | Computer vision |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Supabase | PostgreSQL database + Auth |
| Local Storage | File uploads (development) |
| AWS S3 | File uploads (production, planned) |
| Redis + Celery | Background jobs (planned) |

---

## Project Structure

```
Mesh/
├── frontend/                       # Next.js Application
│   ├── app/                        # App Router
│   │   ├── (auth)/                 # Auth pages
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (dashboard)/            # Protected pages
│   │   │   ├── admin/page.tsx      # Admin dashboard
│   │   │   └── creator/            # Creator area
│   │   │       ├── page.tsx        # Dashboard home
│   │   │       ├── 2d-to-3d/page.tsx
│   │   │       ├── assets/page.tsx
│   │   │       └── layout.tsx
│   │   ├── features/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── creator/                # Creator components
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── ConversionSettings.tsx
│   │   │   ├── ConversionHistory.tsx
│   │   │   └── ModelViewer.tsx
│   │   ├── landing/                # Landing page sections
│   │   ├── shared/                 # Navbar, Footer, Logo
│   │   └── ui/                     # shadcn components
│   ├── lib/
│   │   ├── api.ts                  # API client
│   │   └── utils.ts
│   ├── store/
│   │   └── authStore.ts            # Zustand auth state
│   └── public/                     # Static assets
│
├── backend/                        # Flask Application
│   ├── api/                        # Route handlers
│   │   ├── auth_routes.py
│   │   ├── conversion_routes.py
│   │   ├── admin_routes.py
│   │   ├── script_routes.py        # Stub
│   │   ├── voice_routes.py         # Stub
│   │   └── animation_routes.py     # Stub
│   ├── models/                     # ML Models
│   │   └── two_d_to_three_d/
│   │       ├── converter.py
│   │       ├── depth_estimator.py  # MiDaS
│   │       ├── mesh_generator.py
│   │       └── triposr_converter.py # Not working
│   ├── services/
│   │   ├── conversion_service.py
│   │   ├── conversion_db_service.py
│   │   └── admin_stats_service.py
│   ├── database/
│   │   └── schema.sql
│   ├── supabase_client/
│   │   └── supabase_config.py
│   ├── uploads/
│   │   ├── input/                  # Uploaded images
│   │   └── output/                 # Generated models
│   ├── app.py                      # Entry point
│   ├── config.py
│   └── requirements.txt
│
├── PROJECT_PLAN.md                 # This file
└── CHANGELOG.md                    # Change tracking
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | User login |
| POST | `/signup` | User registration |
| POST | `/logout` | User logout |
| GET | `/me` | Get current user |
| POST | `/refresh` | Refresh JWT token |
| POST | `/send-otp` | Send OTP for password reset |
| POST | `/verify-otp` | Verify OTP |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |

### 2D to 3D Conversion (`/api/convert`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/2d-to-3d` | Upload & convert image |
| GET | `/history` | Get user's conversions |
| GET | `/history/:id` | Get specific conversion |
| DELETE | `/history/:id` | Delete conversion |
| GET | `/download/:jobId` | Download 3D model |
| GET | `/status/:jobId` | Check conversion status |
| GET | `/stats` | Get user's conversion stats |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | System statistics |
| GET | `/users` | List all users |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| GET | `/analytics/user-growth` | User growth data |
| GET | `/analytics/conversions` | Conversion activity |
| GET | `/activities` | Recent activities |

---

## Database Schema

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'creator',  -- 'admin' or 'creator'
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
)
```

### Conversions Table
```sql
conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  file_name TEXT,
  original_image_url TEXT,
  model_url TEXT,
  thumbnail_url TEXT,
  output_format TEXT,  -- 'obj', 'glb', 'gltf'
  quality TEXT,        -- 'low', 'medium', 'high'
  status TEXT,         -- 'pending', 'processing', 'completed', 'failed'
  file_size TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Environment Configuration

### Backend (.env)
```env
# Flask
FLASK_ENV=development
PORT=5001
SECRET_KEY=your-secret-key

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Uploads
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=104857600  # 100MB

# Optional
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
REDIS_URL=
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

---

## Running the Project

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

---

## Known Issues & Limitations

### 2D to 3D Conversion Quality
**Current State**: Using MiDaS depth estimation which produces "2.5D" models (relief/depth maps), not true 3D.

**Limitation**: Models look like relief sculptures - only the front face has depth, no backside geometry.

**Solution Options**:
1. Implement TripoSR properly (requires `tsr` module setup)
2. Integrate commercial APIs (Luma AI, Meshy.ai) for production quality
3. Keep MiDaS for free tier, premium API for paid users

### Authentication
- Currently using Supabase Auth with JWT
- Service role key used for backend operations (bypasses RLS)
- Keep service role key secret!

---

## Design System

### Colors
- **Primary**: Blue-600 (#3B82F6) to Purple-600 (#8B5CF6) gradient
- **Background**: White with subtle blue gradient
- **Text**: Gray-900 (headings), Gray-600 (body)
- **Success**: Green-500 (#10B981)
- **Error**: Red-500 (#EF4444)

### Components
- Cards: `bg-white rounded-2xl border-gray-100 shadow-sm hover:shadow-xl`
- Buttons: `gradient-button rounded-xl` or `border-gray-200 rounded-xl`
- Inputs: `border-gray-200 rounded-xl focus:ring-blue-500`

### Spacing
- Section gaps: `mb-12`
- Card padding: `p-6` or `p-8`
- Grid gaps: `gap-8`

---

## Future Roadmap

### Phase 1: Core Improvements
- [ ] Fix TripoSR for better 3D quality
- [ ] Add WebSocket for real-time progress
- [ ] Implement proper error toasts
- [ ] Add loading states everywhere

### Phase 2: New AI Features
- [ ] Script generation with GPT
- [ ] Voice generation with ElevenLabs
- [ ] Music generation
- [ ] Animation pipeline

### Phase 3: Production Ready
- [ ] AWS S3 for file storage
- [ ] Redis + Celery for background jobs
- [ ] Email verification
- [ ] Rate limiting
- [ ] Monitoring (Sentry)

### Phase 4: Monetization
- [ ] Subscription plans
- [ ] Credits system
- [ ] Payment integration

---

## Quick Reference

### Start Development
```bash
# Terminal 1 - Backend
cd backend && PORT=5001 python3 app.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### Test Database
```bash
cd backend && python3 setup_database.py
```

### Default Admin
- Email: admin@aniad.com
- Password: Spring@0@0

### Key Files to Modify

| Task | Files |
|------|-------|
| Add API endpoint | `backend/api/*.py` |
| Add frontend page | `frontend/app/*/page.tsx` |
| Add UI component | `frontend/components/` |
| Modify auth | `backend/api/auth_routes.py`, `frontend/store/authStore.ts` |
| Modify 2D→3D | `backend/models/two_d_to_three_d/` |
| Update database | `backend/database/schema.sql` |

---

## Contributors

- **Fakhir Hassan** - Lead Developer

---

*This document consolidates all project documentation. See CHANGELOG.md for detailed change history.*

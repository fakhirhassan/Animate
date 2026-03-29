# QA Report - MESH (AI-Powered Animation Platform)

**Generated:** March 29, 2026
**Project:** MESH - Final Year Project
**Author:** Fakhir Hassan
**QA Agent:** Claude Code

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (App Router) | 14.2 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS + shadcn/ui + Radix UI | 3.4 |
| **3D Rendering** | React Three Fiber + Three.js | 8.15 / 0.181 |
| **State Management** | Zustand (persisted) | 5.x |
| **HTTP Client** | Axios | 1.13 |
| **Forms** | React Hook Form + Zod | 7.66 |
| **Backend** | Flask | 3.0 |
| **Language** | Python | 3.12 |
| **Database** | Supabase (PostgreSQL) | Cloud |
| **Auth** | Supabase Auth (JWT) | Built-in |
| **Video Model** | Wan2.1-T2V-1.3B (Diffusers) | 0.37 |
| **TTS Model** | Kokoro-82M | 0.9.4 |
| **Scene Parser** | Ollama + llama3.1:8b | Local |
| **3D Pipeline** | MiDaS + Open3D + Trimesh | Various |

---

## 2. Architecture

**Pattern:** Monolithic MVC Hybrid with Service Layer

```
Frontend (Next.js :3000)
    |
    | Axios HTTP + JWT
    v
Backend (Flask :5001)
    |
    +-- Routes (6 Blueprints)
    +-- Services (business logic)
    +-- Models (ML/AI models)
    +-- Supabase Client (auth + DB)
    |
    v
Supabase (PostgreSQL + Auth + RLS)
```

**Route Blueprints:** auth, conversion, animation, voice, script, admin

---

## 3. Authentication System

| Aspect | Details |
|--------|---------|
| **Provider** | Supabase Auth |
| **Token Type** | JWT (access + refresh) |
| **Storage** | localStorage (`auth-storage` key via Zustand persist) |
| **Roles** | `creator` (default), `admin` |
| **Route Protection** | Component-level useEffect checks (no middleware.ts) |
| **Password Rules** | 8+ chars, uppercase, lowercase, number, special char |

### Auth Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Email/password login |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/send-otp` | Send verification OTP |
| POST | `/api/auth/verify-otp` | Verify OTP |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh JWT |
| POST | `/api/auth/forgot-password` | Request reset email |
| POST | `/api/auth/reset-password` | Reset with token |

---

## 4. Core User Workflows

### Workflow 1: Registration
`Signup form -> Send OTP -> Verify OTP -> Create profile -> Redirect to /creator`

### Workflow 2: Login
`Email + Password -> Supabase Auth -> JWT issued -> Role-based redirect (/admin or /creator)`

### Workflow 3: 2D to 3D Conversion
`Upload image -> Select format (OBJ/GLB/GLTF) + quality -> MiDaS depth estimation -> Mesh generation -> 3D viewer + download`

### Workflow 4: Text to Animation (Full Pipeline)
`Text prompt -> Ollama scene parse -> Wan2.1 T2V clips -> Kokoro TTS voice -> FFmpeg stitch -> MP4 download`

### Workflow 5: Admin Management
`View stats -> Manage users (CRUD) -> View analytics (growth, conversions) -> Activity feed`

---

## 5. API Endpoints (Full)

### Conversion Routes (`/api/convert`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/2d-to-3d` | Yes | Upload image, convert to 3D |
| GET | `/download/{job_id}` | No | Download 3D model |
| GET | `/history` | Yes | User's conversion history |
| GET | `/history/{id}` | Yes | Specific conversion details |
| DELETE | `/history/{id}` | Yes | Delete a conversion |
| GET | `/stats` | Yes | User's conversion stats |
| GET | `/status/{job_id}` | No | Job status |
| GET | `/supported-formats` | No | List formats |

### Animation Routes (`/api/animation`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/generate` | No | Full animation pipeline |
| POST | `/image-animate` | No | Animate image with voice |
| POST | `/text-to-video` | No | Single T2V clip |
| GET | `/check` | No | Check model availability |
| POST | `/unload` | No | Unload GPU models |

### Voice Routes (`/api/voice`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/generate` | No | Generate TTS audio |
| GET | `/presets` | No | List voice presets |

### Script Routes (`/api/script`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/analyze` | No | Parse scene description |
| GET | `/check` | No | Check Ollama availability |

### Admin Routes (`/api/admin`) - Admin only
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/stats` | Admin | System statistics |
| GET | `/users` | Admin | All users (paginated) |
| PUT | `/users/{id}` | Admin | Update user |
| DELETE | `/users/{id}` | Admin | Delete user |
| GET | `/analytics/user-growth` | Admin | Growth data |
| GET | `/analytics/conversions` | Admin | Conversion data |
| GET | `/activities` | Admin | Recent activities |

---

## 6. Database Schema

### Users Table
```
id (UUID PK), email (UNIQUE), name, role ('creator'|'admin'),
is_active (BOOLEAN), created_at, updated_at, last_login
```

### Conversions Table
```
id (UUID PK), user_id (FK->users CASCADE), file_name, original_image_url,
model_url, thumbnail_url, output_format ('obj'|'glb'|'gltf'),
quality ('low'|'medium'|'high'), status, file_size, settings (JSONB),
created_at, updated_at
```

### Projects Table (future use)
```
id (UUID PK), user_id (FK->users CASCADE), name, description,
status ('draft'), settings (JSONB), created_at, updated_at
```

**RLS Policies:** Users CRUD own data only. Admins CRUD all data.

---

## 7. Frontend Pages

### Public
| Path | Description |
|------|-------------|
| `/` | Landing page (Hero, Features, HowItWorks, CTA) |
| `/features` | Feature showcase |
| `/how-it-works` | Tutorial + FAQ |

### Auth (public)
| Path | Description |
|------|-------------|
| `/login` | Email/password login form |
| `/signup` | Multi-step: form -> OTP -> success |
| `/forgot-password` | Request reset email |
| `/reset-password` | Reset with token |

### Creator Dashboard (auth required, role: creator)
| Path | Description |
|------|-------------|
| `/creator` | Dashboard home with stats |
| `/creator/2d-to-3d` | Image upload + 3D conversion |
| `/creator/assets` | Asset library (grid/list view) |
| `/creator/animate` | Text-to-animation pipeline |

### Admin Dashboard (auth required, role: admin)
| Path | Description |
|------|-------------|
| `/admin` | Stats, user management, analytics |

---

## 8. Existing Tests

| File | Framework | Coverage |
|------|-----------|----------|
| `backend/tests/test_api.py` | pytest | Health, auth, conversion, animation, voice endpoints |
| `backend/tests/test_conversion.py` | pytest | DepthEstimator, MeshGenerator, full pipeline |
| `test_selenium.py` | pytest + selenium | Login form (7 tests), Signup flow (6 tests) |

### Gaps Identified
- No frontend unit tests (React components untested)
- No integration tests for full workflows
- No API contract/schema tests
- No performance/load tests
- Animation & voice endpoints have no auth (potential security gap)
- Admin endpoints not tested via Selenium

---

## 9. Risk Areas

| Area | Risk Level | Description |
|------|-----------|-------------|
| Animation endpoints no auth | High | `/api/animation/*` and `/api/voice/*` have no auth checks |
| No Next.js middleware | Medium | Route protection is component-level only (bypassable) |
| localStorage tokens | Medium | JWT in localStorage is XSS-vulnerable |
| No rate limiting | Medium | API endpoints can be abused |
| No input sanitization on prompts | Medium | Text prompts sent directly to LLM |
| No file type validation (deep) | Low | Only extension check, no magic byte validation |

---

## 10. Recommendations

1. **Add auth to animation/voice/script endpoints** - Currently anyone can generate videos
2. **Add Next.js middleware** for centralized route protection
3. **Add API rate limiting** (Flask-Limiter)
4. **Add frontend unit tests** with Jest/Vitest
5. **Add E2E tests** for 2D-to-3D and animation workflows
6. **Add input sanitization** for LLM prompts
7. **Move tokens to httpOnly cookies** instead of localStorage

# MESH Changelog

All notable changes to this project are documented in this file.

---

## File Location Reference

This section helps you know where to make changes for specific features.

### Frontend Files

| Feature | File Path | Description |
|---------|-----------|-------------|
| Landing Page | `frontend/app/page.tsx` | Home page |
| Login Page | `frontend/app/(auth)/login/page.tsx` | User login |
| Signup Page | `frontend/app/(auth)/signup/page.tsx` | User registration |
| Forgot Password | `frontend/app/(auth)/forgot-password/page.tsx` | Password reset |
| Admin Dashboard | `frontend/app/(dashboard)/admin/page.tsx` | Admin panel |
| Creator Dashboard | `frontend/app/(dashboard)/creator/page.tsx` | Creator home |
| 2D to 3D Page | `frontend/app/(dashboard)/creator/2d-to-3d/page.tsx` | Conversion tool |
| Assets Page | `frontend/app/(dashboard)/creator/assets/page.tsx` | Model gallery |
| Creator Layout | `frontend/app/(dashboard)/creator/layout.tsx` | Sidebar navigation |
| Navbar | `frontend/components/shared/Navbar.tsx` | Top navigation |
| Footer | `frontend/components/shared/Footer.tsx` | Page footer |
| Model Viewer | `frontend/components/creator/ModelViewer.tsx` | 3D viewer (Three.js) |
| Image Uploader | `frontend/components/creator/ImageUploader.tsx` | File upload |
| Conversion Settings | `frontend/components/creator/ConversionSettings.tsx` | Quality/format options |
| Conversion History | `frontend/components/creator/ConversionHistory.tsx` | History list |
| Auth Store | `frontend/store/authStore.ts` | Zustand auth state |
| API Client | `frontend/lib/api.ts` | Axios configuration |
| Global Styles | `frontend/app/globals.css` | CSS variables |
| Tailwind Config | `frontend/tailwind.config.ts` | Tailwind settings |
| Next Config | `frontend/next.config.mjs` | Next.js settings |

### Backend Files

| Feature | File Path | Description |
|---------|-----------|-------------|
| Main Entry | `backend/app.py` | Flask app factory |
| Configuration | `backend/config.py` | Environment configs |
| Auth Routes | `backend/api/auth_routes.py` | Authentication endpoints |
| Conversion Routes | `backend/api/conversion_routes.py` | 2D to 3D endpoints |
| Admin Routes | `backend/api/admin_routes.py` | Admin endpoints |
| Script Routes | `backend/api/script_routes.py` | Script generation (stub) |
| Voice Routes | `backend/api/voice_routes.py` | Voice generation (stub) |
| Animation Routes | `backend/api/animation_routes.py` | Animation (stub) |
| Depth Estimator | `backend/models/two_d_to_three_d/depth_estimator.py` | MiDaS model |
| Mesh Generator | `backend/models/two_d_to_three_d/mesh_generator.py` | 3D mesh creation |
| Converter | `backend/models/two_d_to_three_d/converter.py` | Main pipeline |
| TripoSR | `backend/models/two_d_to_three_d/triposr_converter.py` | TripoSR (not working) |
| Conversion Service | `backend/services/conversion_service.py` | Conversion logic |
| DB Service | `backend/services/conversion_db_service.py` | Database operations |
| Admin Stats | `backend/services/admin_stats_service.py` | Admin analytics |
| Supabase Config | `backend/supabase_client/supabase_config.py` | Supabase client |
| Database Schema | `backend/database/schema.sql` | SQL schema |
| Requirements | `backend/requirements.txt` | Python dependencies |

### Configuration Files

| File | Purpose |
|------|---------|
| `backend/.env` | Backend environment variables |
| `frontend/.env.local` | Frontend environment variables |
| `backend/.env.example` | Backend env template |

---

## Change History

### [2025-12-05] - User Data Isolation & Admin CRUD

**Security Fixes**
- Fixed critical user data isolation issue - users now only see their own conversions
- Added JWT authentication to conversion endpoints
- Extract real user ID from auth tokens instead of hardcoded ID
- Added Authorization header to XMLHttpRequest uploads

**Admin Dashboard**
- Implemented full CRUD functionality for user management
- Added working Add/Edit/Delete user dialogs
- Wired up toggle status functionality
- Connected to backend admin API endpoints

**Database**
- Admin dashboard now shows real data from Supabase
- User list includes actual project counts
- System stats reflect real database values
- Analytics show real growth and activity data

**Files Modified**
- `backend/api/conversion_routes.py` - Auth checks
- `backend/api/admin_routes.py` - Admin endpoints
- `backend/services/admin_stats_service.py` - Real stats
- `frontend/app/(dashboard)/creator/2d-to-3d/page.tsx` - Auth header
- `frontend/app/(dashboard)/admin/page.tsx` - CRUD dialogs
- `frontend/components/creator/ConversionHistory.tsx` - Image error handling
- `frontend/next.config.mjs` - Remote image patterns

---

### [2025-12-04] - 3D Model Preview Fix

**Fixes**
- Fixed 3D model preview not showing (removed Environment HDR component)
- Fixed eye/delete buttons invisible in history (dark theme colors)

**Files Modified**
- `frontend/components/creator/ModelViewer.tsx` - Removed Environment
- `frontend/components/creator/ConversionHistory.tsx` - Dark theme

**Notes**
- Backend still using MiDaS fallback (TripoSR 'tsr' module not installed)

---

### [2025-12-04] - Database & Assets Page

**Features**
- Created Assets page for viewing all 3D models
- Database integration for conversion history
- History persists after page refresh
- Download and delete functionality

**Files Created**
- `frontend/app/(dashboard)/creator/assets/page.tsx`
- `backend/services/conversion_db_service.py`

**Files Modified**
- `frontend/app/(dashboard)/creator/layout.tsx` - Assets link
- `frontend/app/(dashboard)/creator/2d-to-3d/page.tsx` - DB integration

---

### [2025-12-03] - Dashboard Redesign

**UI Changes**
- Unified color scheme to blue-purple gradient
- Changed all icons to text-blue-600
- Updated cards to rounded-2xl with shadow-sm
- Added consistent hover lift effects
- Changed backgrounds to subtle gradient

**Files Modified**
- `frontend/app/(dashboard)/admin/page.tsx`
- `frontend/app/(dashboard)/creator/page.tsx`
- `frontend/app/(dashboard)/creator/2d-to-3d/page.tsx`

---

### [2025-11-21] - Initial Implementation

**Features**
- Landing page with Hero, Features, How It Works, CTA
- Authentication pages (Login, Signup)
- Admin dashboard with user management
- Creator dashboard with stats
- 2D to 3D conversion with MiDaS
- React Three Fiber 3D viewer
- Zustand auth state management
- Axios API client with interceptors

**Tech Stack Setup**
- Next.js 14 with App Router
- Flask 3.0 backend
- Supabase integration
- Tailwind CSS + shadcn/ui

---

## How to Add a Changelog Entry

When making changes, add a new section at the top following this format:

```markdown
### [YYYY-MM-DD] - Brief Title

**Category** (Features/Fixes/Security/UI/Refactor)
- Description of change

**Files Modified**
- `path/to/file.tsx` - What changed

**Notes** (optional)
- Any important notes
```

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.3.0 | 2025-12-05 | User isolation, Admin CRUD |
| 0.2.0 | 2025-12-04 | Assets page, DB integration |
| 0.1.0 | 2025-11-21 | Initial implementation |

---

*Keep this file updated with every significant change to help future development.*

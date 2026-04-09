# MESH - AI-Powered Animation Platform

## Project Summary

MESH is a Final Year Project (FYP) that provides AI-powered 2D-to-3D conversion, text-to-video animation, and text-to-speech generation. Built with Next.js 14 (frontend) and Flask 3.0 (backend), using Supabase for auth and database. Runs fully locally on Mac M4 Pro (24GB RAM) with no paid APIs.

**Key Features:**
- 2D image to 3D model conversion (MiDaS + Open3D)
- Text-to-video generation (Wan2.1-T2V-1.3B)
- Text-to-speech (Kokoro-82M, 23 voice presets)
- Scene parsing (Ollama + llama3.1:8b)
- Multi-clip video pipeline with FFmpeg stitching
- Admin dashboard with user management and analytics
- Role-based access control (creator / admin)

## Tech Stack

- **Frontend:** Next.js 14 (TypeScript), Tailwind CSS, shadcn/ui, Zustand, React Three Fiber
- **Backend:** Flask 3.0 (Python 3.12), Diffusers, PyTorch, Kokoro, Ollama
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **Testing:** pytest, Selenium WebDriver, chromedriver-autoinstaller

## Running the Project

```bash
# Backend
cd backend && source ../venv/bin/activate
PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0 PYTORCH_ENABLE_MPS_FALLBACK=1 PORT=5001 python3 app.py

# Frontend
cd frontend && npm run dev

# Tests
python -m pytest test_selenium.py -v
python -m pytest backend/tests/ -v
```

## API Endpoints

| Prefix | Blueprint | Auth Required |
|--------|-----------|---------------|
| `/api/auth` | auth_routes | No (public) |
| `/api/convert` | conversion_routes | Yes (most) |
| `/api/animation` | animation_routes | No |
| `/api/voice` | voice_routes | No |
| `/api/script` | script_routes | No |
| `/api/admin` | admin_routes | Yes (admin only) |

## Key Files

| File | Purpose |
|------|---------|
| `backend/app.py` | Flask app factory |
| `backend/api/*.py` | Route blueprints |
| `backend/services/*.py` | Business logic layer |
| `backend/models/video_generator/wan_video.py` | Wan2.1 T2V pipeline |
| `backend/services/voice_generation_service.py` | Kokoro TTS |
| `backend/services/animation_pipeline_service.py` | Full animation pipeline |
| `backend/supabase_client/supabase_config.py` | DB client |
| `frontend/app/(auth)/*.tsx` | Login/signup pages |
| `frontend/app/(dashboard)/**/*.tsx` | Dashboard pages |
| `frontend/store/authStore.ts` | Zustand auth state |
| `frontend/lib/api.ts` | Axios API client |

---

# QA Testing Agent

## Test Stack

| Tool | Purpose |
|------|---------|
| pytest | Backend unit + integration tests |
| Selenium + ChromeDriver | Browser-based E2E tests |
| chromedriver-autoinstaller | Auto-matching ChromeDriver |

## Slash Commands

| Command | Purpose |
|---------|---------|
| `/test-bug XXX` | Test if a specific bug is fixed |
| `/test-all` | Test all known bugs |
| `/add-bug` | Report and catalog a new bug |
| `/test-feature` | Write and run tests for a feature |
| `/audit` | Full security and code quality audit |
| `/test-pr` | Test changes in a PR or commit |
| `/coverage` | Analyze test coverage gaps |

## Known Bugs

### BUG-001: Hardcoded Secrets in .env (CRITICAL)
- **Type:** Security | **Severity:** Critical
- **File:** `backend/.env`
- **Issue:** Supabase keys committed to repo. Service role key bypasses all RLS.
- **Fix:** Add to .gitignore, rotate keys.

### BUG-002: Animation/Voice/Script Endpoints No Auth (CRITICAL)
- **Type:** Auth | **Severity:** Critical
- **Files:** `backend/api/animation_routes.py`, `voice_routes.py`, `script_routes.py`
- **Issue:** Zero authentication on GPU-consuming endpoints.

### BUG-003: Creator Layout No Auth Guard (CRITICAL)
- **Type:** Auth | **Severity:** Critical
- **File:** `frontend/app/(dashboard)/creator/layout.tsx`
- **Issue:** Unauthenticated users see broken dashboard UI.

### BUG-004: Animation Pipeline No Error Handling (CRITICAL)
- **Type:** Logic | **Severity:** Critical
- **File:** `backend/services/animation_pipeline_service.py`
- **Issue:** Ollama down / GPU OOM / FFmpeg fail = server crash 500.

### BUG-005: Download Endpoint No Ownership Check (HIGH)
- **Type:** Auth | **Severity:** High
- **File:** `backend/api/conversion_routes.py:192`
- **Issue:** Any user can download any other user's 3D models.

### BUG-006: Hardcoded localhost URLs in Frontend (HIGH)
- **Type:** API | **Severity:** High
- **Files:** `login/page.tsx`, `signup/page.tsx`, `2d-to-3d/page.tsx`, `assets/page.tsx`
- **Issue:** Raw fetch() with hardcoded `http://localhost:5001`.

### BUG-007: Auth Pages Bypass API Module (HIGH)
- **Type:** API | **Severity:** High
- **Files:** `login/page.tsx`, `signup/page.tsx`
- **Issue:** Use fetch() instead of authAPI, missing interceptors.

### BUG-008: FFmpeg Output Not Validated (HIGH)
- **Type:** Logic | **Severity:** High
- **File:** `backend/services/animation_pipeline_service.py:345`
- **Issue:** No check if output file exists/non-empty after FFmpeg.

### BUG-009: Unsafe Data Destructuring (MEDIUM)
- **Type:** UI | **Severity:** Medium
- **Files:** Multiple frontend pages
- **Issue:** `result.data.data` without null checks = blank screen crash.

### BUG-010: No Error States on Dashboard Pages (MEDIUM)
- **Type:** UI | **Severity:** Medium
- **Issue:** API failures show empty state, not error message.

### BUG-011: Admin Page Flash Before Redirect (MEDIUM)
- **Type:** UI | **Severity:** Medium
- **File:** `frontend/app/(dashboard)/admin/page.tsx`

### BUG-012: 401 Causes Hard Page Reload (MEDIUM)
- **Type:** UI | **Severity:** Medium
- **File:** `frontend/lib/api.ts:32`

## Testing Log

| Date | Action | Result | Notes |
|------|--------|--------|-------|
| 2026-03-29 | QA Agent setup | Complete | QA_REPORT.md created, 7 slash commands, CLAUDE.md initialized |
| 2026-03-29 | Full code audit | 12 bugs found | 4 Critical, 4 High, 4 Medium — see QA_AUDIT.md |
| 2026-03-08 | Selenium tests (login + signup) | 13/13 PASSED | test_selenium.py covers login (7) and signup (6) flows |
| 2026-03-08 | Backend E2E test | 5/5 PASSED | health, animation check, voice presets, Kokoro TTS, script parser |

---

## Testing Standards

### General Rules
- Every test must be independent - no test should depend on another test's output
- Tests should clean up after themselves (reset data, logout sessions)
- Use descriptive test names: "should reject login when role mismatches credentials" not "test1"
- Always test both the happy path AND failure cases
- Never hardcode environment-specific values - use env variables or config

### Bug Test Pattern
For every bug test, follow this structure:
1. SETUP - Create the preconditions
2. ACTION - Perform the steps that trigger the bug
3. ASSERT - Verify expected behavior
4. CLEANUP - Reset any changed state

### Severity Levels
- **Critical**: App crashes, data loss, security breach, auth bypass
- **High**: Core feature broken, data showing incorrectly, workflow blocked
- **Medium**: UI issues, minor logic errors, non-blocking problems
- **Low**: Cosmetic issues, typos, minor UX improvements

### What to Test on Every Feature
1. Does it work correctly with valid input? (Happy path)
2. Does it fail gracefully with invalid input? (Validation)
3. Does it respect permissions? (Auth/roles)
4. Does it handle edge cases? (Empty, null, very large, special characters)
5. Does it update related data correctly? (Side effects)
6. Does it work across different user roles? (Permission matrix)

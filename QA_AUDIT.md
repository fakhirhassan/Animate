# QA Audit Report - MESH

**Date:** March 29, 2026
**Scope:** Full codebase audit for FYP demo readiness

---

## Critical - Fix Before Demo

### BUG-001: Hardcoded Secrets in .env (Committed to Git)
- **File:** `backend/.env` lines 29-32
- **Issue:** Real Supabase URL, anon key, and SERVICE_ROLE_KEY are committed to the repo. The service role key bypasses all RLS policies — anyone with repo access has full database control.
- **Fix:** Add `backend/.env` to `.gitignore`, rotate keys in Supabase dashboard after demo.

### BUG-002: Animation/Voice/Script Endpoints Have No Auth
- **Files:** `backend/api/animation_routes.py`, `backend/api/voice_routes.py`, `backend/api/script_routes.py`
- **Issue:** All endpoints (`/api/animation/generate`, `/api/voice/generate`, `/api/script/analyze`) have zero authentication. Anyone can call them and consume GPU resources.
- **Demo Risk:** Examiner could call these directly and ask "why is there no auth?"
- **Fix:** Add `get_user_id_from_request()` check or at minimum a simple token check.

### BUG-003: Creator Layout Has No Auth Guard
- **File:** `frontend/app/(dashboard)/creator/layout.tsx`
- **Issue:** Unlike the admin page which checks auth in useEffect and redirects, the creator layout renders for unauthenticated users. They see the sidebar with "U" avatar and get 401 errors on every API call.
- **Demo Risk:** Type `/creator` in browser without logging in — broken UI.
- **Fix:** Add useEffect auth check like admin page has.

### BUG-004: Animation Pipeline Crashes Without Error Recovery
- **File:** `backend/services/animation_pipeline_service.py` lines 62-100
- **Issue:** If Ollama isn't running, video generation fails, or FFmpeg errors — no try-catch. Server returns 500 with stack trace.
- **Demo Risk:** Most likely crash point during live demo. GPU OOM, Ollama not started, model not loaded.
- **Fix:** Wrap each pipeline step in try-catch, return user-friendly error messages.

---

## High - Fix Soon

### BUG-005: Download Endpoint Has No Auth/Ownership Check
- **File:** `backend/api/conversion_routes.py` lines 192-262
- **Issue:** `/api/convert/download/<job_id>` serves files to anyone. No check that the requesting user owns the conversion.
- **Fix:** Add auth check + verify job_id belongs to authenticated user.

### BUG-006: Hardcoded `localhost:5001` URLs in Frontend Pages
- **Files:** `frontend/app/(auth)/login/page.tsx:47`, `signup/page.tsx:95,204`, `creator/2d-to-3d/page.tsx:163`, `creator/assets/page.tsx:91,244,324,410`
- **Issue:** These pages use raw `fetch("http://localhost:5001/...")` instead of the API module. If backend URL changes, everything breaks.
- **Fix:** Use `authAPI`/`conversionAPI` from `lib/api.ts`, or use `process.env.NEXT_PUBLIC_API_URL`.

### BUG-007: Login/Signup Use fetch() Instead of API Module
- **Files:** `frontend/app/(auth)/login/page.tsx:47`, `signup/page.tsx:95,204`
- **Issue:** Auth pages bypass the Axios interceptors (no automatic 401 handling, no consistent error formatting). Error responses may not be parsed correctly.
- **Fix:** Use `authAPI.login()` and `authAPI.signup()` from `lib/api.ts`.

### BUG-008: FFmpeg Output Not Validated
- **File:** `backend/services/animation_pipeline_service.py` lines 345-443
- **Issue:** After FFmpeg runs, code doesn't verify output file exists and is non-zero bytes. FFmpeg can exit 0 but produce empty files.
- **Fix:** Add `os.path.exists(output_path) and os.path.getsize(output_path) > 0` check.

---

## Medium - Nice to Fix

### BUG-009: Unsafe Data Destructuring Without Null Checks
- **Files:** `frontend/app/(auth)/login/page.tsx:67`, `creator/page.tsx:76`, `creator/2d-to-3d/page.tsx:72`, `admin/page.tsx:125`
- **Issue:** Code accesses `result.data.data` without checking intermediate values. If backend returns unexpected structure, page crashes with blank screen.
- **Fix:** Add optional chaining: `result?.data?.data` or validate response shape.

### BUG-010: No Error States on Dashboard Pages
- **Files:** `frontend/app/(dashboard)/creator/page.tsx`, `creator/assets/page.tsx`, `creator/2d-to-3d/page.tsx`
- **Issue:** When API calls fail, error is logged to console but page shows empty/zero state with no error message to user.
- **Fix:** Add `error` state and show "Failed to load" message.

### BUG-011: Admin Page Flash Before Auth Redirect
- **File:** `frontend/app/(dashboard)/admin/page.tsx` lines 92-109
- **Issue:** Auth check runs in useEffect (client-side). A non-admin user briefly sees the admin page skeleton before being redirected.
- **Fix:** Show loading spinner until auth check completes.

### BUG-012: 401 Response Causes Hard Page Reload
- **File:** `frontend/lib/api.ts` lines 32-35
- **Issue:** API interceptor does `window.location.href = '/login'` on 401 — full reload loses all state. User gets no error message explaining what happened.
- **Fix:** Use `router.push('/login')` and show toast notification.

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 4 | Must fix before demo |
| High | 4 | Should fix before demo |
| Medium | 4 | Nice to have |
| **Total** | **12** | |

### Top 3 Priorities for FYP Demo
1. **BUG-004** — Add error handling to animation pipeline (this WILL crash during demo)
2. **BUG-003** — Add auth guard to creator layout (examiner will try this)
3. **BUG-002** — Add auth to animation endpoints (examiner will ask about this)

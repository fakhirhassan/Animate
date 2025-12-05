# Quick Start Guide - Database & Assets Setup

## ✅ Good News!

Your database is **already configured** and the required tables exist:
- ✅ **users** table exists
- ✅ **conversions** table exists
- ✅ Supabase connection working

The system is ready to save and load 3D models!

## Why Models Might Not Be Showing

There are a few possible reasons:

### 1. **Backend Not Running on Correct Port**
The frontend expects backend on port **5001**, not 5000.

**Fix**: Make sure backend is running with:
```bash
cd backend
PORT=5001 python3 app.py
```

### 2. **Frontend Not Loading from Database**
The code to load from database is already implemented, but you need to test it.

### 3. **No Conversions in Database Yet**
If you haven't created any conversions since the database was set up, it will be empty.

## Step-by-Step Setup & Testing

### Step 1: Stop All Running Processes

First, let's clean up any running servers:

```bash
# Kill any processes on port 5001
lsof -ti:5001 | xargs kill -9

# Kill any processes on port 3000
lsof -ti:3000 | xargs kill -9
```

### Step 2: Start Backend on Port 5001

```bash
cd /Users/fakhirhassan/Desktop/Mesh/backend
PORT=5001 python3 app.py
```

Expected output:
```
✅ Successfully connected to Supabase!
 * Running on http://0.0.0.0:5001
```

### Step 3: Start Frontend

In a NEW terminal:

```bash
cd /Users/fakhirhassan/Desktop/Mesh/frontend
npm run dev
```

Expected output:
```
✓ Ready on http://localhost:3000
```

### Step 4: Test the System

1. Open browser: http://localhost:3000
2. Login or signup (any credentials for now - using test-user-id)
3. Go to **2D to 3D** page
4. Upload an image and click "Convert to 3D"
5. Wait for conversion to complete
6. Check if it appears in the history section below
7. Go to **Assets** page in the sidebar
8. You should see your converted model there!

### Step 5: Verify Database

Check if the conversion was saved to database:

```bash
cd backend
python3 setup_database.py
```

This will show:
- Number of users in database
- Number of conversions in database
- Recent conversions

## How to Check What's Wrong

If models still don't show up in Assets page:

### Check 1: Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any errors in red
4. Take a screenshot and share if needed

### Check 2: Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Upload and convert an image
4. Look for these requests:
   - `POST /api/convert/2d-to-3d` - Should return status 200
   - `GET /api/convert/history` - Should return your conversions

5. Click on each request and check:
   - **Status**: Should be 200
   - **Response**: Should have data

### Check 3: Backend Logs

Look at your terminal where backend is running. You should see:

```
INFO:werkzeug:POST /api/convert/2d-to-3d - 200
INFO:root:File uploaded successfully: uploads/input/xxx.png
INFO:root:Conversion saved to database: job-id-xxx
```

If you see errors, copy them and we can debug.

### Check 4: Database Directly

Go to Supabase and check if data exists:

1. Go to: https://supabase.com/dashboard/project/efxfsinczqravpeyutmp/editor
2. Click "Table Editor" in left sidebar
3. Select "conversions" table
4. You should see rows with your converted models

## Common Issues & Solutions

### Issue 1: "Network Error" or "Failed to fetch"

**Cause**: Backend not running or running on wrong port

**Solution**:
```bash
# Make sure backend is on port 5001
cd backend
PORT=5001 python3 app.py
```

### Issue 2: Assets page shows "No assets found"

**Cause**: Either no conversions in database OR frontend not loading correctly

**Solution**:
1. Check browser console for errors
2. Check Network tab for API call to `/api/convert/history`
3. Run `python3 setup_database.py` to see if conversions exist

### Issue 3: Conversion succeeds but doesn't save to database

**Cause**: Database connection issue or error in save logic

**Solution**:
1. Check backend logs for "Conversion saved to database"
2. If you see errors, check Supabase credentials in `.env`
3. Run `python3 setup_database.py` to test connection

### Issue 4: "Unauthorized" or 401 errors

**Cause**: Auth middleware blocking requests

**Current Status**: The app uses `test-user-id` placeholder for now

**Solution**: This should not block you. If you see 401 errors, check:
1. Frontend is sending requests to correct URL
2. Backend CORS is allowing requests from localhost:3000

## Files Created for You

1. **`database_schema.sql`** - Complete database schema with all tables and policies
2. **`setup_database.py`** - Script to test database connection and verify tables
3. **`DATABASE_SETUP_GUIDE.md`** - Detailed database documentation
4. **`QUICK_START_GUIDE.md`** (this file) - Quick troubleshooting guide

## Code Changes Made

### Frontend Changes:

1. **`app/(dashboard)/creator/2d-to-3d/page.tsx`**
   - Added `useEffect` to load history from database on mount
   - Updated conversion success to reload from database
   - Fixed download to use `?download=true` parameter
   - Fixed delete to call API

2. **`app/(dashboard)/creator/assets/page.tsx`** (NEW)
   - Complete Assets page with grid/list views
   - Search and filter functionality
   - 3D model viewer
   - Load all models from database

3. **`app/(dashboard)/creator/layout.tsx`**
   - Added "Assets" link to sidebar navigation

### Backend Changes:

Already implemented (from previous work):
- `services/conversion_db_service.py` - Database service
- `api/conversion_routes.py` - Save conversions to DB
- `services/admin_stats_service.py` - Admin statistics

## Testing Checklist

- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000
- [ ] Can upload image on 2D to 3D page
- [ ] Conversion completes successfully
- [ ] Model appears in history section
- [ ] Model appears in Assets page
- [ ] Can download model (click download button)
- [ ] Can delete model from Assets page
- [ ] Run `python3 setup_database.py` shows conversions

## Next Steps

Once everything is working:

1. Test creating multiple conversions
2. Verify they all appear in Assets page
3. Test search and filter on Assets page
4. Test different output formats (OBJ, GLB, GLTF)
5. Check admin dashboard for statistics

## Need More Help?

If you're still stuck, please provide:

1. **Backend logs** - Copy the terminal output where backend is running
2. **Frontend console** - Screenshot of browser console errors
3. **Network tab** - Screenshot of failed requests
4. **Database check** - Output of `python3 setup_database.py`

This will help diagnose the exact issue!

# Database Setup Guide for AniMate

## Current Status

✅ **Good News**: Your database is mostly set up!
- ✅ Users table exists
- ✅ Conversions table exists
- ⚠️ Projects table missing (optional - not needed yet)

## Quick Setup Steps

### Step 1: Verify Your Supabase Configuration

Your Supabase credentials are already in `backend/.env`:
- **SUPABASE_URL**: https://efxfsinczqravpeyutmp.supabase.co
- **SUPABASE_KEY**: (configured)

### Step 2: Create the Projects Table (Optional)

If you want to use the Projects feature later, run this SQL in your Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/efxfsinczqravpeyutmp/sql/new
2. Copy and paste the SQL from `backend/database_schema.sql`
3. Click "Run"

### Step 3: Test the Connection

Run the database setup script:

```bash
cd backend
python3 setup_database.py
```

## Understanding Your Database Tables

### 1. `users` Table
Stores user accounts and authentication information.

**Columns**:
- `id` (UUID) - Primary key
- `email` - User's email (unique)
- `name` - User's display name
- `password_hash` - Hashed password
- `role` - User role (admin/creator)
- `is_active` - Account status
- `created_at`, `updated_at`, `last_login` - Timestamps

### 2. `conversions` Table
Stores 2D to 3D conversion records.

**Columns**:
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users table
- `file_name` - Original image filename
- `original_image_url` - Path to uploaded image
- `model_url` - Path to generated 3D model
- `thumbnail_url` - Path to thumbnail
- `output_format` - Model format (obj, glb, gltf)
- `quality` - Conversion quality (low, medium, high)
- `status` - Conversion status (completed, failed, processing)
- `file_size` - Size of the generated model
- `settings` - Additional metadata (JSONB)
- `created_at`, `updated_at` - Timestamps

### 3. `projects` Table (Optional)
For future project management features.

## How the System Works

### When a user converts an image:

1. **Upload** → Image is saved to `backend/uploads/input/`
2. **Conversion** → TripoSR generates 3D model
3. **Save Model** → Model saved to `backend/uploads/output/`
4. **Database** → Conversion record is saved to `conversions` table with:
   - User ID (who created it)
   - File paths
   - Metadata (format, quality, size, etc.)
5. **Frontend** → Loads conversions from database and displays in:
   - 2D to 3D page (recent history)
   - Assets page (all user's models)

## Common Issues and Solutions

### Issue 1: Models not saving to database

**Symptom**: Models generate but don't appear in Assets page

**Solution**:
1. Check if backend is running: `cd backend && PORT=5001 python3 app.py`
2. Check browser console for errors
3. Verify Supabase credentials in `.env`
4. Run `python3 setup_database.py` to test connection

### Issue 2: Assets page is empty

**Symptom**: Assets page shows no models even after conversion

**Solution**:
1. Check if conversions table has data:
   ```bash
   python3 setup_database.py
   ```
2. Open browser DevTools → Network tab
3. Try converting an image
4. Look for API call to `/api/convert/2d-to-3d`
5. Check response for errors

### Issue 3: Authentication errors

**Symptom**: "Unauthorized" or "401" errors

**Current Status**: The app uses a placeholder user ID (`test-user-id`) for now.

**Temporary Fix**: All conversions are saved under this test user ID until proper JWT authentication is implemented.

## Testing the Setup

### Test 1: Database Connection
```bash
cd backend
python3 setup_database.py
```

Expected output:
```
✅ Successfully connected to Supabase!
✅ Table 'users' exists
✅ Table 'conversions' exists
✅ Found X users in the database
✅ Found Y conversions in the database
```

### Test 2: Create a Conversion
1. Start backend: `cd backend && PORT=5001 python3 app.py`
2. Start frontend: `cd frontend && npm run dev`
3. Go to http://localhost:3000/creator/2d-to-3d
4. Upload an image and convert
5. Check if it appears in the history below
6. Go to http://localhost:3000/creator/assets
7. Check if it appears in the Assets page

### Test 3: Check Database Directly

Go to Supabase dashboard:
https://supabase.com/dashboard/project/efxfsinczqravpeyutmp/editor

1. Click "Table Editor"
2. Select "conversions" table
3. You should see your converted models listed

## API Endpoints

### Conversion Endpoints
- `POST /api/convert/2d-to-3d` - Upload and convert image
- `GET /api/convert/history` - Get user's conversion history
- `GET /api/convert/history/:id` - Get specific conversion
- `DELETE /api/convert/history/:id` - Delete a conversion
- `GET /api/convert/download/:jobId?download=true` - Download model
- `GET /api/convert/stats` - Get user's conversion statistics

### Admin Endpoints
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/analytics/user-growth` - User growth data
- `GET /api/admin/analytics/conversions` - Conversion activity

## Environment Variables

### Backend (.env)
```env
# Supabase
SUPABASE_URL=https://efxfsinczqravpeyutmp.supabase.co
SUPABASE_KEY=your-anon-key-here

# Server
PORT=5001
FLASK_ENV=development
FLASK_DEBUG=True

# Upload
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=104857600
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

## Next Steps

1. ✅ Database is configured
2. ✅ Tables exist (users, conversions)
3. ✅ Code is ready to save conversions
4. 📝 Test the conversion flow
5. 📝 Verify Assets page loads data

## Need Help?

If you're still having issues:

1. Check backend logs for errors
2. Check browser console for errors
3. Run `python3 setup_database.py` to verify connection
4. Make sure both backend and frontend are running
5. Check that your Supabase project is active

## Important Notes

- The `test-user-id` is a temporary solution
- All users currently share the same user ID
- Proper JWT authentication will be implemented later
- Row Level Security (RLS) policies are defined but not enforced yet
- Make sure to keep your SUPABASE_KEY secret and never commit it to git

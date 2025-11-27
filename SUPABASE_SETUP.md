# Supabase Setup Guide for ANIAD

This guide will help you set up Supabase for your ANIAD project.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the details:
   - **Name**: ANIAD
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest to you
   - **Pricing Plan**: Free (sufficient for development)
5. Click "Create new project"
6. Wait 2-3 minutes for setup to complete

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** (gear icon) > **API**
2. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`

## Step 3: Configure Backend

1. Copy the `.env.example` file to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Open `backend/.env` and update:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   ```

3. Replace the values with your actual Supabase credentials

## Step 4: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New Query"
3. Open the file `backend/database/schema.sql`
4. Copy ALL the content
5. Paste it into the Supabase SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

This creates all the necessary tables:
- `users` - User profiles
- `conversions` - 2D to 3D conversions
- `scripts` - Animation scripts
- `animations` - Generated animations

## Step 5: Configure Authentication

### Enable Email Authentication:
1. Go to **Authentication** > **Providers**
2. Make sure **Email** is enabled
3. Configure email settings:
   - **Confirm email**: You can disable this for development (easier testing)
   - Or keep it enabled and configure email templates

### Disable Email Confirmation (for development):
1. Go to **Authentication** > **Settings**
2. Scroll to **Email Auth**
3. Toggle OFF "Confirm email"
4. Click Save

### Optional: Setup Email Templates
If you keep email confirmation enabled:
1. Go to **Authentication** > **Email Templates**
2. Customize the confirmation email template
3. Add your logo and branding

## Step 6: Create Admin User

### Method 1: Via Supabase Dashboard
1. Go to **Authentication** > **Users**
2. Click "Add user"
3. Fill in:
   - **Email**: admin@aniad.com
   - **Password**: Spring@0@0
   - **Auto Confirm User**: YES (check this)
4. Click "Create user"
5. Copy the user ID (UUID)

6. Go to **SQL Editor** and run:
   ```sql
   -- Insert admin profile (replace USER_ID with the actual UUID)
   INSERT INTO users (id, email, name, role)
   VALUES ('USER_ID', 'admin@aniad.com', 'Admin User', 'admin')
   ON CONFLICT (id) DO UPDATE SET role = 'admin';
   ```

### Method 2: Sign Up Through App
1. Start your frontend and backend servers
2. Go to the signup page
3. Sign up with admin@aniad.com
4. Then update the role in Supabase:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@aniad.com';
   ```

## Step 7: Test the Integration

1. **Restart your backend server**:
   ```bash
   cd backend
   PORT=5001 python3 app.py
   ```

2. **Test login endpoint**:
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@aniad.com","password":"Spring@0@0"}'
   ```

   You should get a response with user data and token.

3. **Test from frontend**:
   - Go to http://localhost:3000/login
   - Login with admin@aniad.com / Spring@0@0
   - Should redirect to admin dashboard

## Step 8: Enable Row Level Security (Optional but Recommended)

The schema already includes RLS policies. To verify:

1. Go to **Database** > **Tables**
2. Click on `users` table
3. Go to **RLS Policies** tab
4. You should see policies like "Users can view own profile"

## Troubleshooting

### Error: "Invalid login credentials"
- Check if user exists in Authentication > Users
- Verify email and password are correct
- Make sure "Auto Confirm User" was enabled when creating the user

### Error: "User profile not found"
- User exists in auth.users but not in public.users table
- Run the SQL query to insert the user profile

### Error: "Supabase credentials not found"
- Check that .env file exists in backend folder
- Verify SUPABASE_URL and SUPABASE_KEY are set correctly
- Restart the backend server after updating .env

### Error: "Table does not exist"
- Database schema wasn't run
- Go back to Step 4 and run the schema.sql

## Security Notes

1. **Never commit `.env` file** - It's already in .gitignore
2. **Use different credentials for production**
3. **Enable email confirmation in production**
4. **Regularly rotate your API keys**
5. **Monitor usage in Supabase dashboard**

## Next Steps

Once Supabase is set up:
- ✅ Users can sign up and login
- ✅ Admin dashboard works
- ✅ User data is stored securely
- ✅ JWT tokens for authentication
- ✅ Row-level security enabled

You can now:
- Add more users through the signup page
- Assign admin role to specific users via SQL
- Start using the 2D to 3D conversion features
- Track conversions in the database

## Frontend Integration Status

The frontend has been updated to work with the Supabase backend:
- ✅ Login page calls backend API at `/api/auth/login`
- ✅ Signup page calls backend API at `/api/auth/signup`
- ✅ Auth tokens (JWT) are stored in Zustand store
- ✅ API calls include Authorization header via axios interceptor
- ✅ Automatic redirect on 401 errors
- ✅ API base URL is configurable via environment variable

## Testing the Full Integration

After setting up Supabase credentials in Step 3:

1. **Create admin user in Supabase** (see Step 6)
2. **Start both servers**:
   ```bash
   # Terminal 1 - Backend
   cd backend
   PORT=5001 python3 app.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```
3. **Test login** at http://localhost:3000/login with admin@aniad.com / Spring@0@0
4. **Test signup** at http://localhost:3000/signup with a new email

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Python Client](https://github.com/supabase-community/supabase-py)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

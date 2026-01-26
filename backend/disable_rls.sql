-- Temporarily disable RLS on conversions table
-- This allows the anon key to insert/update/delete records
-- WARNING: This removes security policies - only use for development!

-- Disable RLS on conversions table
ALTER TABLE conversions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table (if needed)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- You can verify RLS is disabled by running:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

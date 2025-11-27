-- ANIAD Database Schema for Supabase
-- Run this in your Supabase SQL Editor after creating the project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'creator', -- 'creator' or 'admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Conversions table (for 2D to 3D conversions)
CREATE TABLE IF NOT EXISTS conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_image_url TEXT NOT NULL,
    model_url TEXT,
    thumbnail_url TEXT,
    output_format VARCHAR(10) NOT NULL, -- 'glb', 'obj', 'gltf', etc.
    quality VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    file_size VARCHAR(20),
    settings JSONB, -- Store depth_estimation, smoothness, detail_level
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scripts table (for animation scripts)
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'processed', 'rendering', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Animations table (generated animations)
CREATE TABLE IF NOT EXISTS animations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    script_id UUID REFERENCES scripts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    video_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds
    status VARCHAR(50) NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    settings JSONB, -- Store voice, music, emotion settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_conversions_user_id ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_animations_user_id ON animations(user_id);
CREATE INDEX IF NOT EXISTS idx_animations_script_id ON animations(script_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversions_updated_at BEFORE UPDATE ON conversions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_animations_updated_at BEFORE UPDATE ON animations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user (you can run this separately after Supabase Auth setup)
-- Note: This is for the users table, Supabase Auth will handle the actual authentication
INSERT INTO users (email, name, role)
VALUES ('admin@aniad.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE animations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id::text = auth.uid()::text
            AND role = 'admin'
        )
    );

-- Users can update their own data
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Users can view their own conversions
CREATE POLICY "Users can view own conversions"
    ON conversions FOR SELECT
    USING (auth.uid()::text = user_id::text);

-- Users can create conversions
CREATE POLICY "Users can create conversions"
    ON conversions FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own conversions
CREATE POLICY "Users can update own conversions"
    ON conversions FOR UPDATE
    USING (auth.uid()::text = user_id::text);

-- Users can delete their own conversions
CREATE POLICY "Users can delete own conversions"
    ON conversions FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Similar policies for scripts and animations
CREATE POLICY "Users can view own scripts"
    ON scripts FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create scripts"
    ON scripts FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own scripts"
    ON scripts FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own scripts"
    ON scripts FOR DELETE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own animations"
    ON animations FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create animations"
    ON animations FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own animations"
    ON animations FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own animations"
    ON animations FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Feedback & Ratings tables
-- Run this in your Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Per-generation rating (1-5 stars + optional comment).
-- conversion_id is nullable so the rating survives conversion deletion;
-- feature_type is denormalized on the row for the same reason.
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversion_id UUID REFERENCES conversions(id) ON DELETE SET NULL,
    feature_type VARCHAR(32) NOT NULL,  -- 't2v' | 't2i' | '2d-to-3d' | 'tts' | 'video-edit'
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- General or per-video feedback. status drives the admin triage queue.
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversion_id UUID REFERENCES conversions(id) ON DELETE SET NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'other',  -- 'bug' | 'suggestion' | 'praise' | 'other'
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new',  -- 'new' | 'read' | 'resolved'
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_conversion_id ON ratings(conversion_id);
CREATE INDEX IF NOT EXISTS idx_ratings_feature_type ON ratings(feature_type);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ratings"
    ON ratings FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create ratings"
    ON ratings FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own feedback"
    ON feedback FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create feedback"
    ON feedback FOR INSERT
    WITH CHECK (auth.uid()::text = user_id::text);

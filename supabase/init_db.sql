-- ============================================
-- Supabase SQL Init: app_feedback table
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the feedback table
CREATE TABLE IF NOT EXISTS app_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  message TEXT,
  user_contact TEXT
);

-- Enable Row Level Security
ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous and authenticated users to INSERT
-- (Public can submit feedback)
CREATE POLICY "Allow public insert" ON app_feedback
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Only service_role (admin) can SELECT
-- (Public cannot read other people's feedback)
CREATE POLICY "Admin read only" ON app_feedback
  FOR SELECT 
  TO service_role
  USING (true);

-- Optional: Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON app_feedback (created_at DESC);

-- Grant necessary permissions
GRANT INSERT ON app_feedback TO anon;
GRANT INSERT ON app_feedback TO authenticated;
GRANT ALL ON app_feedback TO service_role;

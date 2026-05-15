-- ============================================================
-- Nuron AI — Supabase Users Table
-- Run this SQL in your Supabase SQL Editor (supabase.com/dashboard)
-- This is the ONLY table you need for launch
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  puter_uuid TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_puter_uuid ON users(puter_uuid);

-- Allow the API to insert/update (using anon key)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the API (anon key)
CREATE POLICY "Allow insert from API"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow updates from the API (for upsert)
CREATE POLICY "Allow update from API"
  ON users FOR UPDATE
  USING (true);

-- Allow reads from the API (for user count)
CREATE POLICY "Allow read from API"
  ON users FOR SELECT
  USING (true);

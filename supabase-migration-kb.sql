-- =============================================
-- Nuron AI — Knowledge Base Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- Knowledge base articles (per-user, injected into AI context)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',  -- 'faq', 'policy', 'product_info', 'general'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_user ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(user_id, is_active);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on knowledge_base" ON knowledge_base;
CREATE POLICY "Allow all on knowledge_base" ON knowledge_base FOR ALL USING (true) WITH CHECK (true);

-- Add welcome_message column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS welcome_message TEXT;

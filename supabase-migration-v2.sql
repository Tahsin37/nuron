-- =============================================
-- Nuron AI — Supabase V2 Migration (Multi-Tenant)
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- User settings (per-user config, AI keys, business info)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  business_name TEXT,
  puter_api_token TEXT,
  groq_api_key TEXT,
  ai_personality TEXT DEFAULT 'friendly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bot connections (maps each user's Telegram/FB bot to their account)
CREATE TABLE IF NOT EXISTS bot_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'telegram',
  bot_id TEXT NOT NULL,
  bot_token TEXT,
  bot_name TEXT,
  webhook_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, bot_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_connections_user ON bot_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_connections_bot ON bot_connections(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_connections_platform_bot ON bot_connections(platform, bot_id);

-- RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bot_connections" ON bot_connections FOR ALL USING (true) WITH CHECK (true);

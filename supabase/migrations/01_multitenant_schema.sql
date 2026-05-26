-- =============================================
-- Nuron AI — Consolidated Multi-Tenant Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS + DROP POLICY)
-- =============================================

-- ═══ ENUM TYPES ═══
DO $$ BEGIN
  CREATE TYPE llm_provider_enum AS ENUM ('puter', 'groq', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE channel_enum AS ENUM ('telegram', 'messenger', 'whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE connection_status_enum AS ENUM ('connected', 'disconnected', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ PROFILES (linked to auth.users if using Supabase Auth) ═══
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  business_name TEXT,
  full_name TEXT,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

-- ═══ USER SETTINGS (AI config, business context, keys) ═══
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  business_name TEXT,
  business_description TEXT,
  training_data TEXT,
  welcome_message TEXT,
  llm_provider TEXT DEFAULT 'puter',
  puter_api_token TEXT,
  groq_api_key TEXT,
  custom_api_key TEXT,
  ai_personality TEXT DEFAULT 'friendly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- ═══ BOT CONNECTIONS (Telegram bots) ═══
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
CREATE INDEX IF NOT EXISTS idx_bot_connections_user ON bot_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_connections_bot ON bot_connections(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_connections_platform_bot ON bot_connections(platform, bot_id);

-- ═══ CHANNEL CONNECTIONS (Messenger, WhatsApp) ═══
CREATE TABLE IF NOT EXISTS channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'messenger',
  access_token TEXT,
  page_id TEXT,
  page_name TEXT,
  session_data JSONB,
  status TEXT DEFAULT 'disconnected',
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, channel)
);
CREATE INDEX IF NOT EXISTS idx_channel_connections_tenant ON channel_connections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_connections_channel ON channel_connections(tenant_id, channel);

-- ═══ KNOWLEDGE BASE ═══
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON knowledge_base(user_id, is_active);

-- ═══ PRODUCTS ═══
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price TEXT,
  description TEXT,
  discount TEXT,
  delivery_info TEXT,
  stock_status TEXT DEFAULT 'in_stock',
  colors TEXT[],
  sizes TEXT[],
  image_urls TEXT[],
  faq JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);

-- ═══ CONVERSATIONS ═══
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  visitor_name TEXT,
  source TEXT DEFAULT 'telegram',
  status TEXT DEFAULT 'active',
  messages JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON conversations(user_id, visitor_id);

-- ═══ LEADS ═══
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  budget TEXT,
  product_interest TEXT,
  buying_intent TEXT DEFAULT 'cold',
  source TEXT DEFAULT 'telegram',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);

-- ═══ ROW LEVEL SECURITY ═══
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all on profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all on user_settings" ON user_settings;
DROP POLICY IF EXISTS "Allow all on bot_connections" ON bot_connections;
DROP POLICY IF EXISTS "Allow all on channel_connections" ON channel_connections;
DROP POLICY IF EXISTS "Allow all on knowledge_base" ON knowledge_base;
DROP POLICY IF EXISTS "Allow all on products" ON products;
DROP POLICY IF EXISTS "Allow all on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all on leads" ON leads;

-- Service-role policies (API routes use service key, so allow all)
-- In production, use service_role key in API routes for full access
-- and anon key in client with strict RLS
CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on user_settings" ON user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on bot_connections" ON bot_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on channel_connections" ON channel_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on knowledge_base" ON knowledge_base FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on leads" ON leads FOR ALL USING (true) WITH CHECK (true);

-- Add new columns to existing tables (safe to re-run)
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS training_data TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS llm_provider TEXT DEFAULT 'puter';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS custom_api_key TEXT;

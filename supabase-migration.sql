-- =============================================
-- Nuron AI — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- Products table (the AI's knowledge brain)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  discount TEXT,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'out_of_stock', 'preorder')),
  category TEXT,
  tags TEXT[],
  colors TEXT[],
  sizes TEXT[],
  delivery_info TEXT,
  description TEXT,
  notes TEXT,
  faq JSONB DEFAULT '[]',
  image_urls TEXT[],
  product_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations table (Messenger threads)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  visitor_name TEXT,
  messages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'needs_human', 'resolved', 'archived')),
  source TEXT DEFAULT 'messenger',
  lead_id UUID,
  started_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  budget TEXT,
  need TEXT,
  product_interest TEXT,
  notes TEXT,
  source TEXT DEFAULT 'messenger',
  buying_intent TEXT DEFAULT 'cold' CHECK (buying_intent IN ('hot', 'warm', 'cold')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Page tokens (stores Facebook Page Access Tokens per user)
CREATE TABLE IF NOT EXISTS page_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  page_id TEXT NOT NULL,
  page_name TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_visitor ON conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_page_tokens_user ON page_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_page_tokens_page ON page_tokens(page_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now — tighten with auth later)
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on page_tokens" ON page_tokens FOR ALL USING (true) WITH CHECK (true);

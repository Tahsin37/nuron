-- =============================================
-- Nuron AI — Revenue Engine Migration (03)
-- Adds: Sentiment classification, Abandoned Cart,
--        Google Sheets sync, Suggested Replies, SKU
-- Safe to re-run (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- =============================================

-- ═══ NEW ENUM TYPES ═══

DO $$ BEGIN
  CREATE TYPE sentiment_tag_enum AS ENUM ('ready_to_buy', 'window_shopper', 'frustrated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE conversation_status_enum AS ENUM ('ai_handled', 'needs_human', 'human_handled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══ USER SETTINGS EXTENSIONS ═══
-- Google Sheets integration fields
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS google_sheet_url TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS last_sync_time TIMESTAMPTZ;

-- ═══ CONVERSATIONS EXTENSIONS ═══
-- Sentiment classification
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS sentiment_tag TEXT;
-- Abandoned cart tracking
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS abandoned_cart_triggered BOOLEAN DEFAULT false;
-- AI-generated suggested replies for human handoff (array of 3 strings)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS suggested_replies JSONB;
-- Media URL for vision screenshots (conversation-level for latest image)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS media_url TEXT;

-- ═══ PRODUCTS EXTENSIONS ═══
-- SKU for reliable Google Sheets sync matching
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
-- Category for better product organization
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
-- Tags for semantic matching
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];

-- ═══ NEW INDEXES ═══

-- Abandoned cart cron query: find "ready to buy" conversations that went cold
CREATE INDEX IF NOT EXISTS idx_conversations_abandoned_cart
  ON conversations (user_id, sentiment_tag, status, abandoned_cart_triggered, last_message_at)
  WHERE abandoned_cart_triggered = false;

-- Sentiment filter for lead radar
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment
  ON conversations (user_id, sentiment_tag)
  WHERE sentiment_tag IS NOT NULL;

-- SKU lookup for Sheets sync upsert
CREATE INDEX IF NOT EXISTS idx_products_sku
  ON products (user_id, sku)
  WHERE sku IS NOT NULL;

-- ═══ COMMENT DOCUMENTATION ═══
COMMENT ON COLUMN user_settings.google_sheet_url IS 'Public CSV export URL for Google Sheets inventory sync';
COMMENT ON COLUMN user_settings.last_sync_time IS 'Timestamp of last successful Google Sheets sync';
COMMENT ON COLUMN conversations.sentiment_tag IS 'AI-classified sentiment: ready_to_buy, window_shopper, frustrated';
COMMENT ON COLUMN conversations.abandoned_cart_triggered IS 'Whether an abandoned cart re-engagement DM has been sent';
COMMENT ON COLUMN conversations.suggested_replies IS 'JSONB array of 3 AI-generated reply suggestions for human handoff';
COMMENT ON COLUMN conversations.media_url IS 'URL of the latest image/media sent in this conversation';
COMMENT ON COLUMN products.sku IS 'Stock Keeping Unit for Google Sheets sync matching';

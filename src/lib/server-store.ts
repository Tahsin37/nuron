// ==================== Server-Side Store (Supabase) ====================
// Multi-tenant: every function is scoped by user_id

import { supabase } from "./supabase";
import type { Product } from "./types";

// ==================== User Settings ====================

export interface UserSettings {
  user_id: string;
  business_name?: string;
  puter_api_token?: string;
  groq_api_key?: string;
  ai_personality?: string;
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  return data as UserSettings | null;
}

export async function saveUserSettings(userId: string, settings: Partial<UserSettings>) {
  const { error } = await supabase.from("user_settings").upsert({
    ...settings,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[ServerStore] saveUserSettings error:", error.message);
}

// ==================== Bot Connections ====================

export interface BotConnection {
  user_id: string;
  platform: string;
  bot_id: string;
  bot_token?: string;
  bot_name?: string;
  webhook_url?: string;
  status?: string;
}

/** Look up which user owns a bot by its bot_id */
export async function getUserByBotId(botId: string, platform = "telegram"): Promise<string | null> {
  const { data } = await supabase
    .from("bot_connections")
    .select("user_id")
    .eq("bot_id", botId)
    .eq("platform", platform)
    .eq("status", "active")
    .single();
  return data?.user_id || null;
}

/** Save a bot connection for a user */
export async function saveBotConnection(conn: BotConnection) {
  const { error } = await supabase.from("bot_connections").upsert(conn);
  if (error) console.error("[ServerStore] saveBotConnection error:", error.message);
}

/** Get all bot connections for a user */
export async function getBotConnections(userId: string, platform?: string): Promise<BotConnection[]> {
  let query = supabase
    .from("bot_connections")
    .select("*")
    .eq("user_id", userId);
  if (platform) query = query.eq("platform", platform);
  const { data } = await query;
  return (data || []) as BotConnection[];
}

/** Get the bot token for a specific bot */
export async function getBotToken(botId: string, platform = "telegram"): Promise<string | null> {
  const { data } = await supabase
    .from("bot_connections")
    .select("bot_token")
    .eq("bot_id", botId)
    .eq("platform", platform)
    .single();
  return data?.bot_token || null;
}

// ==================== Products ====================

export async function getProductsByUser(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ServerStore] getProducts error:", error.message);
    return [];
  }
  return (data || []) as Product[];
}

export async function saveProduct(userId: string, product: Partial<Product>) {
  const { error } = await supabase.from("products").upsert({
    ...product,
    user_id: userId,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[ServerStore] saveProduct error:", error.message);
}

// ==================== Conversations ====================

export async function getOrCreateConversation(
  userId: string,
  visitorId: string,
  visitorName?: string
) {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("visitor_id", visitorId)
    .in("status", ["active", "needs_human"])
    .order("last_message_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      visitor_id: visitorId,
      visitor_name: visitorName || "User",
      messages: [],
      status: "active",
      source: "telegram",
    })
    .select()
    .single();

  if (error) {
    console.error("[ServerStore] createConversation error:", error.message);
    return null;
  }
  return newConv;
}

export async function appendMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
) {
  const { data: conv } = await supabase
    .from("conversations")
    .select("messages")
    .eq("id", conversationId)
    .single();

  if (!conv) return;

  const messages = Array.isArray(conv.messages) ? conv.messages : [];
  messages.push({
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  await supabase
    .from("conversations")
    .update({
      messages,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

export async function flagConversation(conversationId: string, status: "needs_human" | "resolved") {
  await supabase
    .from("conversations")
    .update({ status })
    .eq("id", conversationId);
}

export async function getConversationHistory(
  conversationId: string
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const { data } = await supabase
    .from("conversations")
    .select("messages")
    .eq("id", conversationId)
    .single();

  if (!data?.messages) return [];
  return (data.messages as any[]).map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

// ==================== Leads ====================

export async function createLead(lead: {
  user_id: string;
  name: string;
  phone?: string;
  product_interest?: string;
  buying_intent: "hot" | "warm" | "cold";
  source?: string;
}) {
  const { error } = await supabase.from("leads").insert({
    ...lead,
    source: lead.source || "telegram",
  });
  if (error) console.error("[ServerStore] createLead error:", error.message);
}

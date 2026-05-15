// ==================== Server-Side Store (Supabase) ====================
// Used by API routes & webhooks — mirrors the client-side Puter store structure

import { supabase } from "./supabase";
import type { Product } from "./types";

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

export async function getProductsByPageId(pageId: string): Promise<Product[]> {
  // Look up user_id from page_tokens, then get their products
  const { data: tokenRow } = await supabase
    .from("page_tokens")
    .select("user_id")
    .eq("page_id", pageId)
    .single();

  if (!tokenRow) return [];
  return getProductsByUser(tokenRow.user_id);
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
  // Check if an active conversation exists
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

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      visitor_id: visitorId,
      visitor_name: visitorName || "Facebook User",
      messages: [],
      status: "active",
      source: "messenger",
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
  // Fetch current messages
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
    source: lead.source || "messenger",
  });
  if (error) console.error("[ServerStore] createLead error:", error.message);
}

// ==================== Page Tokens ====================

export async function getPageToken(pageId: string): Promise<string | null> {
  const { data } = await supabase
    .from("page_tokens")
    .select("access_token")
    .eq("page_id", pageId)
    .single();

  return data?.access_token || null;
}

export async function getUserIdByPage(pageId: string): Promise<string | null> {
  const { data } = await supabase
    .from("page_tokens")
    .select("user_id")
    .eq("page_id", pageId)
    .single();

  return data?.user_id || null;
}

export async function savePageToken(userId: string, pageId: string, accessToken: string, pageName?: string) {
  const { error } = await supabase.from("page_tokens").upsert({
    user_id: userId,
    page_id: pageId,
    access_token: accessToken,
    page_name: pageName,
  });
  if (error) console.error("[ServerStore] savePageToken error:", error.message);
}

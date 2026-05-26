// ==================== Abandoned Cart Outbound Processor ====================
// Cron: */30 * * * * (every 30 minutes)
// Scans for "ready to buy" conversations that went cold (>2 hours)
// and dispatches personalized re-engagement messages.

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAIN_APP_URL = process.env.MAIN_APP_URL || "https://nuron-ai.vercel.app";

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("[Abandoned Cart] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Generate a personalized re-engagement message using the main app's AI.
 */
async function generateReengagementMessage(tenantId, conversationMessages, visitorName) {
  try {
    const lastMessages = Array.isArray(conversationMessages)
      ? conversationMessages.slice(-5).map(m => `${m.role}: ${m.content}`).join("\n")
      : "";

    const res = await fetch(`${MAIN_APP_URL}/api/ai/test-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenantId,
        message: `[SYSTEM: Generate a warm, personalized re-engagement message for ${visitorName || "this customer"} who was interested in buying but hasn't responded in over 2 hours. Reference their previous conversation naturally. Keep it short (1-2 sentences), friendly, and include a subtle urgency element. Previous conversation:\n${lastMessages}]`,
        session_history: [],
      }),
    });

    if (!res.ok) {
      console.error(`[Abandoned Cart] AI generation failed: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    return data.reply || null;
  } catch (e) {
    console.error("[Abandoned Cart] AI generation error:", e.message || e);
    return null;
  }
}

/**
 * Dispatch a message via the appropriate channel.
 * Supports WhatsApp (via worker sessions) and Messenger (via Graph API).
 */
async function dispatchMessage(source, visitorId, message, tenantId) {
  try {
    // Extract the actual sender ID from the composite visitor_id
    // Format: "whatsapp_1234567890" or "messenger_psid123"
    const parts = visitorId.split("_");
    const channel = parts[0] || source || "unknown";
    const senderId = parts.slice(1).join("_");

    if (channel === "whatsapp") {
      // Send via the worker's WhatsApp session
      const workerUrl = process.env.WORKER_SELF_URL || `http://localhost:${process.env.PORT || 3001}`;
      const res = await fetch(`${workerUrl}/api/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, to: `${senderId}@c.us`, message }),
      });
      if (!res.ok) {
        console.warn(`[Abandoned Cart] WhatsApp send failed for ${senderId}: HTTP ${res.status}`);
        return false;
      }
      return true;
    }

    if (channel === "messenger") {
      const supabase = getSupabase();
      const { data: conn } = await supabase
        .from("channel_connections")
        .select("access_token, page_id")
        .eq("tenant_id", tenantId)
        .eq("channel", "messenger")
        .eq("status", "connected")
        .single();

      if (!conn?.access_token) {
        console.warn(`[Abandoned Cart] No Messenger connection for tenant ${tenantId}`);
        return false;
      }

      const res = await fetch(
        `https://graph.facebook.com/v19.0/me/messages?access_token=${conn.access_token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: { id: senderId },
            message: { text: message },
          }),
        }
      );
      if (!res.ok) {
        console.warn(`[Abandoned Cart] Messenger send failed: HTTP ${res.status}`);
        return false;
      }
      return true;
    }

    if (channel === "telegram") {
      const supabase = getSupabase();
      const { data: bots } = await supabase
        .from("bot_connections")
        .select("bot_token")
        .eq("user_id", tenantId)
        .eq("platform", "telegram")
        .eq("status", "active")
        .limit(1);

      if (!bots?.length || !bots[0].bot_token) {
        console.warn(`[Abandoned Cart] No Telegram bot for tenant ${tenantId}`);
        return false;
      }

      const res = await fetch(
        `https://api.telegram.org/bot${bots[0].bot_token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: senderId, text: message }),
        }
      );
      if (!res.ok) {
        console.warn(`[Abandoned Cart] Telegram send failed: HTTP ${res.status}`);
        return false;
      }
      return true;
    }

    console.warn(`[Abandoned Cart] Unsupported channel: ${channel}`);
    return false;
  } catch (e) {
    console.error("[Abandoned Cart] Dispatch error:", e.message || e);
    return false;
  }
}

/**
 * Main abandoned cart processor.
 * Finds cold "ready to buy" conversations and re-engages them.
 */
async function runAbandonedCartProcessor() {
  console.log("[Abandoned Cart] Starting scan cycle...");
  const supabase = getSupabase();

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // Find candidate conversations
  const { data: candidates, error } = await supabase
    .from("conversations")
    .select("id, user_id, visitor_id, visitor_name, source, messages, last_message_at, sentiment_tag")
    .eq("sentiment_tag", "ready_to_buy")
    .in("status", ["ai_handled", "active"])
    .eq("abandoned_cart_triggered", false)
    .lt("last_message_at", twoHoursAgo)
    .limit(20);

  if (error) {
    console.error("[Abandoned Cart] Query error:", error.message);
    return;
  }

  if (!candidates || candidates.length === 0) {
    console.log("[Abandoned Cart] No abandoned carts found.");
    return;
  }

  console.log(`[Abandoned Cart] Found ${candidates.length} candidate(s).`);

  let sent = 0, failed = 0;

  for (const conv of candidates) {
    try {
      // Generate personalized re-engagement message
      const reengageMsg = await generateReengagementMessage(
        conv.user_id,
        conv.messages,
        conv.visitor_name
      );

      if (!reengageMsg) {
        console.warn(`[Abandoned Cart] Could not generate message for ${conv.id}`);
        // Still mark as triggered to avoid infinite retries
        await supabase.from("conversations").update({ abandoned_cart_triggered: true }).eq("id", conv.id);
        failed++;
        continue;
      }

      // Dispatch the message
      const dispatched = await dispatchMessage(conv.source, conv.visitor_id, reengageMsg, conv.user_id);

      if (dispatched) {
        // Append the re-engagement message to the conversation
        const messages = Array.isArray(conv.messages) ? [...conv.messages] : [];
        messages.push({
          id: require("crypto").randomUUID(),
          role: "assistant",
          content: reengageMsg,
          timestamp: new Date().toISOString(),
        });

        await supabase.from("conversations").update({
          messages,
          abandoned_cart_triggered: true,
          last_message_at: new Date().toISOString(),
        }).eq("id", conv.id);

        console.log(`[Abandoned Cart] ✅ Re-engaged ${conv.visitor_name || conv.visitor_id} (${conv.source})`);
        sent++;
      } else {
        // Mark as triggered even if dispatch failed (avoid spam retries)
        await supabase.from("conversations").update({ abandoned_cart_triggered: true }).eq("id", conv.id);
        console.warn(`[Abandoned Cart] ⚠️ Dispatch failed for ${conv.visitor_name || conv.visitor_id}`);
        failed++;
      }

      // Rate limit: 1 second between sends
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error(`[Abandoned Cart] Error processing ${conv.id}:`, e.message || e);
      failed++;
    }
  }

  console.log(`[Abandoned Cart] Cycle complete. Sent: ${sent}, Failed: ${failed}`);
}

module.exports = { runAbandonedCartProcessor };

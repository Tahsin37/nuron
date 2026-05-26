// ==================== WhatsApp Webhook Receiver ====================
// Catches incoming messages from the Railway WhatsApp worker.
// Routes them through the full AI pipeline and sends the reply
// back to the worker's /api/send endpoint.

import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, detectIntent } from "@/lib/ai-pipeline";
import { routeWithClassification } from "@/lib/llm-router";
import type { TenantLLMConfig } from "@/lib/llm-router";
import {
  getProductsByUser,
  getOrCreateConversation,
  appendMessage,
  flagConversation,
  getConversationHistory,
  createLead,
  getUserSettings,
  getKnowledgeBase,
  updateConversationSentiment,
} from "@/lib/server-store";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || "";

export async function POST(request: NextRequest) {
  let from = "";
  let body = "";

  try {
    const payload = await request.json();
    from = payload.from || "";
    body = payload.body || payload.message || "";
    const tenantId = payload.tenant_id || "";
    const timestamp = payload.timestamp || new Date().toISOString();
    const senderName = payload.sender_name || payload.from || "Customer";
    const mediaUrl = payload.media_url || undefined;

    if (!from || !body || !tenantId) {
      return NextResponse.json(
        { error: "from, body, and tenant_id are required" },
        { status: 400 }
      );
    }

    // ── Get tenant settings ──
    const settings = await getUserSettings(tenantId);
    if (!settings) {
      // No settings = no AI config. Send a generic reply.
      await sendReply(from, "Thanks for your message! We'll get back to you soon.");
      return NextResponse.json({ status: "ok", reply: "default_reply" });
    }

    // ── Build LLM config ──
    const config: TenantLLMConfig = {
      provider: (settings.llm_provider as "puter" | "groq" | "custom") || "puter",
      puterToken: settings.puter_api_token || process.env.PUTER_API_TOKEN,
      groqKey: settings.groq_api_key || process.env.GROQ_API_KEY,
    };

    // ── Get or create conversation ──
    const visitorId = `whatsapp_${from}`;
    const conversation = await getOrCreateConversation(tenantId, visitorId, senderName);
    if (!conversation) {
      await sendReply(from, "Sorry, something went wrong. Please try again.");
      return NextResponse.json({ status: "error", error: "conversation_creation_failed" });
    }

    // ── Save incoming message ──
    await appendMessage(conversation.id, "user", body, mediaUrl);

    // ── If flagged for human handoff, don't auto-reply ──
    if (conversation.status === "needs_human") {
      const handoffMsg = "🙋 Your message has been forwarded to our team. They'll reply shortly!";
      await sendReply(from, handoffMsg);
      return NextResponse.json({ status: "needs_human", reply: handoffMsg });
    }

    // ── Build AI context ──
    const products = await getProductsByUser(tenantId);
    const history = await getConversationHistory(conversation.id);
    const knowledgeEntries = await getKnowledgeBase(tenantId);
    const systemPrompt = buildSystemPrompt(
      products,
      settings.business_name || "our shop",
      settings.business_description,
      settings.training_data,
      knowledgeEntries,
      settings.welcome_message
    );

    // ── Route through the enriched LLM pipeline ──
    const enrichedResult = await routeWithClassification(
      systemPrompt,
      history,
      body,
      config,
      products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock_status: p.stock_status,
        description: p.description,
        colors: p.colors,
        tags: p.tags,
      })),
      mediaUrl
    );

    // ── Save AI reply ──
    await appendMessage(conversation.id, "assistant", enrichedResult.content);

    // ── Persist sentiment ──
    const newStatus = enrichedResult.sentiment.shouldHandoff ? "needs_human" : undefined;
    await updateConversationSentiment(
      conversation.id,
      enrichedResult.sentiment.tag,
      enrichedResult.suggestedReplies,
      newStatus
    );

    if (enrichedResult.sentiment.shouldHandoff) {
      await flagConversation(conversation.id, "needs_human");
    }

    // ── Detect buying intent for lead creation ──
    const intent = detectIntent(body);
    if (intent.level === "hot" || intent.level === "warm") {
      await createLead({
        user_id: tenantId,
        name: senderName,
        product_interest: body.substring(0, 100),
        buying_intent: intent.level,
        source: "whatsapp",
      });
    }

    // ── Send the AI reply back to WhatsApp via the worker ──
    await sendReply(from, enrichedResult.content);

    return NextResponse.json({
      status: "ok",
      reply: enrichedResult.content,
      sentiment: enrichedResult.sentiment.tag,
    });
  } catch (err: any) {
    console.error("[WhatsApp Webhook] Error:", err);

    // Attempt a fallback reply so the customer isn't left hanging
    if (from) {
      await sendReply(from, "Thanks for reaching out! Our team will assist you shortly.").catch(() => {});
    }

    return NextResponse.json({ status: "error", error: err?.message });
  }
}

/**
 * Send a reply message back to the Railway WhatsApp worker.
 */
async function sendReply(to: string, message: string): Promise<void> {
  if (!RAILWAY_URL) {
    console.warn("[WhatsApp Webhook] NEXT_PUBLIC_RAILWAY_URL not set — cannot send reply");
    return;
  }

  try {
    await fetch(`${RAILWAY_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });
  } catch (err) {
    console.error("[WhatsApp Webhook] Failed to send reply:", err);
  }
}

// ==================== Facebook Messenger Webhook (Multi-Tenant) ====================
// GET  → Facebook verification challenge
// POST → Incoming messages from Messenger
// Uses bot_connections to route Facebook pages to their owner's products & AI keys

import { NextRequest, NextResponse } from "next/server";
import { sendTextMessage, sendTypingIndicator, getUserProfile } from "@/lib/messenger";
import { buildSystemPrompt, detectIntent, generateAIReply } from "@/lib/ai-pipeline";
import type { AIKeys } from "@/lib/ai-pipeline";
import {
  getProductsByUser,
  getOrCreateConversation,
  appendMessage,
  flagConversation,
  getConversationHistory,
  createLead,
  getUserByBotId,
  getUserSettings,
} from "@/lib/server-store";

// ─── GET: Facebook Webhook Verification ───
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.FB_VERIFY_TOKEN || "nuron_webhook_verify_2024";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Messenger] ✅ Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// ─── POST: Incoming Messenger Messages ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.object !== "page") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    for (const entry of body.entry || []) {
      const pageId = entry.id;
      for (const event of entry.messaging || []) {
        await handleMessagingEvent(pageId, event);
      }
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[Messenger] Webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

async function handleMessagingEvent(pageId: string, event: any) {
  const senderId = event.sender?.id;
  const message = event.message;

  if (!senderId || !message?.text) return;
  if (message.is_echo) return;

  const customerMessage = message.text;

  try {
    // Look up user by their Facebook page (stored in bot_connections as platform='messenger')
    const userId = await getUserByBotId(pageId, "messenger");
    if (!userId) {
      console.warn(`[Messenger] No user found for page ${pageId}`);
      return;
    }

    // Get user's AI keys
    const settings = await getUserSettings(userId);
    const aiKeys: AIKeys = {
      puterToken: settings?.puter_api_token || undefined,
      groqKey: settings?.groq_api_key || undefined,
    };

    const profile = await getUserProfile(senderId);
    const visitorName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : "Facebook User";

    const conversation = await getOrCreateConversation(userId, senderId, visitorName);
    if (!conversation) return;

    await appendMessage(conversation.id, "user", customerMessage);

    if (conversation.status === "needs_human") return;

    await sendTypingIndicator(senderId, "typing_on");

    const products = await getProductsByUser(userId);
    const history = await getConversationHistory(conversation.id);
    const systemPrompt = buildSystemPrompt(products, settings?.business_name || "our shop");
    const aiReply = await generateAIReply(systemPrompt, history, aiKeys);

    await sendTypingIndicator(senderId, "typing_off");
    const sent = await sendTextMessage(senderId, aiReply);

    if (sent) {
      await appendMessage(conversation.id, "assistant", aiReply);
    }

    const intent = detectIntent(customerMessage);
    if (intent.level === "hot" || intent.level === "warm") {
      await createLead({ user_id: userId, name: visitorName, product_interest: customerMessage.substring(0, 100), buying_intent: intent.level, source: "messenger" });
    }
    if (intent.shouldFlagHuman) {
      await flagConversation(conversation.id, "needs_human");
    }
  } catch (err) {
    console.error(`[Messenger] Error for ${senderId}:`, err);
  }
}

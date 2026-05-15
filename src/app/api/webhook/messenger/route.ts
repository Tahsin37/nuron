// ==================== Facebook Messenger Webhook ====================
// GET  → Facebook verification challenge
// POST → Incoming messages from Messenger

import { NextRequest, NextResponse } from "next/server";
import { sendTextMessage, sendTypingIndicator, getUserProfile } from "@/lib/messenger";
import { buildSystemPrompt, detectIntent, generateAIReply } from "@/lib/ai-pipeline";
import {
  getProductsByPageId,
  getOrCreateConversation,
  appendMessage,
  flagConversation,
  getConversationHistory,
  createLead,
  getUserIdByPage,
  getPageToken,
} from "@/lib/server-store";

// ─── GET: Facebook Webhook Verification ───
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.FB_VERIFY_TOKEN || "nuron_webhook_verify_2024";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Webhook] ✅ Verification successful");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[Webhook] ❌ Verification failed — token mismatch");
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// ─── POST: Incoming Messenger Messages ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Facebook sends a specific structure
    if (body.object !== "page") {
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    // Process each entry (Facebook batches messages)
    for (const entry of body.entry || []) {
      const pageId = entry.id;

      for (const event of entry.messaging || []) {
        await handleMessagingEvent(pageId, event);
      }
    }

    // Facebook requires a 200 response within 20 seconds
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[Webhook] Error processing webhook:", err);
    // Still return 200 so Facebook doesn't retry
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}

// ─── Core Message Handler ───
async function handleMessagingEvent(pageId: string, event: any) {
  const senderId = event.sender?.id;
  const message = event.message;

  // Skip if no sender or no text message (ignore read receipts, deliveries, etc.)
  if (!senderId || !message?.text) return;

  // Skip echo messages (messages sent BY the page)
  if (message.is_echo) return;

  const customerMessage = message.text;
  console.log(`[Webhook] 📩 Message from ${senderId}: "${customerMessage}"`);

  try {
    // 1. Look up who owns this page
    const userId = await getUserIdByPage(pageId);
    if (!userId) {
      console.warn(`[Webhook] No user found for page ${pageId}`);
      return;
    }

    // 2. Get or create the conversation thread
    const profile = await getUserProfile(senderId);
    const visitorName = profile
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : "Facebook User";

    const conversation = await getOrCreateConversation(userId, senderId, visitorName);
    if (!conversation) {
      console.error("[Webhook] Failed to create conversation");
      return;
    }

    // 3. Save the incoming message
    await appendMessage(conversation.id, "user", customerMessage);

    // 4. Check if this conversation is in "needs_human" mode
    if (conversation.status === "needs_human") {
      console.log(`[Webhook] Conversation ${conversation.id} is in human mode — skipping AI`);
      return; // Don't auto-reply, human is handling it
    }

    // 5. Show typing indicator
    await sendTypingIndicator(senderId, "typing_on");

    // 6. Load the seller's products for AI context
    const products = await getProductsByPageId(pageId);

    // 7. Get conversation history for context
    const history = await getConversationHistory(conversation.id);

    // 8. Build system prompt and generate AI reply
    const systemPrompt = buildSystemPrompt(products, visitorName);
    const aiReply = await generateAIReply(systemPrompt, history);

    // 9. Send the AI reply back to Messenger
    await sendTypingIndicator(senderId, "typing_off");
    const sent = await sendTextMessage(senderId, aiReply);

    if (sent) {
      // 10. Save the AI reply in conversation
      await appendMessage(conversation.id, "assistant", aiReply);
      console.log(`[Webhook] ✅ AI replied to ${senderId}: "${aiReply.substring(0, 50)}..."`);
    }

    // 11. Detect buying intent
    const intent = detectIntent(customerMessage);

    // 12. If high intent, create/update a lead
    if (intent.level === "hot" || intent.level === "warm") {
      await createLead({
        user_id: userId,
        name: visitorName,
        product_interest: customerMessage.substring(0, 100),
        buying_intent: intent.level,
        source: "messenger",
      });
      console.log(`[Webhook] 🔥 Lead captured: ${visitorName} (${intent.level})`);
    }

    // 13. If AI is confused, flag for human review
    if (intent.shouldFlagHuman) {
      await flagConversation(conversation.id, "needs_human");
      console.log(`[Webhook] 🚨 Flagged for human review: ${conversation.id}`);
    }
  } catch (err) {
    console.error(`[Webhook] Error handling message from ${senderId}:`, err);
  }
}

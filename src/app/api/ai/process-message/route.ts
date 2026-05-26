// ==================== AI Message Processor ====================
// Bridge endpoint: called by the Railway worker when WhatsApp/Messenger
// messages arrive. Processes them through the AI pipeline and returns a reply.
// Now includes sentiment classification and suggested replies for human handoff.

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

export async function POST(request: NextRequest) {
  try {
    const { tenant_id, channel, sender_id, sender_name, message, media_url } = await request.json();

    if (!tenant_id || !sender_id || !message) {
      return NextResponse.json({ error: "tenant_id, sender_id, and message required" }, { status: 400 });
    }

    const userId = tenant_id;

    // Get user settings
    const settings = await getUserSettings(userId);
    if (!settings) {
      return NextResponse.json({ reply: "Thanks for your message! We'll get back to you soon." });
    }

    // Build tenant LLM config
    const config: TenantLLMConfig = {
      provider: (settings.llm_provider as "puter" | "groq" | "custom") || "puter",
      puterToken: settings.puter_api_token || process.env.PUTER_API_TOKEN,
      groqKey: settings.groq_api_key || process.env.GROQ_API_KEY,
    };

    // Get or create conversation
    const source = channel || "whatsapp";
    const visitorId = `${source}_${sender_id}`;
    const conversation = await getOrCreateConversation(userId, visitorId, sender_name || "Customer");

    if (!conversation) {
      return NextResponse.json({ reply: "Sorry, something went wrong. Please try again." });
    }

    // Append user message (with optional media)
    await appendMessage(conversation.id, "user", message, media_url);

    // If flagged for human, don't auto-reply
    if (conversation.status === "needs_human") {
      return NextResponse.json({
        reply: "🙋 Your message has been forwarded to our team. They'll reply shortly!",
        status: "needs_human",
      });
    }

    // Build context
    const products = await getProductsByUser(userId);
    const history = await getConversationHistory(conversation.id);
    const knowledgeEntries = await getKnowledgeBase(userId);
    const systemPrompt = buildSystemPrompt(
      products,
      settings.business_name || "our shop",
      settings.business_description,
      settings.training_data,
      knowledgeEntries,
      settings.welcome_message
    );

    // Route with full classification pipeline
    const enrichedResult = await routeWithClassification(
      systemPrompt,
      history,
      message,
      config,
      products.map(p => ({ id: p.id, name: p.name, price: p.price, stock_status: p.stock_status, description: p.description, colors: p.colors, tags: p.tags })),
      media_url
    );

    // Save AI reply
    await appendMessage(conversation.id, "assistant", enrichedResult.content);

    // Persist sentiment classification
    const newStatus = enrichedResult.sentiment.shouldHandoff ? "needs_human" : undefined;
    await updateConversationSentiment(
      conversation.id,
      enrichedResult.sentiment.tag,
      enrichedResult.suggestedReplies,
      newStatus
    );

    // If handoff triggered, flag the conversation
    if (enrichedResult.sentiment.shouldHandoff) {
      await flagConversation(conversation.id, "needs_human");
    }

    // Detect intent for leads (legacy + enhanced)
    const intent = detectIntent(message);
    if (intent.level === "hot" || intent.level === "warm") {
      await createLead({
        user_id: userId,
        name: sender_name || sender_id,
        product_interest: message.substring(0, 100),
        buying_intent: intent.level,
        source,
      });
    }

    return NextResponse.json({
      reply: enrichedResult.content,
      status: enrichedResult.sentiment.shouldHandoff ? "needs_human" : "ok",
      sentiment: enrichedResult.sentiment.tag,
    });
  } catch (err: any) {
    console.error("[AI Processor] Error:", err);
    return NextResponse.json({ reply: "Thanks for reaching out! Our team will assist you shortly." });
  }
}

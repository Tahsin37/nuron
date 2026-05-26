// ==================== Bot Playground Test Processor ====================
// Sandbox endpoint: mimics process-message but does NOT persist to DB.
// Returns enriched debug metadata for the AI Brain Debugger panel.

import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, detectIntent } from "@/lib/ai-pipeline";
import { routeWithClassification } from "@/lib/llm-router";
import type { TenantLLMConfig } from "@/lib/llm-router";
import { getProductsByUser, getUserSettings, getKnowledgeBase } from "@/lib/server-store";

export async function POST(request: NextRequest) {
  try {
    const { tenant_id, message, session_history, media_url } = await request.json();

    if (!tenant_id || !message) {
      return NextResponse.json({ error: "tenant_id and message required" }, { status: 400 });
    }

    // Get user settings
    const settings = await getUserSettings(tenant_id);
    if (!settings) {
      return NextResponse.json({
        reply: "No settings found. Please configure your AI settings first.",
        debug: { error: "No user_settings row found for this tenant" },
      });
    }

    // Build tenant LLM config
    const config: TenantLLMConfig = {
      provider: (settings.llm_provider as "puter" | "groq" | "custom") || "puter",
      puterToken: settings.puter_api_token || process.env.PUTER_API_TOKEN,
      groqKey: settings.groq_api_key || process.env.GROQ_API_KEY,
    };

    // Load products and knowledge base
    const products = await getProductsByUser(tenant_id);
    const knowledgeEntries = await getKnowledgeBase(tenant_id);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      products,
      settings.business_name || "our shop",
      settings.business_description,
      settings.training_data,
      knowledgeEntries,
      settings.welcome_message
    );

    // Parse session history from client
    const history = Array.isArray(session_history)
      ? session_history.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }))
      : [];

    // Route with full classification (sentiment + vision + response)
    const enrichedResult = await routeWithClassification(
      systemPrompt,
      history,
      message,
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
      media_url
    );

    // Also run legacy intent detection for comparison
    const legacyIntent = detectIntent(message);

    // Build stock summary for debug panel
    const stockSummary = products.slice(0, 10).map(p => ({
      name: p.name,
      price: p.price,
      stock: p.stock_status,
      sku: p.sku || null,
    }));

    return NextResponse.json({
      reply: enrichedResult.content,
      sentiment: enrichedResult.sentiment,
      suggestedReplies: enrichedResult.suggestedReplies,
      matchedProducts: enrichedResult.matchedProducts,
      debug: {
        provider: enrichedResult.provider,
        model: enrichedResult.model,
        tokensUsed: enrichedResult.tokensUsed,
        processingTimeMs: enrichedResult.debug.processingTimeMs,
        systemPromptUsed: enrichedResult.debug.systemPromptUsed,
        legacyIntent,
        stockSummary,
        totalProducts: products.length,
        knowledgeBaseEntries: knowledgeEntries.length,
      },
    });
  } catch (err: any) {
    console.error("[Test Processor] Error:", err);
    return NextResponse.json({
      reply: "An error occurred during test processing.",
      debug: { error: err.message || "Unknown error" },
    }, { status: 500 });
  }
}

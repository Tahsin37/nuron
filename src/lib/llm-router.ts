// ==================== LLM Router ====================
// Dynamic routing between AI providers with sentiment classification,
// vision search, and enriched debug metadata.

import type { SentimentTag, MatchedProduct, EnrichedLLMResult, SentimentResult } from "./types";

export type LLMProvider = "puter" | "groq" | "custom";

export interface TenantLLMConfig {
  provider: LLMProvider;
  puterToken?: string;
  groqKey?: string;
  customApiKey?: string;
  customModelId?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string | any[];
}

export interface LLMResult {
  content: string;
  provider: LLMProvider;
  model: string;
  tokensUsed?: number;
}

// ─── Core Routing ───

export async function routeLLM(messages: LLMMessage[], config: TenantLLMConfig): Promise<LLMResult> {
  const maxTokens = config.maxTokens || 500;
  const temperature = config.temperature ?? 0.7;
  const providerChain = buildFallbackChain(config);

  for (const provider of providerChain) {
    try {
      const result = await callProvider(provider, messages, config, maxTokens, temperature);
      if (result) return result;
    } catch (e) {
      console.warn(`[LLM Router] ${provider} failed, trying next...`, e);
    }
  }

  return { content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.", provider: "puter", model: "fallback" };
}

function buildFallbackChain(config: TenantLLMConfig): LLMProvider[] {
  const primary = config.provider || "puter";
  const chain: LLMProvider[] = [primary];
  if (primary !== "groq" && config.groqKey) chain.push("groq");
  if (primary !== "puter" && config.puterToken) chain.push("puter");
  if (primary !== "custom" && config.customApiKey) chain.push("custom");
  return chain;
}

async function callProvider(provider: LLMProvider, messages: LLMMessage[], config: TenantLLMConfig, maxTokens: number, temperature: number): Promise<LLMResult | null> {
  switch (provider) {
    case "puter": return callPuter(messages, config.puterToken!, maxTokens, temperature);
    case "groq": return callGroq(messages, config.groqKey!, maxTokens, temperature);
    case "custom": return callCustom(messages, config.customApiKey!, config.customModelId, maxTokens, temperature);
    default: return null;
  }
}

// ─── Puter.js (GPT-4.1 via Puter API) ───
async function callPuter(messages: LLMMessage[], token: string, maxTokens: number, temperature: number): Promise<LLMResult | null> {
  if (!token) return null;
  const res = await fetch("https://api.puter.com/drivers/call", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ interface: "puter-chat-completion", driver: "openai-completion", method: "complete", args: { messages, model: "gpt-4.1", max_tokens: maxTokens, temperature } }),
  });
  if (!res.ok) { console.error("[LLM Router/Puter]", await res.text()); return null; }
  const data = await res.json();
  const content = data?.result?.message?.content?.trim() || data?.message?.content?.trim() || data?.result?.content?.trim() || null;
  if (!content) return null;
  return { content, provider: "puter", model: "gpt-4.1" };
}

// ─── Groq (Llama 4 Scout) ───
async function callGroq(messages: LLMMessage[], key: string, maxTokens: number, temperature: number): Promise<LLMResult | null> {
  if (!key) return null;
  const model = "meta-llama/llama-4-scout-17b-16e-instruct";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });
  if (!res.ok) { console.error("[LLM Router/Groq]", await res.text()); return null; }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim() || null;
  if (!content) return null;
  return { content, provider: "groq", model, tokensUsed: data?.usage?.total_tokens };
}

// ─── Custom OpenAI-compatible API ───
async function callCustom(messages: LLMMessage[], apiKey: string, modelId?: string, maxTokens?: number, temperature?: number): Promise<LLMResult | null> {
  if (!apiKey) return null;
  const model = modelId || "gpt-4o";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens || 500, temperature: temperature ?? 0.7 }),
  });
  if (!res.ok) { console.error("[LLM Router/Custom]", await res.text()); return null; }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim() || null;
  if (!content) return null;
  return { content, provider: "custom", model, tokensUsed: data?.usage?.total_tokens };
}

// ═══════════════════════════════════════════════════
// SENTIMENT CLASSIFICATION
// ═══════════════════════════════════════════════════

const SENTIMENT_PROMPT = `You are a customer sentiment classifier. Analyze the customer's message and conversation context.

Classify the sentiment as EXACTLY one of:
- "ready_to_buy": Customer is showing strong purchase intent (asking about ordering, payment, address, pricing, wanting to confirm)
- "window_shopper": Customer is casually browsing, asking general questions, not showing urgency
- "frustrated": Customer is upset, complaining, asking for refund/return, reporting problems

Also determine if this needs human handoff (true for: refund requests, complaints, complex issues, explicit requests to talk to a human).

If handoff is needed, generate exactly 3 contextual pre-drafted reply suggestions the business owner can use.

Respond ONLY with valid JSON:
{"tag":"ready_to_buy|window_shopper|frustrated","confidence":0.0-1.0,"shouldHandoff":false,"reason":"brief reason","suggestedReplies":["reply1","reply2","reply3"]}`;

export async function classifySentiment(
  customerMessage: string,
  conversationHistory: { role: string; content: string }[],
  config: TenantLLMConfig
): Promise<{ sentiment: SentimentResult; suggestedReplies: string[] }> {
  const recentContext = conversationHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");
  const classifyMessages: LLMMessage[] = [
    { role: "system", content: SENTIMENT_PROMPT },
    { role: "user", content: `Conversation context:\n${recentContext}\n\nLatest customer message: "${customerMessage}"` },
  ];

  try {
    const classifyConfig = { ...config, maxTokens: 300, temperature: 0.1 };
    const result = await routeLLM(classifyMessages, classifyConfig);
    const cleaned = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validTags: SentimentTag[] = ["ready_to_buy", "window_shopper", "frustrated"];
    const tag = validTags.includes(parsed.tag) ? parsed.tag : "window_shopper";

    return {
      sentiment: {
        tag,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        shouldHandoff: !!parsed.shouldHandoff,
        reason: parsed.reason || undefined,
      },
      suggestedReplies: parsed.shouldHandoff && Array.isArray(parsed.suggestedReplies) ? parsed.suggestedReplies.slice(0, 3) : [],
    };
  } catch (e) {
    console.warn("[LLM Router] Sentiment classification failed, using keyword fallback:", e);
    return keywordFallbackSentiment(customerMessage);
  }
}

function keywordFallbackSentiment(message: string): { sentiment: SentimentResult; suggestedReplies: string[] } {
  const lower = message.toLowerCase();
  const hotWords = ["order", "buy", "confirm", "payment", "bkash", "cod", "cash", "নিবো", "কনফার্ম", "কিনবো", "address"];
  const frustWords = ["refund", "return", "complaint", "problem", "broken", "wrong", "manager", "সমস্যা", "রিটার্ন", "ভাঙা"];

  if (frustWords.some(w => lower.includes(w))) {
    return {
      sentiment: { tag: "frustrated", confidence: 0.7, shouldHandoff: true, reason: "Negative keywords detected" },
      suggestedReplies: [
        "I sincerely apologize for the inconvenience. Let me look into this right away and find a solution for you.",
        "I understand your frustration and I want to make this right. Could you share your order details so I can help?",
        "Thank you for bringing this to our attention. I'm personally handling your case and will resolve this promptly.",
      ],
    };
  }
  if (hotWords.some(w => lower.includes(w))) {
    return { sentiment: { tag: "ready_to_buy", confidence: 0.75, shouldHandoff: false }, suggestedReplies: [] };
  }
  return { sentiment: { tag: "window_shopper", confidence: 0.5, shouldHandoff: false }, suggestedReplies: [] };
}

// ═══════════════════════════════════════════════════
// VISION-BASED PRODUCT SEARCH
// ═══════════════════════════════════════════════════

export async function processVisionSearch(
  imageUrl: string,
  products: { id: string; name: string; price: string; stock_status: string; description?: string; colors?: string[]; tags?: string[] }[],
  config: TenantLLMConfig
): Promise<MatchedProduct[]> {
  const productList = products.slice(0, 30).map(p =>
    `- ${p.name} (${p.price}) [${p.stock_status}]${p.colors?.length ? ` colors: ${p.colors.join(",")}` : ""}${p.description ? ` — ${p.description.slice(0, 80)}` : ""}`
  ).join("\n");

  const visionPrompt = `Analyze this product image. Identify the item type, color, style, and any visible text/brand.
Then match it against this product catalog and return the best matches.

CATALOG:
${productList}

Respond ONLY with valid JSON array of matches (max 3):
[{"name":"exact product name from catalog","similarity":0.0-1.0,"reason":"why it matches"}]
If no match, return: []`;

  const messages: LLMMessage[] = [
    { role: "system", content: "You are a visual product matching expert." },
    { role: "user", content: [{ type: "text", text: visionPrompt }, { type: "image_url", image_url: { url: imageUrl } }] },
  ];

  try {
    const visionConfig: TenantLLMConfig = { ...config, maxTokens: 400, temperature: 0.2 };
    // Prefer Puter (GPT-4o vision) for vision tasks
    if (config.puterToken) visionConfig.provider = "puter";
    const result = await routeLLM(messages, visionConfig);
    const cleaned = result.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const matches = JSON.parse(cleaned);

    if (!Array.isArray(matches)) return [];
    return matches.slice(0, 3).map((m: any) => {
      const product = products.find(p => p.name.toLowerCase() === (m.name || "").toLowerCase());
      return product ? { id: product.id, name: product.name, price: product.price, stock_status: product.stock_status, similarity: m.similarity || 0.5 } : null;
    }).filter(Boolean) as MatchedProduct[];
  } catch (e) {
    console.error("[LLM Router] Vision search failed:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════
// ENRICHED ROUTING (Main Entry Point)
// ═══════════════════════════════════════════════════

export async function routeWithClassification(
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  customerMessage: string,
  config: TenantLLMConfig,
  products?: { id: string; name: string; price: string; stock_status: string; description?: string; colors?: string[]; tags?: string[] }[],
  mediaUrl?: string
): Promise<EnrichedLLMResult> {
  const startTime = Date.now();

  // 1. Run sentiment classification in parallel with main response
  const sentimentPromise = classifySentiment(customerMessage, conversationHistory, config);

  // 2. Vision search if media is present
  let matchedProducts: MatchedProduct[] = [];
  if (mediaUrl && products?.length) {
    try {
      matchedProducts = await processVisionSearch(mediaUrl, products, config);
    } catch (e) {
      console.error("[LLM Router] Vision search error:", e);
    }
  }

  // 3. Generate main AI response
  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10),
    { role: "user", content: customerMessage },
  ];
  const mainResult = await routeLLM(messages, config);

  // 4. Await sentiment
  const { sentiment, suggestedReplies } = await sentimentPromise;

  return {
    content: mainResult.content,
    provider: mainResult.provider,
    model: mainResult.model,
    tokensUsed: mainResult.tokensUsed,
    sentiment,
    suggestedReplies,
    matchedProducts,
    debug: {
      systemPromptUsed: systemPrompt,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

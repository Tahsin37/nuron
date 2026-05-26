// ==================== AI Reply Pipeline (Multi-Tenant) ====================
// Each user has their OWN AI keys stored in Supabase user_settings.
// The pipeline reads the user's keys and calls AI per-user.

import type { Product } from "./types";

/**
 * Build a system prompt from the seller's product catalog.
 */
export function buildProductContext(products: Product[]): string {
  if (products.length === 0) {
    return "You have no products in your knowledge base yet. Politely tell the customer you'll get back to them shortly.";
  }

  const catalog = products
    .filter((p) => p.status === "active")
    .map((p) => {
      let entry = `• ${p.name} — ${p.price}`;
      if (p.discount) entry += ` (${p.discount})`;
      if (p.stock_status === "out_of_stock") entry += " [OUT OF STOCK]";
      if (p.stock_status === "preorder") entry += " [PRE-ORDER]";
      if (p.colors?.length) entry += ` | Colors: ${p.colors.join(", ")}`;
      if (p.sizes?.length) entry += ` | Sizes: ${p.sizes.join(", ")}`;
      if (p.delivery_info) entry += ` | Delivery: ${p.delivery_info}`;
      if (p.description) entry += ` | ${p.description}`;
      if (p.faq?.length) {
        entry += "\n  FAQ:";
        p.faq.forEach((f) => {
          entry += `\n    Q: ${f.question} → A: ${f.answer}`;
        });
      }
      return entry;
    })
    .join("\n");

  return catalog;
}

/**
 * Build the full system prompt for the AI sales employee.
 */
export function buildSystemPrompt(
  products: Product[],
  sellerName?: string,
  businessDescription?: string,
  trainingData?: string,
  knowledgeBase?: { title: string; content: string; category: string }[],
  welcomeMessage?: string
): string {
  const productCatalog = buildProductContext(products);
  const seller = sellerName || "the seller";

  let prompt = `You are an AI sales assistant for ${seller}. You reply to customer messages on behalf of the business.`;

  if (businessDescription) {
    prompt += `\n\nABOUT THIS BUSINESS:\n${businessDescription}`;
  }

  // Knowledge Base
  if (knowledgeBase && knowledgeBase.length > 0) {
    const grouped: Record<string, string[]> = {};
    knowledgeBase.forEach(kb => {
      const cat = kb.category || "general";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(`### ${kb.title}\n${kb.content}`);
    });
    prompt += `\n\n═══════ KNOWLEDGE BASE ═══════\nUse this information to answer customer questions accurately. This is your primary source of truth.\n`;
    for (const [cat, entries] of Object.entries(grouped)) {
      prompt += `\n── ${cat.toUpperCase().replace('_', ' ')} ──\n${entries.join("\n\n")}\n`;
    }
    prompt += `═══════════════════════════════`;
  }

  prompt += `\n\nCRITICAL LANGUAGE RULE:
- Detect the EXACT language the customer writes in.
- If they write in English → reply in English only.
- If they write in Bangla (বাংলা) → reply in Bangla only.
- If they write in Banglish (Bangla written in English letters like "dam koto") → reply in Banglish only.
- If they write in Hindi → reply in Hindi.
- NEVER mix languages. NEVER default to Banglish if the customer writes in English.

RULES:
1. Be friendly, natural, and helpful — like a real shop assistant.
2. Keep replies SHORT (1-3 sentences max). This is chat, not email.
3. ALWAYS use the product catalog and knowledge base for prices, stock, policies, and details. NEVER guess or make up information.
4. If a product is out of stock, say so honestly and suggest alternatives if available.
5. If the customer seems ready to order, ask for: Name, Phone Number, Address, and which product/variant they want.
6. If you genuinely don't know the answer from the knowledge base or product catalog, say you'll check with the team. The system will flag it for human review.
7. Never reveal that you are an AI. Act as a helpful team member.
8. For delivery questions, use the delivery info from the product database or knowledge base.
9. If someone asks "last price" or bargains, politely say the price is fixed unless a discount exists.
10. If the customer greets you (hi, hello, hey), greet back warmly and ask how you can help.

PRODUCT CATALOG:
${productCatalog}`;

  if (trainingData) {
    prompt += `\n\nEXAMPLE CONVERSATIONS (learn the tone and style from these):\n${trainingData}`;
  }

  if (welcomeMessage) {
    prompt += `\n\nWhen customers first message or say hi, use this style of greeting: "${welcomeMessage}"`;
  }

  prompt += `\n\nRemember: You are selling. Be persuasive but honest. Your goal is to convert conversations into orders while providing excellent customer service.`;

  return prompt;
}

/**
 * Detect the customer's buying intent from a message.
 */
export function detectIntent(message: string): {
  level: "hot" | "warm" | "cold";
  confidence: number;
  shouldFlagHuman: boolean;
} {
  const lower = message.toLowerCase();

  const hotKeywords = [
    "order", "নিবো", "নিব", "nibo", "nib", "confirm", "কনফার্ম",
    "address", "ঠিকানা", "phone", "ফোন", "payment", "পেমেন্ট",
    "bkash", "বিকাশ", "cod", "ক্যাশ", "cash on delivery",
    "কিনবো", "kinbo", "buy", "take", "চাই", "chai", "diben", "দিবেন",
  ];

  const warmKeywords = [
    "price", "দাম", "dam", "koto", "কত", "কতো", "size", "সাইজ",
    "color", "কালার", "রং", "delivery", "ডেলিভারি", "stock", "স্টক",
    "available", "আছে", "ase", "ache",
  ];

  const humanKeywords = [
    "manager", "owner", "complaint", "refund", "return", "রিটার্ন",
    "problem", "সমস্যা", "broken", "ভাঙা", "wrong", "ভুল",
  ];

  const hotMatch = hotKeywords.some((k) => lower.includes(k));
  const warmMatch = warmKeywords.some((k) => lower.includes(k));
  const humanMatch = humanKeywords.some((k) => lower.includes(k));

  if (hotMatch) return { level: "hot", confidence: 0.85 + Math.random() * 0.1, shouldFlagHuman: false };
  if (humanMatch) return { level: "warm", confidence: 0.5, shouldFlagHuman: true };
  if (warmMatch) return { level: "warm", confidence: 0.6 + Math.random() * 0.2, shouldFlagHuman: false };
  return { level: "cold", confidence: 0.3 + Math.random() * 0.2, shouldFlagHuman: false };
}

// ==================== Per-User AI Keys ====================

export interface AIKeys {
  puterToken?: string;
  groqKey?: string;
}

/**
 * Call AI via Puter REST API using the USER's token.
 */
async function callPuterAI(messages: any[], token: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.puter.com/drivers/call", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        interface: "puter-chat-completion",
        driver: "openai-completion",
        method: "complete",
        args: { messages, model: "gpt-4.1", max_tokens: 500, temperature: 0.7 },
      }),
    });
    if (!res.ok) { console.error("[Puter AI]", await res.text()); return null; }
    const data = await res.json();
    return data?.result?.message?.content?.trim() || data?.message?.content?.trim() || data?.result?.content?.trim() || null;
  } catch (e) { console.error("[Puter AI] Error:", e); return null; }
}

/**
 * Call AI via Groq using the USER's key.
 */
async function callGroqAI(messages: any[], key: string, model?: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: model || "meta-llama/llama-4-scout-17b-16e-instruct",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });
    if (!res.ok) { console.error("[Groq AI]", await res.text()); return null; }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) { console.error("[Groq AI] Error:", e); return null; }
}

/**
 * Generate an AI reply using the user's own API keys.
 * Tries: User's Puter → User's Groq → .env fallback → smart template
 */
export async function generateAIReply(
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  userKeys?: AIKeys
): Promise<string> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.slice(-10),
  ];

  // 1. Try user's Puter token
  if (userKeys?.puterToken) {
    const reply = await callPuterAI(messages, userKeys.puterToken);
    if (reply) return reply;
  }

  // 2. Try user's Groq key
  if (userKeys?.groqKey) {
    const reply = await callGroqAI(messages, userKeys.groqKey);
    if (reply) return reply;
  }

  // 3. Try global .env fallback (platform-level keys)
  if (process.env.PUTER_API_TOKEN) {
    const reply = await callPuterAI(messages, process.env.PUTER_API_TOKEN);
    if (reply) return reply;
  }
  if (process.env.GROQ_API_KEY) {
    const reply = await callGroqAI(messages, process.env.GROQ_API_KEY);
    if (reply) return reply;
  }

  // 4. Smart fallback
  const lastMsg = conversationHistory[conversationHistory.length - 1]?.content || "";
  return getSmartFallback(lastMsg);
}

/**
 * Generate an AI reply with image understanding (vision).
 */
export async function generateVisionReply(
  systemPrompt: string,
  imageUrl: string,
  caption?: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[],
  userKeys?: AIKeys
): Promise<string> {
  const userContent: any[] = [
    { type: "image_url", image_url: { url: imageUrl } },
  ];
  userContent.unshift({
    type: "text",
    text: caption || "Customer sent this product image. Analyze it and check if any product in our catalog matches. Describe what you see and suggest the closest matching product with its price. If no match, say so politely.",
  });

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...(conversationHistory || []).slice(-6),
    { role: "user", content: userContent },
  ];

  // Try user's keys first, then .env
  if (userKeys?.puterToken) {
    const reply = await callPuterAI(messages, userKeys.puterToken);
    if (reply) return reply;
  }
  if (userKeys?.groqKey) {
    const reply = await callGroqAI(messages, userKeys.groqKey, "llama-3.2-90b-vision-preview");
    if (reply) return reply;
  }
  if (process.env.PUTER_API_TOKEN) {
    const reply = await callPuterAI(messages, process.env.PUTER_API_TOKEN);
    if (reply) return reply;
  }
  if (process.env.GROQ_API_KEY) {
    const reply = await callGroqAI(messages, process.env.GROQ_API_KEY, "llama-3.2-90b-vision-preview");
    if (reply) return reply;
  }

  return "I received your image! Let me check our catalog. One moment please... 📸";
}

/**
 * Smart fallback that matches the customer's language.
 */
function getSmartFallback(lastMessage: string): string {
  const hasBangla = /[\u0980-\u09FF]/.test(lastMessage);
  const banglishWords = ["bhai", "vai", "dam", "koto", "ase", "nai", "diben", "bolun", "achen", "nibo", "chai"];
  const isBanglish = banglishWords.some(w => lastMessage.toLowerCase().includes(w));

  if (hasBangla) return "আপনার মেসেজ পেয়েছি! আমাদের টিমকে জানাচ্ছি, একটু অপেক্ষা করুন। 🙏";
  if (isBanglish) return "Apnar message peyechi! Ami check kore janacchi, ektu wait korun. 🙏";
  return "Thank you for your message! Let me check and get back to you shortly. 🙏";
}

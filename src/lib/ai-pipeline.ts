// ==================== AI Reply Pipeline ====================
// Builds context from products + conversation history, generates AI replies

import type { Product } from "./types";

/**
 * Build a system prompt from the seller's product catalog.
 * This is injected as context so the AI can answer product questions accurately.
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
export function buildSystemPrompt(products: Product[], sellerName?: string): string {
  const productCatalog = buildProductContext(products);
  const seller = sellerName || "the seller";

  return `You are an AI sales assistant for ${seller}'s Facebook Page. You reply to customer messages on Messenger.

RULES:
1. Be friendly, natural, and helpful — like a real Bangladeshi shop assistant.
2. Reply in the SAME language the customer uses. If they write in Banglish, reply in Banglish. If Bangla, reply in Bangla. If English, reply in English.
3. Keep replies SHORT (1-3 sentences max). Messenger is chat, not email.
4. ALWAYS use the product database below for prices, stock, and details. NEVER guess or make up prices.
5. If a product is out of stock, say so honestly and suggest alternatives if available.
6. If the customer seems ready to order, ask for: Name, Phone Number, Address, and which product/variant they want.
7. If you genuinely don't know the answer or the question is outside your product knowledge, say "Apnake ektu wait korte hobe, ami confirm kore janacchi" and the system will flag it for human review.
8. Never reveal that you are an AI. Act as a helpful team member.
9. For delivery questions, use the delivery info from the product database.
10. If someone asks "last price" or tries to bargain, politely say the price is fixed unless the seller has set a discount.

PRODUCT CATALOG:
${productCatalog}

Remember: You are selling. Be persuasive but honest. Your goal is to convert conversations into orders.`;
}

/**
 * Detect the customer's buying intent from a message.
 * Returns a confidence score and intent level.
 */
export function detectIntent(message: string): {
  level: "hot" | "warm" | "cold";
  confidence: number;
  shouldFlagHuman: boolean;
} {
  const lower = message.toLowerCase();

  // Hot signals — ready to buy
  const hotKeywords = [
    "order", "নিবো", "নিব", "nibo", "nib", "confirm", "কনফার্ম",
    "address", "ঠিকানা", "phone", "ফোন", "payment", "পেমেন্ট",
    "bkash", "বিকাশ", "cod", "ক্যাশ", "cash on delivery",
    "কিনবো", "kinbo", "buy", "take", "চাই", "chai", "diben", "দিবেন",
  ];

  // Warm signals — interested
  const warmKeywords = [
    "price", "দাম", "dam", "koto", "কত", "কতো", "size", "সাইজ",
    "color", "কালার", "রং", "delivery", "ডেলিভারি", "stock", "স্টক",
    "available", "আছে", "ase", "ache",
  ];

  // Human escalation signals
  const humanKeywords = [
    "manager", "owner", "complaint", "refund", "return", "রিটার্ন",
    "problem", "সমস্যা", "broken", "ভাঙা", "wrong", "ভুল",
  ];

  const hotMatch = hotKeywords.some((k) => lower.includes(k));
  const warmMatch = warmKeywords.some((k) => lower.includes(k));
  const humanMatch = humanKeywords.some((k) => lower.includes(k));

  if (hotMatch) {
    return { level: "hot", confidence: 0.85 + Math.random() * 0.1, shouldFlagHuman: false };
  }
  if (humanMatch) {
    return { level: "warm", confidence: 0.5, shouldFlagHuman: true };
  }
  if (warmMatch) {
    return { level: "warm", confidence: 0.6 + Math.random() * 0.2, shouldFlagHuman: false };
  }
  return { level: "cold", confidence: 0.3 + Math.random() * 0.2, shouldFlagHuman: false };
}

/**
 * Call the AI model via Puter.js REST API (server-side).
 * Uses the same free AI that the client-side Puter SDK provides.
 */
export async function generateAIReply(
  systemPrompt: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const puterToken = process.env.PUTER_API_TOKEN;

  if (!puterToken) {
    console.warn("[AI Pipeline] PUTER_API_TOKEN not set — using fallback reply");
    return "Assalamu Alaikum! Apnar message peyechi. Ektu wait korun, ami details janacchi. 🙏";
  }

  try {
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
    ];

    const res = await fetch("https://api.puter.com/drivers/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${puterToken}`,
      },
      body: JSON.stringify({
        interface: "puter-chat-completion",
        driver: "openai-completion",
        method: "complete",
        args: {
          messages,
          model: "gpt-4o-mini",
          max_tokens: 200,
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[AI Pipeline] Puter API error:", errText);
      return "Apnake ektu wait korte hobe, ami confirm kore janacchi. 🙏";
    }

    const data = await res.json();
    const reply =
      data?.result?.message?.content?.trim() ||
      data?.message?.content?.trim() ||
      data?.result?.content?.trim() ||
      "";

    if (reply) return reply;

    console.warn("[AI Pipeline] Empty reply from Puter, using fallback");
    return "Ektu wait korun please. 🙏";
  } catch (err) {
    console.error("[AI Pipeline] Error:", err);
    return "Apnake ektu wait korte hobe, ami confirm kore janacchi. 🙏";
  }
}

/**
 * Call the AI model with an image (vision mode).
 * GPT-4o-mini supports vision natively — we send the image URL
 * alongside text so the AI can analyze product images sent by customers.
 */
export async function generateVisionReply(
  systemPrompt: string,
  imageUrl: string,
  caption?: string,
  conversationHistory?: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const puterToken = process.env.PUTER_API_TOKEN;

  if (!puterToken) {
    console.warn("[AI Pipeline] PUTER_API_TOKEN not set — using fallback for image");
    return "Apnar image peyechi! Ektu wait korun, ami check kore janacchi. 🙏";
  }

  try {
    // Build the user message with image + optional caption
    const userContent: any[] = [
      {
        type: "image_url",
        image_url: { url: imageUrl },
      },
    ];

    if (caption) {
      userContent.unshift({ type: "text", text: caption });
    } else {
      userContent.unshift({
        type: "text",
        text: "Customer sent this product image. Analyze it and check if any product in our catalog matches. Describe what you see and suggest the closest matching product with its price. If no match, say so politely.",
      });
    }

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).slice(-6),
      { role: "user", content: userContent },
    ];

    const res = await fetch("https://api.puter.com/drivers/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${puterToken}`,
      },
      body: JSON.stringify({
        interface: "puter-chat-completion",
        driver: "openai-completion",
        method: "complete",
        args: {
          messages,
          model: "gpt-4o-mini",
          max_tokens: 300,
          temperature: 0.7,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[AI Pipeline] Vision error:", errText);
      return "Apnar image peyechi! Ektu wait korun, ami check korchi. 🙏";
    }

    const data = await res.json();
    const reply =
      data?.result?.message?.content?.trim() ||
      data?.message?.content?.trim() ||
      data?.result?.content?.trim() ||
      "";

    if (reply) return reply;
    return "Image ta dekhchi, ektu wait korun. 🙏";
  } catch (err) {
    console.error("[AI Pipeline] Vision error:", err);
    return "Apnar image peyechi! Ektu wait korun, ami check korchi. 🙏";
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getUserSettings } from "@/lib/server-store";

export const maxDuration = 60; // Allow more time for Vision AI

async function callVisionAPI(messages: any[], puterToken?: string, groqKey?: string): Promise<string | null> {
  // Try Puter first
  if (puterToken || process.env.PUTER_API_TOKEN) {
    const token = puterToken || process.env.PUTER_API_TOKEN;
    try {
      const res = await fetch("https://api.puter.com/drivers/call", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          interface: "puter-chat-completion",
          driver: "openai-completion",
          method: "complete",
          args: { messages, model: "gpt-4o", max_tokens: 1500, temperature: 0.1 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.result?.message?.content || data?.message?.content || data?.result?.content;
        if (content) return content.trim();
      } else {
        console.error("[Vision API] Puter Error:", await res.text());
      }
    } catch (e) {
      console.error("[Vision API] Puter Exception:", e);
    }
  }

  // Try Groq as fallback
  if (groqKey || process.env.GROQ_API_KEY) {
    const key = groqKey || process.env.GROQ_API_KEY;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: "llama-3.2-90b-vision-preview",
          messages,
          max_tokens: 1500,
          temperature: 0.1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) return content.trim();
      } else {
        console.error("[Vision API] Groq Error:", await res.text());
      }
    } catch (e) {
      console.error("[Vision API] Groq Exception:", e);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { image, tenant_id } = await request.json();

    if (!image || !tenant_id) {
      return NextResponse.json({ error: "image and tenant_id required" }, { status: 400 });
    }

    const settings = await getUserSettings(tenant_id);

    const prompt = `You are a strict data extractor. Look at the provided image (menu/catalog/screenshot) and extract all products/items.
Return ONLY a valid JSON array of objects. Do not include any markdown formatting like \`\`\`json.
Each object MUST have the following keys:
- "name": string (the product name)
- "description": string (short description or ingredients, empty string if none)
- "price": string (exact price with currency, e.g. "150 Tk" or "$5.99")
- "stock_status": string (must be exactly "in_stock")

Example:
[
  { "name": "Burger", "description": "Beef patty with cheese", "price": "250 Tk", "stock_status": "in_stock" }
]

Output ONLY the JSON array and nothing else.`;

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: image } }
        ]
      }
    ];

    const reply = await callVisionAPI(
      messages,
      settings?.puter_api_token || undefined,
      settings?.groq_api_key || undefined
    );

    if (!reply) {
      throw new Error("Vision AI failed to respond.");
    }

    // Strip markdown formatting if the model ignored instructions
    let jsonString = reply.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7);
    }
    if (jsonString.startsWith("```")) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const products = JSON.parse(jsonString);

    if (!Array.isArray(products)) {
      throw new Error("AI did not return an array.");
    }

    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    console.error("[Extract API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

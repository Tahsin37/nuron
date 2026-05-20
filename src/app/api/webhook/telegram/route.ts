// ==================== Telegram Bot Webhook ====================
// POST → Incoming messages from Telegram Bot
// Supports: text messages, photo messages (vision AI), commands

import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, detectIntent, generateAIReply, generateVisionReply } from "@/lib/ai-pipeline";
import {
  getProductsByUser,
  getOrCreateConversation,
  appendMessage,
  flagConversation,
  getConversationHistory,
  createLead,
} from "@/lib/server-store";

const TELEGRAM_API = "https://api.telegram.org/bot";

// ─── Telegram Helpers ───
async function sendTelegramMessage(chatId: number | string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("[Telegram] BOT_TOKEN not set");
    return false;
  }

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[Telegram] Send failed:", JSON.stringify(err));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Telegram] Network error:", err);
    return false;
  }
}

async function sendTypingAction(chatId: number | string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetch(`${TELEGRAM_API}${token}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
  } catch {
    // Best-effort
  }
}

/**
 * Get a public URL for a Telegram file (photo, document, etc.)
 */
async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const filePath = data?.result?.file_path;
    if (!filePath) return null;

    return `https://api.telegram.org/file/bot${token}/${filePath}`;
  } catch {
    return null;
  }
}

// ─── POST: Incoming Telegram Updates ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message;

    if (!message?.from) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const chatId = message.chat.id;
    const senderId = String(message.from.id);
    const senderName = [message.from.first_name, message.from.last_name].filter(Boolean).join(" ") || "User";

    // ─── Handle Photo Messages (Vision AI) ───
    if (message.photo && message.photo.length > 0) {
      return await handlePhotoMessage(chatId, senderId, senderName, message);
    }

    // ─── Handle Text Messages ───
    if (!message.text) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const customerMessage = message.text;

    // Handle /start command
    if (customerMessage === "/start") {
      await sendTelegramMessage(
        chatId,
        "👋 Assalamu Alaikum! Welcome to our shop.\n\nJust type your question — like:\n• <b>price?</b>\n• <b>কত দাম?</b>\n• <b>size available?</b>\n• <b>delivery charge koto?</b>\n\n📸 You can also <b>send a product image</b> — our AI will identify it and find the matching product!\n\nOur AI will answer instantly! 🚀"
      );
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // Handle /products command
    if (customerMessage === "/products") {
      const userId = await getSellerUserId();
      const products = await getProductsByUser(userId);

      if (products.length === 0) {
        await sendTelegramMessage(chatId, "📦 No products available right now. Check back soon!");
      } else {
        const catalog = products.slice(0, 10).map((p, i) => {
          let line = `${i + 1}. <b>${p.name}</b> — ${p.price}`;
          if (p.stock_status === "out_of_stock") line += " ❌ Out of stock";
          if (p.discount) line += ` (${p.discount})`;
          return line;
        }).join("\n");
        await sendTelegramMessage(chatId, `📦 <b>Our Products:</b>\n\n${catalog}\n\nAsk about any product for more details!`);
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ─── Regular text message → AI reply ───
    console.log(`[Telegram] 📩 ${senderName}: "${customerMessage}"`);
    return await handleTextMessage(chatId, senderId, senderName, customerMessage);
  } catch (err) {
    console.error("[Telegram] Webhook error:", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// ─── Handle Text Messages ───
async function handleTextMessage(
  chatId: number | string,
  senderId: string,
  senderName: string,
  customerMessage: string
) {
  const userId = await getSellerUserId();
  const conversation = await getOrCreateConversation(userId, `tg_${senderId}`, senderName);
  if (!conversation) {
    await sendTelegramMessage(chatId, "Sorry, something went wrong. Please try again.");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await appendMessage(conversation.id, "user", customerMessage);

  if (conversation.status === "needs_human") {
    await sendTelegramMessage(chatId, "🙋 Your message has been forwarded to our team. They'll reply shortly!");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await sendTypingAction(chatId);

  const products = await getProductsByUser(userId);
  const history = await getConversationHistory(conversation.id);
  const systemPrompt = buildSystemPrompt(products, "our shop");
  const aiReply = await generateAIReply(systemPrompt, history);

  const sent = await sendTelegramMessage(chatId, aiReply);
  if (sent) {
    await appendMessage(conversation.id, "assistant", aiReply);
    console.log(`[Telegram] ✅ AI replied: "${aiReply.substring(0, 60)}..."`);
  }

  // Intent detection & lead capture
  const intent = detectIntent(customerMessage);
  if (intent.level === "hot" || intent.level === "warm") {
    await createLead({
      user_id: userId,
      name: senderName,
      product_interest: customerMessage.substring(0, 100),
      buying_intent: intent.level,
      source: "telegram",
    });
    console.log(`[Telegram] 🔥 Lead: ${senderName} (${intent.level})`);
  }
  if (intent.shouldFlagHuman) {
    await flagConversation(conversation.id, "needs_human");
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// ─── Handle Photo Messages (Vision AI) ───
async function handlePhotoMessage(
  chatId: number | string,
  senderId: string,
  senderName: string,
  message: any
) {
  console.log(`[Telegram] 📸 Photo from ${senderName}`);

  // Get the highest resolution photo (last in the array)
  const photos = message.photo;
  const bestPhoto = photos[photos.length - 1];
  const caption = message.caption || "";

  // Get the file URL from Telegram
  const imageUrl = await getTelegramFileUrl(bestPhoto.file_id);
  if (!imageUrl) {
    await sendTelegramMessage(chatId, "Sorry, I couldn't process that image. Try sending it again! 📸");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const userId = await getSellerUserId();
  const conversation = await getOrCreateConversation(userId, `tg_${senderId}`, senderName);
  if (!conversation) {
    await sendTelegramMessage(chatId, "Sorry, something went wrong. Please try again.");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Save that customer sent an image
  await appendMessage(conversation.id, "user", caption ? `[📸 Image] ${caption}` : "[📸 Customer sent a product image]");

  if (conversation.status === "needs_human") {
    await sendTelegramMessage(chatId, "🙋 Your image has been forwarded to our team!");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await sendTypingAction(chatId);

  // Load products & generate vision reply
  const products = await getProductsByUser(userId);
  const history = await getConversationHistory(conversation.id);
  const systemPrompt = buildSystemPrompt(products, "our shop");
  const aiReply = await generateVisionReply(systemPrompt, imageUrl, caption || undefined, history);

  const sent = await sendTelegramMessage(chatId, aiReply);
  if (sent) {
    await appendMessage(conversation.id, "assistant", aiReply);
    console.log(`[Telegram] ✅ Vision AI replied: "${aiReply.substring(0, 60)}..."`);
  }

  // Image messages are warm intent by default
  await createLead({
    user_id: userId,
    name: senderName,
    product_interest: caption || "Sent product image",
    buying_intent: "warm",
    source: "telegram",
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

// ─── Helper: Get the seller's user ID ───
async function getSellerUserId(): Promise<string> {
  const { supabase } = await import("@/lib/supabase");
  const { data } = await supabase
    .from("page_tokens")
    .select("user_id")
    .limit(1)
    .single();

  return data?.user_id || "test_user_mvp";
}

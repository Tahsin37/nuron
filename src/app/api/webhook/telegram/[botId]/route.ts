// ==================== Telegram Bot Webhook (Multi-Tenant) ====================
// Each user's bot has its own URL: /api/webhook/telegram/[botId]
// The botId tells us which user owns this bot → loads their products & AI keys

import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, detectIntent, generateAIReply, generateVisionReply } from "@/lib/ai-pipeline";
import type { AIKeys } from "@/lib/ai-pipeline";
import {
  getProductsByUser,
  getOrCreateConversation,
  appendMessage,
  flagConversation,
  getConversationHistory,
  createLead,
  getUserByBotId,
  getBotToken,
  getUserSettings,
  getKnowledgeBase,
} from "@/lib/server-store";

// ─── Telegram Helpers ───
async function sendTelegramMessage(botToken: string, chatId: number | string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) { console.error("[Telegram] Send failed:", await res.text()); return false; }
    return true;
  } catch (err) { console.error("[Telegram] Network error:", err); return false; }
}

async function sendTypingAction(botToken: string, chatId: number | string): Promise<void> {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });
  } catch { /* best-effort */ }
}

async function getTelegramFileUrl(botToken: string, fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const filePath = data?.result?.file_path;
    if (!filePath) return null;
    return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  } catch { return null; }
}

// ─── POST: Incoming Telegram Updates (per-bot) ───
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;

  try {
    // 1. Look up who owns this bot
    const userId = await getUserByBotId(botId);
    if (!userId) {
      console.warn(`[Telegram] Unknown bot ${botId} — no user found`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 2. Get the bot token so we can reply
    const botToken = await getBotToken(botId);
    if (!botToken) {
      console.error(`[Telegram] No token for bot ${botId}`);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // 3. Get the user's AI keys
    const settings = await getUserSettings(userId);
    const aiKeys: AIKeys = {
      puterToken: settings?.puter_api_token || undefined,
      groqKey: settings?.groq_api_key || undefined,
    };

    const body = await request.json();
    const message = body.message;

    if (!message?.from) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const chatId = message.chat.id;
    const senderId = String(message.from.id);
    const senderName = [message.from.first_name, message.from.last_name].filter(Boolean).join(" ") || "User";

    // ─── Photo messages ───
    if (message.photo && message.photo.length > 0) {
      return await handlePhotoMessage(botToken, userId, aiKeys, chatId, senderId, senderName, message, settings);
    }

    // ─── Text messages ───
    if (!message.text) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const customerMessage = message.text;

    // /start command
    if (customerMessage === "/start") {
      const shopName = settings?.business_name || "our shop";
      const customWelcome = settings?.welcome_message;
      const welcomeText = customWelcome
        ? customWelcome.replace('{name}', senderName).replace('{shop}', shopName)
        : `👋 Hey ${senderName}! Welcome to <b>${shopName}</b>.\nAsk me anything about our products — prices, sizes, colors, stock, delivery. You can also send a product photo and I'll find it for you! 📸`;
      await sendTelegramMessage(botToken, chatId, welcomeText);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // /products command
    if (customerMessage === "/products") {
      const products = await getProductsByUser(userId);
      if (products.length === 0) {
        await sendTelegramMessage(botToken, chatId, "📦 No products available right now. Check back soon!");
      } else {
        const catalog = products.slice(0, 10).map((p, i) => {
          let line = `${i + 1}. <b>${p.name}</b> — ${p.price}`;
          if (p.stock_status === "out_of_stock") line += " ❌ Out of stock";
          if (p.discount) line += ` (${p.discount})`;
          return line;
        }).join("\n");
        await sendTelegramMessage(botToken, chatId, `📦 <b>Our Products:</b>\n\n${catalog}\n\nAsk about any product for more details!`);
      }
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ─── Regular message → AI reply ───
    console.log(`[Telegram] 📩 Bot:${botId} User:${senderName}: "${customerMessage}"`);
    return await handleTextMessage(botToken, userId, aiKeys, chatId, senderId, senderName, customerMessage, settings);
  } catch (err) {
    console.error("[Telegram] Webhook error:", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

// ─── Handle Text Messages ───
async function handleTextMessage(
  botToken: string,
  userId: string,
  aiKeys: AIKeys,
  chatId: number | string,
  senderId: string,
  senderName: string,
  customerMessage: string,
  settings?: any
) {
  const conversation = await getOrCreateConversation(userId, `tg_${senderId}`, senderName);
  if (!conversation) {
    await sendTelegramMessage(botToken, chatId, "Sorry, something went wrong. Please try again.");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await appendMessage(conversation.id, "user", customerMessage);

  if (conversation.status === "needs_human") {
    await sendTelegramMessage(botToken, chatId, "🙋 Your message has been forwarded to our team. They'll reply shortly!");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await sendTypingAction(botToken, chatId);

  const products = await getProductsByUser(userId);
  const history = await getConversationHistory(conversation.id);
  const knowledgeEntries = await getKnowledgeBase(userId);
  const systemPrompt = buildSystemPrompt(
    products,
    settings?.business_name || "our shop",
    settings?.business_description,
    settings?.training_data,
    knowledgeEntries,
    settings?.welcome_message
  );
  const aiReply = await generateAIReply(systemPrompt, history, aiKeys);

  const sent = await sendTelegramMessage(botToken, chatId, aiReply);
  if (sent) {
    await appendMessage(conversation.id, "assistant", aiReply);
    console.log(`[Telegram] ✅ AI → ${senderName}: "${aiReply.substring(0, 60)}..."`);
  }

  const intent = detectIntent(customerMessage);
  if (intent.level === "hot" || intent.level === "warm") {
    await createLead({ user_id: userId, name: senderName, product_interest: customerMessage.substring(0, 100), buying_intent: intent.level, source: "telegram" });
  }
  if (intent.shouldFlagHuman) {
    await flagConversation(conversation.id, "needs_human");
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

// ─── Handle Photo Messages ───
async function handlePhotoMessage(
  botToken: string,
  userId: string,
  aiKeys: AIKeys,
  chatId: number | string,
  senderId: string,
  senderName: string,
  message: any,
  settings?: any
) {
  const photos = message.photo;
  const bestPhoto = photos[photos.length - 1];
  const caption = message.caption || "";

  const imageUrl = await getTelegramFileUrl(botToken, bestPhoto.file_id);
  if (!imageUrl) {
    await sendTelegramMessage(botToken, chatId, "Sorry, I couldn't process that image. Try sending it again! 📸");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const conversation = await getOrCreateConversation(userId, `tg_${senderId}`, senderName);
  if (!conversation) {
    await sendTelegramMessage(botToken, chatId, "Sorry, something went wrong.");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await appendMessage(conversation.id, "user", caption ? `[📸 Image] ${caption}` : "[📸 Customer sent a product image]");

  if (conversation.status === "needs_human") {
    await sendTelegramMessage(botToken, chatId, "🙋 Your image has been forwarded to our team!");
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await sendTypingAction(botToken, chatId);

  const products = await getProductsByUser(userId);
  const history = await getConversationHistory(conversation.id);
  const systemPrompt = buildSystemPrompt(products, settings?.business_name || "our shop", settings?.business_description, settings?.training_data);
  const aiReply = await generateVisionReply(systemPrompt, imageUrl, caption || undefined, history, aiKeys);

  const sent = await sendTelegramMessage(botToken, chatId, aiReply);
  if (sent) {
    await appendMessage(conversation.id, "assistant", aiReply);
  }

  await createLead({ user_id: userId, name: senderName, product_interest: caption || "Sent product image", buying_intent: "warm", source: "telegram" });

  return NextResponse.json({ ok: true }, { status: 200 });
}

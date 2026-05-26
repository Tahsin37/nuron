// ==================== Connect Telegram Bot API ====================
// POST: User saves their Telegram bot token → we register the webhook
// GET: Check connection status

import { NextRequest, NextResponse } from "next/server";
import { saveBotConnection, getBotConnections, saveUserSettings, getUserSettings } from "@/lib/server-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, bot_token, puter_api_token, groq_api_key, business_name, business_description, training_data, welcome_message, disconnect_bot_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // ─── Disconnect a bot ───
    if (disconnect_bot_id) {
      const { supabase } = await import("@/lib/supabase");
      // Get the bot's token to remove webhook
      const { data: conn } = await supabase.from("bot_connections").select("bot_token").eq("bot_id", disconnect_bot_id).eq("user_id", user_id).single();
      if (conn?.bot_token) {
        await fetch(`https://api.telegram.org/bot${conn.bot_token}/deleteWebhook`).catch(() => {});
      }
      await supabase.from("bot_connections").delete().eq("bot_id", disconnect_bot_id).eq("user_id", user_id);
      return NextResponse.json({ success: true, message: "Bot disconnected" });
    }

    // ─── Save AI keys + business info ───
    const hasSettings = puter_api_token || groq_api_key || business_name || business_description !== undefined || training_data !== undefined || welcome_message !== undefined;
    if (hasSettings) {
      await saveUserSettings(user_id, {
        ...(puter_api_token && { puter_api_token }),
        ...(groq_api_key && { groq_api_key }),
        ...(business_name && { business_name }),
        ...(business_description !== undefined && { business_description }),
        ...(training_data !== undefined && { training_data }),
        ...(welcome_message !== undefined && { welcome_message }),
      });
    }

    // ─── Connect Telegram bot ───
    if (bot_token) {
      // 1. Verify the token is valid by calling Telegram getMe
      const meRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
      if (!meRes.ok) {
        return NextResponse.json({ error: "Invalid Telegram bot token. Check it in @BotFather." }, { status: 400 });
      }
      const meData = await meRes.json();
      const botInfo = meData.result;
      const botId = String(botInfo.id);
      const botName = botInfo.username || botInfo.first_name || "Bot";

      // 2. Figure out our webhook URL
      const host = request.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      const webhookUrl = `${protocol}://${host}/api/webhook/telegram/${botId}`;

      // 3. Register the webhook with Telegram
      const whRes = await fetch(`https://api.telegram.org/bot${bot_token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      const whData = await whRes.json();

      if (!whData.ok) {
        return NextResponse.json({
          error: "Failed to register webhook with Telegram",
          details: whData.description,
          hint: "Make sure your app is deployed to a public HTTPS URL (not localhost)",
        }, { status: 400 });
      }

      // 4. Save the bot connection in Supabase
      await saveBotConnection({
        user_id,
        platform: "telegram",
        bot_id: botId,
        bot_token: bot_token,
        bot_name: botName,
        webhook_url: webhookUrl,
        status: "active",
      });

      return NextResponse.json({
        success: true,
        bot: { id: botId, name: botName, username: botInfo.username },
        webhook_url: webhookUrl,
        message: `✅ Bot @${botInfo.username} connected! Customers can now message it.`,
      });
    }

    return NextResponse.json({ success: true, message: "Settings saved" });
  } catch (err: any) {
    console.error("[Connect API] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const settings = await getUserSettings(userId);
  const bots = await getBotConnections(userId, "telegram");

  return NextResponse.json({
    settings: {
      business_name: settings?.business_name || "",
      business_description: settings?.business_description || "",
      training_data: settings?.training_data || "",
      welcome_message: (settings as any)?.welcome_message || "",
      has_puter_token: !!settings?.puter_api_token,
      has_groq_key: !!settings?.groq_api_key,
    },
    bots: bots.map((b) => ({
      id: b.bot_id,
      name: b.bot_name,
      platform: b.platform,
      status: b.status,
      webhook_url: b.webhook_url,
    })),
  });
}

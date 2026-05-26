// ==================== Channel Connections API ====================
// GET: List connected channels for a user
// POST: Connect a channel (Messenger/WhatsApp)
// DELETE: Disconnect a channel

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("channel_connections")
    .select("*")
    .eq("tenant_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connections: data || [] });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, channel, access_token, page_id, page_name, session_data } = body;

    if (!user_id || !channel) {
      return NextResponse.json({ error: "user_id and channel required" }, { status: 400 });
    }

    // Upsert the connection
    const { data, error } = await supabase
      .from("channel_connections")
      .upsert({
        tenant_id: user_id,
        channel,
        access_token: access_token || null,
        page_id: page_id || null,
        page_name: page_name || null,
        session_data: session_data || null,
        status: "connected",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "tenant_id,channel",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If Messenger, also create a bot_connection entry for webhook routing
    if (channel === "messenger" && page_id) {
      await supabase.from("bot_connections").upsert({
        user_id,
        platform: "messenger",
        bot_id: page_id,
        bot_name: page_name || "Messenger Page",
        bot_token: access_token,
        status: "active",
      }, { onConflict: "platform,bot_id" });
    }

    return NextResponse.json({ success: true, connection: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user_id, channel } = await request.json();
    if (!user_id || !channel) {
      return NextResponse.json({ error: "user_id and channel required" }, { status: 400 });
    }

    // Delete channel connection
    await supabase.from("channel_connections").delete()
      .eq("tenant_id", user_id).eq("channel", channel);

    // If Messenger, also remove the bot_connection
    if (channel === "messenger") {
      await supabase.from("bot_connections").delete()
        .eq("user_id", user_id).eq("platform", "messenger");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

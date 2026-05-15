import { NextRequest, NextResponse } from "next/server";

// Public API: returns agent widget configuration
// This would normally query Supabase, but for now uses a static response
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const { agentId } = await params;

  if (!agentId) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
  }

  // In production, fetch from Supabase with RLS
  // For now, return a generic widget config
  const widgetConfig = {
    agent_id: agentId,
    agent_name: "Nuron AI Agent",
    welcome_message: "Hi! 👋 How can I help you today?",
    primary_color: "#ffffff",
    position: "bottom-right",
    avatar_url: null,
    powered_by: "Nuron AI",
  };

  return NextResponse.json(widgetConfig, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

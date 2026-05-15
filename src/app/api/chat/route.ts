import { NextRequest, NextResponse } from "next/server";

// Chat API endpoint — proxies to Puter.js on the client side
// In production, this would handle server-side AI calls with rate limiting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, agentId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
    }

    // In production:
    // 1. Validate agentId exists
    // 2. Fetch agent config from Supabase
    // 3. Build system prompt from training data + personality
    // 4. Call AI model (Puter.js or direct OpenAI)
    // 5. Log conversation
    // 6. Check for lead capture triggers

    // For now, return a placeholder indicating client-side Puter.js should be used
    return NextResponse.json({
      message: "Use client-side Puter.js for AI chat. This endpoint is reserved for future server-side processing.",
      agent_id: agentId,
    }, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

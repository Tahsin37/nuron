// POST: Add a manual reply to a conversation

import { NextRequest, NextResponse } from "next/server";
import { appendMessage, flagConversation } from "@/lib/server-store";

export async function POST(request: NextRequest) {
  try {
    const { conversation_id, content } = await request.json();
    if (!conversation_id || !content) {
      return NextResponse.json({ error: "conversation_id and content required" }, { status: 400 });
    }
    await appendMessage(conversation_id, "assistant", content);
    await flagConversation(conversation_id, "resolved");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

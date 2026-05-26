// POST: Add a manual reply to a conversation OR update its status

import { NextRequest, NextResponse } from "next/server";
import { appendMessage, flagConversation } from "@/lib/server-store";

export async function POST(request: NextRequest) {
  try {
    const { conversation_id, content, new_status } = await request.json();
    if (!conversation_id) {
      return NextResponse.json({ error: "conversation_id required" }, { status: 400 });
    }

    // Status-only update (Take Over / Resume AI / Resolve / Reopen)
    if (new_status) {
      await flagConversation(conversation_id, new_status);
      return NextResponse.json({ success: true, status: new_status });
    }

    // Manual reply
    if (!content) {
      return NextResponse.json({ error: "content or new_status required" }, { status: 400 });
    }
    await appendMessage(conversation_id, "assistant", content);
    // Don't auto-resolve on manual reply — let the user decide
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

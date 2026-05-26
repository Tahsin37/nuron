// ==================== Knowledge Base API ====================
// GET: List knowledge entries for a user
// POST: Create/update a knowledge entry
// DELETE: Remove a knowledge entry

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data || [] });
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, id, title, content, category, is_active } = await request.json();
    if (!user_id || !title || !content) {
      return NextResponse.json({ error: "user_id, title, and content required" }, { status: 400 });
    }

    if (id) {
      // Update existing
      const { error } = await supabase.from("knowledge_base").update({
        title, content, category: category || "general",
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      }).eq("id", id).eq("user_id", user_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Updated" });
    } else {
      // Create new
      const { data, error } = await supabase.from("knowledge_base").insert({
        user_id, title, content, category: category || "general", is_active: true,
      }).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, entry: data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user_id, id } = await request.json();
  if (!user_id || !id) return NextResponse.json({ error: "user_id and id required" }, { status: 400 });

  const { error } = await supabase.from("knowledge_base").delete().eq("id", id).eq("user_id", user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

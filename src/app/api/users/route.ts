import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// POST /api/users — saves user profile to YOUR Supabase database
// Called after Puter signup + profile completion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { puter_uuid, username, full_name, email, company } = body;

    // Validate required fields
    if (!puter_uuid || !email || !full_name) {
      return NextResponse.json({ error: "Missing required fields: puter_uuid, email, full_name" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Sanitize inputs
    const sanitized = {
      puter_uuid: puter_uuid.trim().slice(0, 100),
      username: (username || "").trim().slice(0, 100),
      full_name: full_name.trim().slice(0, 200),
      email: email.trim().toLowerCase().slice(0, 255),
      company: (company || "").trim().slice(0, 200),
    };

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      // Supabase not configured yet — log to console and return success
      // This lets the app work without Supabase during development
      console.log("[Nuron AI] New user signup (Supabase not configured):", sanitized);
      return NextResponse.json({ success: true, stored: "console" });
    }

    // Upsert — insert or update if user already exists (by puter_uuid)
    const { error } = await supabase
      .from("users")
      .upsert(
        {
          puter_uuid: sanitized.puter_uuid,
          username: sanitized.username,
          full_name: sanitized.full_name,
          email: sanitized.email,
          company: sanitized.company,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "puter_uuid" }
      );

    if (error) {
      console.error("[Nuron AI] Supabase insert error:", error);
      // Don't block the user — signup still works, just not saved to DB
      return NextResponse.json({ success: true, stored: "failed", error: error.message });
    }

    return NextResponse.json({ success: true, stored: "supabase" });
  } catch (err) {
    console.error("[Nuron AI] API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/users — returns user count (for admin/landing page)
export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ count: 0, configured: false });
  }

  try {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ count: 0, error: error.message });
    }

    return NextResponse.json({ count: count || 0, configured: true });
  } catch {
    return NextResponse.json({ count: 0, error: "Failed to fetch" });
  }
}

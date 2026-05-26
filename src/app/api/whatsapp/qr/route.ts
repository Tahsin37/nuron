// ==================== WhatsApp QR Proxy ====================
// Proxies requests to the Railway WhatsApp worker so the
// browser never makes a cross-origin request (avoids CORS).
// Also keeps the RAILWAY_URL server-side only.

import { NextRequest, NextResponse } from "next/server";

const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_URL || process.env.RAILWAY_URL || "";

/**
 * POST /api/whatsapp/qr
 * Body: { action: "generate", tenant_id } → generate QR
 * Body: { action: "status", tenant_id }   → poll status
 * Body: { action: "disconnect", tenant_id } → disconnect
 */
export async function POST(request: NextRequest) {
  try {
    const { action, tenant_id } = await request.json();

    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id required" }, { status: 400 });
    }

    if (!RAILWAY_URL) {
      return NextResponse.json(
        { error: "RAILWAY_URL not configured. Set NEXT_PUBLIC_RAILWAY_URL in your .env" },
        { status: 500 }
      );
    }

    // ── Generate QR ──
    if (action === "generate") {
      const res = await fetch(`${RAILWAY_URL}/api/whatsapp/generate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return NextResponse.json(
          { error: `Worker returned ${res.status}`, detail: text.substring(0, 200) },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    // ── Poll Status ──
    if (action === "status") {
      const res = await fetch(`${RAILWAY_URL}/api/whatsapp/status?tenant_id=${tenant_id}`);

      if (!res.ok) {
        return NextResponse.json({ status: "polling", error: `Worker returned ${res.status}` });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    // ── Disconnect ──
    if (action === "disconnect") {
      const res = await fetch(`${RAILWAY_URL}/api/whatsapp/disconnect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id }),
      });

      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Invalid action. Use: generate, status, disconnect" }, { status: 400 });
  } catch (err: any) {
    console.error("[WhatsApp QR Proxy] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to reach WhatsApp worker" },
      { status: 502 }
    );
  }
}

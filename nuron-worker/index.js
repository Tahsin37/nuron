// ==================== Nuron AI Worker ====================
// Railway Microservice for WhatsApp & Messenger integration
// Manages persistent WhatsApp sessions via whatsapp-web.js
// and bridges messages to the main Next.js app's AI engine
// ==========================================================

const express = require("express");
const cors = require("cors");
const { Client, LocalAuth } = require("whatsapp-web.js");
const QRCode = require("qrcode");
const cron = require("node-cron");
const { runSheetsSync } = require("./services/sheets-sync");
const { runAbandonedCartProcessor } = require("./services/abandoned-cart");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MAIN_APP_URL = process.env.MAIN_APP_URL || "https://nuron-ai.vercel.app";

// ─── In-Memory Session Store (per tenant) ───
// In production, persist to Redis or filesystem
const sessions = new Map(); // tenant_id → { client, qr, status, phone }

// ─── Health Check ───
app.get("/", (req, res) => {
  res.json({
    service: "Nuron AI Worker",
    version: "1.0.0",
    activeSessions: sessions.size,
    uptime: Math.floor(process.uptime()),
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", sessions: sessions.size });
});

// ═══════════════════════════════════════════════
// WhatsApp Endpoints
// ═══════════════════════════════════════════════

/**
 * POST /api/whatsapp/generate-qr
 * Creates a new WhatsApp client for the tenant and returns a QR code.
 */
app.post("/api/whatsapp/generate-qr", async (req, res) => {
  const { tenant_id } = req.body;
  if (!tenant_id) {
    return res.status(400).json({ error: "tenant_id required" });
  }

  // Check if already connected
  const existing = sessions.get(tenant_id);
  if (existing && existing.status === "connected") {
    return res.json({ status: "connected", phone: existing.phone });
  }

  // Clean up old session if exists
  if (existing && existing.client) {
    try { await existing.client.destroy(); } catch {}
    sessions.delete(tenant_id);
  }

  console.log(`[WhatsApp] Initializing client for tenant: ${tenant_id}`);

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: tenant_id }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--single-process",
        "--disable-gpu",
      ],
    },
  });

  const session = { client, qr: null, status: "initializing", phone: null };
  sessions.set(tenant_id, session);

  // QR Code event
  client.on("qr", async (qr) => {
    console.log(`[WhatsApp] QR generated for tenant: ${tenant_id}`);
    try {
      const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
      session.qr = qrDataUrl;
      session.status = "waiting_scan";
    } catch (err) {
      console.error("[WhatsApp] QR generation error:", err);
    }
  });

  // Ready event (authenticated)
  client.on("ready", () => {
    console.log(`[WhatsApp] ✅ Client ready for tenant: ${tenant_id}`);
    session.status = "connected";
    session.qr = null;
    session.phone = client.info?.wid?.user || null;
  });

  // Disconnected
  client.on("disconnected", (reason) => {
    console.log(`[WhatsApp] Disconnected for tenant ${tenant_id}: ${reason}`);
    session.status = "disconnected";
    sessions.delete(tenant_id);
  });

  // Authentication failure
  client.on("auth_failure", (msg) => {
    console.error(`[WhatsApp] Auth failure for tenant ${tenant_id}:`, msg);
    session.status = "error";
  });

  // Incoming messages → Bridge to main app
  client.on("message", async (message) => {
    if (message.fromMe) return;

    const senderPhone = message.from.replace("@c.us", "");
    const senderName = message._data?.notifyName || senderPhone;
    const text = message.body;

    if (!text) return;

    console.log(`[WhatsApp] 📩 ${senderName}: "${text.substring(0, 60)}"`);

    try {
      // POST to main app for AI processing
      const aiRes = await fetch(`${MAIN_APP_URL}/api/ai/process-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id,
          channel: "whatsapp",
          sender_id: senderPhone,
          sender_name: senderName,
          message: text,
        }),
      });

      const data = await aiRes.json();

      if (data.reply) {
        await message.reply(data.reply);
        console.log(`[WhatsApp] ✅ AI → ${senderName}: "${data.reply.substring(0, 60)}"`);
      }
    } catch (err) {
      console.error(`[WhatsApp] Bridge error for ${senderName}:`, err.message);
      // Fallback reply
      await message.reply("Thanks for your message! Our team will get back to you shortly.");
    }
  });

  // Initialize (non-blocking)
  client.initialize().catch((err) => {
    console.error(`[WhatsApp] Init error for tenant ${tenant_id}:`, err);
    session.status = "error";
  });

  // Wait a bit for QR to generate
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const currentSession = sessions.get(tenant_id);
  if (currentSession?.qr) {
    return res.json({ qr: currentSession.qr, status: "waiting_scan" });
  } else if (currentSession?.status === "connected") {
    return res.json({ status: "connected", phone: currentSession.phone });
  } else {
    return res.json({ status: currentSession?.status || "initializing", message: "QR code generating, poll /api/whatsapp/status" });
  }
});

/**
 * GET /api/whatsapp/status?tenant_id=xxx
 * Returns the current connection status + QR if available.
 */
app.get("/api/whatsapp/status", (req, res) => {
  const { tenant_id } = req.query;
  if (!tenant_id) {
    return res.status(400).json({ error: "tenant_id required" });
  }

  const session = sessions.get(tenant_id);
  if (!session) {
    return res.json({ status: "not_initialized" });
  }

  res.json({
    status: session.status,
    qr: session.qr,
    phone: session.phone,
  });
});

/**
 * POST /api/whatsapp/disconnect
 * Disconnect and destroy a WhatsApp session.
 */
app.post("/api/whatsapp/disconnect", async (req, res) => {
  const { tenant_id } = req.body;
  if (!tenant_id) {
    return res.status(400).json({ error: "tenant_id required" });
  }

  const session = sessions.get(tenant_id);
  if (session && session.client) {
    try {
      await session.client.destroy();
    } catch {}
  }
  sessions.delete(tenant_id);

  res.json({ success: true, message: "Session destroyed" });
});

// ═══════════════════════════════════════════════
// Messenger Webhook (Alternative Bridge)
// Can be used if you want Messenger traffic to
// route through Railway instead of directly to Vercel
// ═══════════════════════════════════════════════

app.get("/api/messenger/webhook", (req, res) => {
  const verifyToken = process.env.FB_VERIFY_TOKEN || "nuron_webhook_verify_2024";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[Messenger] ✅ Webhook verified");
    return res.status(200).send(challenge);
  }
  res.status(403).send("Verification failed");
});

app.post("/api/messenger/webhook", async (req, res) => {
  const body = req.body;
  if (body.object !== "page") {
    return res.status(200).json({ status: "ignored" });
  }

  // Forward the entire payload to the main app
  try {
    await fetch(`${MAIN_APP_URL}/api/webhook/messenger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[Messenger] Forward error:", err.message);
  }

  res.status(200).json({ status: "forwarded" });
});

// ═══════════════════════════════════════════════
// WhatsApp Send Endpoint (for abandoned cart)
// ═══════════════════════════════════════════════

app.post("/api/whatsapp/send", async (req, res) => {
  const { tenant_id, to, message } = req.body;
  if (!tenant_id || !to || !message) {
    return res.status(400).json({ error: "tenant_id, to, and message required" });
  }

  const session = sessions.get(tenant_id);
  if (!session || session.status !== "connected" || !session.client) {
    return res.status(404).json({ error: "No active WhatsApp session for this tenant" });
  }

  try {
    await session.client.sendMessage(to, message);
    res.json({ success: true, message: "Sent" });
  } catch (err) {
    console.error("[WhatsApp] Send error:", err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// ═══════════════════════════════════════════════
// Cron Jobs — Background Processing
// ═══════════════════════════════════════════════

// Google Sheets Inventory Sync — every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  try {
    await runSheetsSync();
  } catch (e) {
    console.error("[Cron] Sheets sync error:", e.message || e);
  }
});

// Abandoned Cart Re-engagement — every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  try {
    await runAbandonedCartProcessor();
  } catch (e) {
    console.error("[Cron] Abandoned cart error:", e.message || e);
  }
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`\n🚀 Nuron AI Worker running on port ${PORT}`);
  console.log(`   Main App: ${MAIN_APP_URL}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   📊 Cron: Sheets Sync (*/5 min), Abandoned Cart (*/30 min)\n`);
});


"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Smartphone, QrCode, Loader2, Wifi, WifiOff,
  RefreshCw, CheckCircle2, AlertTriangle, Scan, Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

type ConnectionStatus = "idle" | "loading" | "waiting_for_scan" | "connected" | "error";

interface ConnectWhatsAppCardProps {
  /** The Railway worker base URL. Falls back to env if not provided. */
  workerUrl?: string;
  /** Callback when connection succeeds */
  onConnected?: () => void;
}

export function ConnectWhatsAppCard({ workerUrl: propUrl, onConnected }: ConnectWhatsAppCardProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(120);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const workerUrl = propUrl || process.env.NEXT_PUBLIC_RAILWAY_URL || "";

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollRef.current = null;
    countdownRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const startQR = async () => {
    if (!user?.uuid || !workerUrl) {
      setStatus("error");
      setErrorMsg(workerUrl ? "Not authenticated." : "Worker URL not configured. Set NEXT_PUBLIC_RAILWAY_URL in your .env");
      return;
    }

    cleanup();
    setStatus("loading");
    setQrImage(null);
    setErrorMsg("");
    setCountdown(120);

    try {
      // POST to the worker's generate-qr endpoint
      const res = await fetch(`${workerUrl}/api/whatsapp/generate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: user.uuid }),
      });

      if (!res.ok) {
        throw new Error(`Worker returned ${res.status}`);
      }

      const data = await res.json();

      if (data.status === "connected") {
        setStatus("connected");
        onConnected?.();
        return;
      }

      if (data.qr) {
        setQrImage(data.qr);
        setStatus("waiting_for_scan");
        startPolling(user.uuid);
        startCountdown();
      } else if (data.status === "initializing") {
        // QR not ready yet — start polling for it
        setStatus("waiting_for_scan");
        startPolling(user.uuid);
        startCountdown();
      } else {
        throw new Error(data.error || "No QR code received");
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message || "Could not reach the WhatsApp worker. Is it running?");
    }
  };

  const startPolling = (tenantId: string) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        cleanup();
        setStatus("error");
        setErrorMsg("QR code expired. Please try again.");
        return;
      }
      try {
        const res = await fetch(`${workerUrl}/api/whatsapp/status?tenant_id=${tenantId}`);
        if (!res.ok) return; // ignore non-200, keep polling
        const data = await res.json();
        if (data.status === "connected") {
          cleanup();
          setQrImage(null);
          setStatus("connected");
          // Persist to our DB
          await fetch("/api/channels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: tenantId, channel: "whatsapp", session_data: data.session }),
          }).catch(() => {});
          onConnected?.();
        } else if (data.qr && data.qr !== qrImage) {
          setQrImage(data.qr); // QR refreshed
        }
      } catch {
        // ignore, keep polling
      }
    }, 3000);
  };

  const startCountdown = () => {
    setCountdown(120);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          cleanup();
          setStatus("error");
          setErrorMsg("QR code expired. Please try again.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Smartphone className="h-[18px] w-[18px] text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-white tracking-tight">WhatsApp</h3>
            <p className="text-[12px] text-gray-600 mt-0.5">Connect via QR code — like WhatsApp Web</p>
          </div>
        </div>
        {status === "connected" ? (
          <span className="text-[10px] uppercase font-medium tracking-widest px-2.5 py-1 rounded-[5px] bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5 border border-emerald-500/20">
            <Wifi className="h-3 w-3" /> Connected
          </span>
        ) : (
          <span className="text-[10px] uppercase font-medium tracking-widest px-2.5 py-1 rounded-[5px] bg-white/[0.04] text-gray-600 flex items-center gap-1.5 border border-white/[0.06]">
            <WifiOff className="h-3 w-3" /> Offline
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">

        {/* ─── IDLE ─── */}
        {status === "idle" && (
          <div className="space-y-5">
            <div className="rounded-[8px] bg-emerald-500/[0.04] border border-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] text-gray-300 leading-relaxed">
                    Click the button below to generate a secure QR code. Then open <strong className="text-white">WhatsApp → Linked Devices → Link a Device</strong> and scan it.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={startQR}
              className="w-full h-11 rounded-[8px] bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-500 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              <QrCode className="h-4 w-4" /> Generate QR Code
            </button>
          </div>
        )}

        {/* ─── LOADING ─── */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-medium text-gray-200">Generating secure code...</p>
              <p className="text-[11px] text-gray-600 mt-1">Connecting to WhatsApp servers</p>
            </div>
          </div>
        )}

        {/* ─── WAITING FOR SCAN ─── */}
        {status === "waiting_for_scan" && qrImage && (
          <div className="space-y-5">
            {/* QR Container */}
            <div className="flex justify-center">
              <div className="relative p-4 bg-white rounded-[12px] shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <img
                  src={qrImage}
                  alt="WhatsApp QR Code"
                  className="w-56 h-56 rounded-[6px]"
                  width={224}
                  height={224}
                />
                {/* Corner accents */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-[3px] border-l-[3px] border-emerald-500 rounded-tl-[4px]" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-[3px] border-r-[3px] border-emerald-500 rounded-tr-[4px]" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-[3px] border-l-[3px] border-emerald-500 rounded-bl-[4px]" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-[3px] border-r-[3px] border-emerald-500 rounded-br-[4px]" />
              </div>
            </div>

            {/* Status + Timer */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Scan className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="text-[13px] text-gray-300 font-medium">Waiting for scan</span>
              </div>
              <span className="text-[11px] text-gray-600 tabular-nums bg-white/[0.04] px-2 py-1 rounded-[5px] border border-white/[0.06] font-mono">
                {formatTime(countdown)}
              </span>
            </div>

            {/* Instructions */}
            <div className="rounded-[8px] bg-white/[0.02] border border-white/[0.05] p-4">
              <ol className="space-y-2.5 text-[12px] text-gray-500">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-px">1</span>
                  Open WhatsApp on your phone
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-px">2</span>
                  Go to <strong className="text-gray-300">Settings → Linked Devices</strong>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-px">3</span>
                  Tap <strong className="text-gray-300">Link a Device</strong> and scan this code
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* ─── CONNECTED ─── */}
        {status === "connected" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-white">WhatsApp Connected</p>
              <p className="text-[12px] text-gray-500 mt-1.5 max-w-xs">Your AI bot is now active. All incoming messages will receive automatic AI-powered replies.</p>
            </div>
          </div>
        )}

        {/* ─── ERROR ─── */}
        {status === "error" && (
          <div className="space-y-5">
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="h-12 w-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-medium text-red-400">Connection Failed</p>
                <p className="text-[12px] text-gray-600 mt-1 max-w-sm">{errorMsg}</p>
              </div>
            </div>
            <button
              onClick={startQR}
              className="w-full h-10 rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

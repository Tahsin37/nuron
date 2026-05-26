"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-provider";
import {
  MessageSquare, Loader2, Wifi, WifiOff,
  ExternalLink, Trash2, Shield, Zap, Send
} from "lucide-react";
import { ConnectWhatsAppCard } from "@/components/dashboard/ConnectWhatsAppCard";

interface ChannelConnection {
  id: string;
  channel: string;
  status: string;
  page_name?: string;
  page_id?: string;
  connected_at?: string;
}

export default function ChannelsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // Messenger state
  const [messengerToken, setMessengerToken] = useState("");
  const [messengerPageId, setMessengerPageId] = useState("");
  const [messengerPageName, setMessengerPageName] = useState("");
  const [connectingMessenger, setConnectingMessenger] = useState(false);

  const fetchConnections = useCallback(() => {
    if (!user?.uuid) return;
    fetch(`/api/channels?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => setConnections(data.connections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uuid]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const messengerConn = connections.find(c => c.channel === "messenger");

  // ─── Messenger Connect ───
  const handleConnectMessenger = async () => {
    if (!user?.uuid || !messengerToken.trim()) return;
    setConnectingMessenger(true);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uuid,
          channel: "messenger",
          access_token: messengerToken,
          page_id: messengerPageId || undefined,
          page_name: messengerPageName || "My Page",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Messenger connected!");
        setMessengerToken("");
        setMessengerPageId("");
        setMessengerPageName("");
        fetchConnections();
      } else {
        toast(data.error || "Failed to connect", "error");
      }
    } catch {
      toast("Connection failed", "error");
    }
    setConnectingMessenger(false);
  };

  // ─── Disconnect ───
  const handleDisconnect = async (channel: string) => {
    if (!user?.uuid || !confirm(`Disconnect ${channel}?`)) return;
    await fetch("/api/channels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.uuid, channel }),
    }).catch(() => {});
    toast(`${channel} disconnected`);
    fetchConnections();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-12">
      {/* Page Header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-50">Channels</h2>
        <p className="text-sm text-gray-400">Connect messaging platforms. Your AI bot will auto-reply on all connected channels.</p>
      </div>

      {/* ═══ WHATSAPP — Using the new premium card ═══ */}
      <section className="space-y-6">
        <ConnectWhatsAppCard onConnected={fetchConnections} />
      </section>

      {/* ═══ TELEGRAM ═══ */}
      <section className="space-y-6">
        <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Send className="h-[18px] w-[18px] text-blue-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white tracking-tight">Telegram</h3>
                <p className="text-[12px] text-gray-600 mt-0.5">Bot-based integration via @BotFather</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-medium tracking-widest px-2.5 py-1 rounded-[5px] bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5 border border-emerald-500/20">
              <Wifi className="h-3 w-3" /> Settings
            </span>
          </div>
          <div className="px-5 py-4">
            <p className="text-[13px] text-gray-500">
              Manage your Telegram bot token from{" "}
              <a href="/dashboard/settings/keys" className="text-blue-400 hover:text-blue-300 transition-colors">
                Settings → API Keys
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ MESSENGER ═══ */}
      <section className="space-y-6">
        <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[10px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="h-[18px] w-[18px] text-indigo-400" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-white tracking-tight">Facebook Messenger</h3>
                <p className="text-[12px] text-gray-600 mt-0.5">Auto-reply to customers on your Facebook Page</p>
              </div>
            </div>
            {messengerConn?.status === "connected" ? (
              <span className="text-[10px] uppercase font-medium tracking-widest px-2.5 py-1 rounded-[5px] bg-emerald-500/10 text-emerald-400 flex items-center gap-1.5 border border-emerald-500/20">
                <Wifi className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="text-[10px] uppercase font-medium tracking-widest px-2.5 py-1 rounded-[5px] bg-white/[0.04] text-gray-600 flex items-center gap-1.5 border border-white/[0.06]">
                <WifiOff className="h-3 w-3" /> Offline
              </span>
            )}
          </div>

          <div className="p-5">
            {messengerConn?.status === "connected" ? (
              <div className="flex items-center gap-4 p-4 rounded-[8px] bg-white/[0.02] border border-white/[0.05]">
                <div className="h-10 w-10 rounded-[8px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white">{messengerConn.page_name || "Facebook Page"}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">Connected {messengerConn.connected_at ? new Date(messengerConn.connected_at).toLocaleDateString() : "recently"}</p>
                </div>
                <button
                  onClick={() => handleDisconnect("messenger")}
                  className="h-8 px-3 rounded-[7px] border border-red-500/20 text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-all duration-150 flex items-center gap-1.5"
                >
                  <Trash2 className="h-3 w-3" /> Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[8px] bg-indigo-500/[0.04] border border-indigo-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-gray-400 leading-relaxed">
                      Paste your <strong className="text-gray-200">Page Access Token</strong> from the{" "}
                      <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        Graph API Explorer <ExternalLink className="h-2.5 w-2.5 inline" />
                      </a>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-gray-400">Page Access Token</label>
                    <Input
                      value={messengerToken}
                      onChange={e => setMessengerToken(e.target.value)}
                      placeholder="EAAxx..."
                      type="password"
                      className="h-10 bg-white/[0.03] border-white/[0.06] focus:border-white/20 focus:ring-1 focus:ring-white/10 text-sm text-gray-100 rounded-[7px] transition-all duration-200 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-400">
                        Page Name <span className="text-gray-700">(optional)</span>
                      </label>
                      <Input
                        value={messengerPageName}
                        onChange={e => setMessengerPageName(e.target.value)}
                        placeholder="My Business"
                        className="h-10 bg-white/[0.03] border-white/[0.06] focus:border-white/20 focus:ring-1 focus:ring-white/10 text-sm text-gray-100 rounded-[7px] transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-medium text-gray-400">
                        Page ID <span className="text-gray-700">(optional)</span>
                      </label>
                      <Input
                        value={messengerPageId}
                        onChange={e => setMessengerPageId(e.target.value)}
                        placeholder="123456789"
                        className="h-10 bg-white/[0.03] border-white/[0.06] focus:border-white/20 focus:ring-1 focus:ring-white/10 text-sm text-gray-100 rounded-[7px] transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConnectMessenger}
                  disabled={connectingMessenger || !messengerToken.trim()}
                  className="w-full h-11 rounded-[8px] bg-white text-black text-[13px] font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {connectingMessenger ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Connect Messenger
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

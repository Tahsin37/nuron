"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { syncAllProducts } from "@/lib/store";
import { useToast } from "@/components/ui/toast-provider";
import {
  Bot, Loader2, Send, Sparkles,
  RefreshCw, CheckCircle2, AlertCircle, Trash2
} from "lucide-react";

export default function APIKeysPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [botToken, setBotToken] = useState("");
  const [puterToken, setPuterToken] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<any>(null);
  const [connectedBots, setConnectedBots] = useState<any[]>([]);
  const [hasKeys, setHasKeys] = useState({ puter: false, groq: false });
  const [syncing, setSyncing] = useState(false);
  const [savingPuter, setSavingPuter] = useState(false);
  const [savingGroq, setSavingGroq] = useState(false);

  useEffect(() => {
    if (!user?.uuid) return;
    fetch(`/api/settings/connect?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => {
        if (data.bots) setConnectedBots(data.bots);
        if (data.settings) {
          setHasKeys({ puter: data.settings.has_puter_token, groq: data.settings.has_groq_key });
        }
      }).catch(() => {});
  }, [user?.uuid]);

  const handleConnectBot = async () => {
    if (!user?.uuid || !botToken.trim()) return;
    setConnecting(true); setConnectResult(null);
    try {
      const res = await fetch("/api/settings/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uuid, bot_token: botToken }),
      });
      const data = await res.json();
      setConnectResult(data);
      if (data.success) {
        setBotToken("");
        toast(data.message || "Bot connected!");
        // Refresh
        fetch(`/api/settings/connect?user_id=${user.uuid}`).then(r => r.json()).then(d => { if (d.bots) setConnectedBots(d.bots); });
      } else {
        toast(data.error || "Failed to connect", "error");
      }
    } catch {
      toast("Connection failed", "error");
    }
    setConnecting(false);
  };

  const handleDisconnectBot = async (botId: string) => {
    if (!user?.uuid || !confirm("Disconnect this bot?")) return;
    await fetch("/api/settings/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user.uuid, disconnect_bot_id: botId }) }).catch(() => {});
    setConnectedBots(prev => prev.filter(b => b.id !== botId));
    toast("Bot disconnected");
  };

  const handleSaveKey = async (type: "puter" | "groq") => {
    if (!user?.uuid) return;
    const value = type === "puter" ? puterToken : groqKey;
    if (!value.trim()) return;
    type === "puter" ? setSavingPuter(true) : setSavingGroq(true);
    try {
      await fetch("/api/settings/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uuid, ...(type === "puter" ? { puter_api_token: puterToken } : { groq_api_key: groqKey }) }),
      });
      type === "puter" ? setPuterToken("") : setGroqKey("");
      setHasKeys(p => ({ ...p, [type]: true }));
      toast(`${type === "puter" ? "Puter" : "Groq"} key saved`);
    } catch { toast("Failed to save", "error"); }
    type === "puter" ? setSavingPuter(false) : setSavingGroq(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncAllProducts();
      toast("Products synced to cloud");
    } catch { toast("Sync failed", "error"); }
    setSyncing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-12">
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-50">API Keys & Integrations</h2>
        <p className="text-sm text-gray-400">Connect AI providers, bots, and sync your product catalog.</p>
      </div>

      {/* ═══ AI PROVIDERS ═══ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <Sparkles className="h-4 w-4 text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white tracking-tight">AI Providers</h3>
            <p className="text-xs text-gray-500">At least one provider is required for AI replies.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Puter */}
          <div className="p-5 rounded-lg bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-4 transition-all duration-200 ease-out hover:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">Puter.js</span>
                <span className="text-[10px] uppercase font-medium tracking-widest text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">GPT-4.1</span>
              </div>
              {hasKeys.puter ? (
                <span className="text-[10px] uppercase font-medium tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center gap-1 border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" /> CONNECTED</span>
              ) : (
                <span className="text-[10px] uppercase font-medium tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-gray-400 flex items-center gap-1 border border-white/5"><AlertCircle className="h-3 w-3" /> NOT SET</span>
              )}
            </div>
            {!hasKeys.puter && (
              <div className="flex gap-3">
                <Input value={puterToken} onChange={e => setPuterToken(e.target.value)} placeholder="Paste Puter API token..." type="password" className="h-9 bg-white/5 border-transparent focus:border-white/20 focus:ring-1 focus:ring-white/20 text-sm text-gray-100 flex-1 rounded-md transition-all duration-200 ease-out" />
                <Button onClick={() => handleSaveKey("puter")} disabled={savingPuter || !puterToken.trim()} className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs">
                  {savingPuter ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Key"}
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-500">Get from <a href="https://puter.com" target="_blank" className="text-gray-300 hover:text-white transition-colors duration-200">puter.com</a> → Settings → API Token</p>
          </div>

          {/* Groq */}
          <div className="p-5 rounded-lg bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-4 transition-all duration-200 ease-out hover:bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">Groq</span>
                <span className="text-[10px] uppercase font-medium tracking-widest text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">Llama 4 Scout</span>
              </div>
              {hasKeys.groq ? (
                <span className="text-[10px] uppercase font-medium tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center gap-1 border border-emerald-500/20"><CheckCircle2 className="h-3 w-3" /> CONNECTED</span>
              ) : (
                <span className="text-[10px] uppercase font-medium tracking-widest px-2 py-0.5 rounded-md bg-white/5 text-gray-400 flex items-center gap-1 border border-white/5"><AlertCircle className="h-3 w-3" /> NOT SET</span>
              )}
            </div>
            {!hasKeys.groq && (
              <div className="flex gap-3">
                <Input value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="Paste Groq API key..." type="password" className="h-9 bg-white/5 border-transparent focus:border-white/20 focus:ring-1 focus:ring-white/20 text-sm text-gray-100 flex-1 rounded-md transition-all duration-200 ease-out" />
                <Button onClick={() => handleSaveKey("groq")} disabled={savingGroq || !groqKey.trim()} className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs">
                  {savingGroq ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Key"}
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-500">Get from <a href="https://console.groq.com" target="_blank" className="text-gray-300 hover:text-white transition-colors duration-200">console.groq.com</a> → API Keys</p>
          </div>
        </div>
      </section>

      {/* ═══ TELEGRAM BOTS ═══ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <Bot className="h-4 w-4 text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white tracking-tight">Telegram Bots</h3>
            <p className="text-xs text-gray-500">Connect Telegram bots to receive and reply to messages.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Connected Bots */}
          {connectedBots.length > 0 ? (
            <div className="space-y-2">
              {connectedBots.map(bot => (
                <div key={bot.id} className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200 ease-out hover:bg-white/[0.02]">
                  <div className="h-10 w-10 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    <Send className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">@{bot.name || bot.id}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{bot.webhook_url}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] uppercase font-medium tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
                    <button onClick={() => handleDisconnectBot(bot.id)} className="p-2 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-2">
               <Bot className="h-8 w-8 text-gray-600 mb-2" />
               <p className="text-sm font-medium text-gray-300">No Bots Connected</p>
               <p className="text-xs text-gray-500 max-w-sm">Paste your bot token below to connect a Telegram bot and start handling messages automatically.</p>
            </div>
          )}

          {/* Add Bot */}
          <div className="flex gap-3">
            <Input value={botToken} onChange={e => setBotToken(e.target.value)} placeholder="Paste Telegram bot token from @BotFather..." type="password" className="h-9 bg-white/5 border-transparent focus:border-white/20 focus:ring-1 focus:ring-white/20 text-sm text-gray-100 flex-1 rounded-md transition-all duration-200 ease-out" />
            <Button onClick={handleConnectBot} disabled={connecting || !botToken.trim()} className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs gap-2">
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Connect
            </Button>
          </div>
          {connectResult && !connectResult.success && (
            <p className="text-[11px] font-medium text-red-400">{connectResult.error}</p>
          )}
        </div>
      </section>

      {/* ═══ PRODUCT SYNC ═══ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <RefreshCw className="h-4 w-4 text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white tracking-tight">Product Sync</h3>
            <p className="text-xs text-gray-500">Sync your local product catalog to the cloud database.</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-5 rounded-lg bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all duration-200 ease-out hover:bg-white/[0.02]">
          <p className="text-sm text-gray-400 mr-4">Push all products from your local store to Supabase so your bot has the latest catalog.</p>
          <Button onClick={handleSync} disabled={syncing} variant="outline" className="h-9 px-4 rounded-md bg-transparent border-white/10 text-white hover:bg-white/5 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs gap-2 shrink-0">
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync Now
          </Button>
        </div>
      </section>
    </div>
  );
}

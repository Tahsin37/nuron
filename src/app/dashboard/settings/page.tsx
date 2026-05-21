"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { syncAllProducts } from "@/lib/store";
import {
  User, Shield, Trash2, LogOut, Check, Loader2, Bot, Send,
  Sparkles, ExternalLink, BookOpen, MessageSquare, RefreshCw,
  Zap, CheckCircle2, AlertCircle, ChevronRight, Globe, Brain, Settings2
} from "lucide-react";

type Tab = "general" | "ai" | "integrations" | "danger";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <User className="h-4 w-4" /> },
  { id: "ai", label: "AI & Training", icon: <Brain className="h-4 w-4" /> },
  { id: "integrations", label: "Integrations", icon: <Zap className="h-4 w-4" /> },
  { id: "danger", label: "Account", icon: <Settings2 className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const { user, signOut, completeProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("general");

  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    company: user?.company || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [businessDescription, setBusinessDescription] = useState("");
  const [trainingData, setTrainingData] = useState("");
  const [savingBiz, setSavingBiz] = useState(false);
  const [savedBiz, setSavedBiz] = useState(false);

  const [botToken, setBotToken] = useState("");
  const [puterToken, setPuterToken] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<any>(null);
  const [connectedBots, setConnectedBots] = useState<any[]>([]);
  const [hasKeys, setHasKeys] = useState({ puter: false, groq: false });
  const [syncing, setSyncing] = useState(false);

  // Setup score
  const setupSteps = [
    { done: !!profileForm.company, label: "Business name" },
    { done: hasKeys.puter || hasKeys.groq, label: "AI provider" },
    { done: connectedBots.length > 0, label: "Bot connected" },
    { done: !!businessDescription, label: "Business context" },
  ];
  const setupDone = setupSteps.filter(s => s.done).length;

  useEffect(() => {
    if (!user?.uuid) return;
    fetch(`/api/settings/connect?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => {
        if (data.bots) setConnectedBots(data.bots);
        if (data.settings) {
          setHasKeys({ puter: data.settings.has_puter_token, groq: data.settings.has_groq_key });
          if (data.settings.business_name && !profileForm.company)
            setProfileForm(p => ({ ...p, company: data.settings.business_name }));
          if (data.settings.business_description) setBusinessDescription(data.settings.business_description);
          if (data.settings.training_data) setTrainingData(data.settings.training_data);
        }
      }).catch(() => {});
  }, [user?.uuid]);

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) return;
    setSaving(true);
    await completeProfile(profileForm);
    if (user?.uuid && profileForm.company) {
      fetch("/api/settings/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uuid, business_name: profileForm.company }),
      }).catch(() => {});
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBusinessContext = async () => {
    if (!user?.uuid) return;
    setSavingBiz(true);
    try {
      await fetch("/api/settings/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uuid, business_description: businessDescription, training_data: trainingData }),
      });
      setSavedBiz(true); setTimeout(() => setSavedBiz(false), 2000);
    } catch {}
    setSavingBiz(false);
  };

  const handleConnectBot = async () => {
    if (!user?.uuid) return;
    setConnecting(true); setConnectResult(null);
    try {
      const res = await fetch("/api/settings/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uuid,
          bot_token: botToken || undefined,
          puter_api_token: puterToken || undefined,
          groq_api_key: groqKey || undefined,
          business_name: profileForm.company || undefined,
        }),
      });
      const data = await res.json();
      setConnectResult(data);
      if (data.success && data.bot) {
        setConnectedBots(prev => [...prev.filter(b => b.id !== data.bot.id), {
          id: data.bot.id, name: data.bot.username, platform: "telegram", status: "active", webhook_url: data.webhook_url,
        }]);
        setBotToken("");
      }
      if (puterToken) { setHasKeys(p => ({ ...p, puter: true })); setPuterToken(""); }
      if (groqKey) { setHasKeys(p => ({ ...p, groq: true })); setGroqKey(""); }
    } catch (err: any) { setConnectResult({ error: err.message }); }
    setConnecting(false);
  };

  const handleSyncProducts = () => { setSyncing(true); syncAllProducts(); setTimeout(() => setSyncing(false), 2000); };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Configure your AI bot, connect platforms, and manage your account.</p>
      </div>

      {/* Setup Progress */}
      {setupDone < 4 && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-orange-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Complete your setup</p>
                <p className="text-xs text-muted-foreground">{setupDone}/4 steps done — finish to activate your bot</p>
              </div>
            </div>
            <span className="text-lg font-bold text-amber-400">{Math.round((setupDone / 4) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${(setupDone / 4) * 100}%` }} />
          </div>
          <div className="flex gap-4 mt-3">
            {setupSteps.map((s, i) => (
              <div key={i} className={`flex items-center gap-1.5 text-xs ${s.done ? "text-emerald-400" : "text-muted-foreground"}`}>
                {s.done ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {s.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <div className="md:w-52 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  tab === t.id
                    ? "bg-white text-black shadow-sm"
                    : "text-muted-foreground hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                {t.icon} {t.label}
                {tab === t.id && <ChevronRight className="h-3 w-3 ml-auto hidden md:block" />}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {/* ═══ GENERAL TAB ═══ */}
          {tab === "general" && (<>
            {/* Profile */}
            <Card className="border-border/40 bg-zinc-900/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-blue-400" /> Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/40">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold shadow-lg">
                    {(user?.full_name || user?.username || "U")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold">{user?.full_name || user?.username}</div>
                    <div className="text-xs text-muted-foreground">{user?.email || "No email set"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <Input value={profileForm.full_name} onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="bg-zinc-950/60 border-zinc-800 h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <Input value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} className="bg-zinc-950/60 border-zinc-800 h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Business / Shop Name</Label>
                  <Input value={profileForm.company} onChange={(e) => setProfileForm(p => ({ ...p, company: e.target.value }))} placeholder="Your shop name (shown to customers)" className="bg-zinc-950/60 border-zinc-800 h-9" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="h-9">
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5 mr-2" /> : null}
                  {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
                </Button>
              </CardContent>
            </Card>

            {/* Product Sync */}
            <Card className="border-border/40 bg-zinc-900/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-4 w-4 text-cyan-400" /> Product Sync</CardTitle>
                <CardDescription className="text-xs">Push your dashboard products to the bot. Auto-syncs on changes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={handleSyncProducts} disabled={syncing} size="sm" className="h-9">
                  {syncing ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                  {syncing ? "Syncing..." : "Sync Products Now"}
                </Button>
              </CardContent>
            </Card>
          </>)}

          {/* ═══ AI & TRAINING TAB ═══ */}
          {tab === "ai" && (<>
            {/* AI Provider */}
            <Card className="border-border/40 bg-zinc-900/50 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-400" /> AI Provider</CardTitle>
                  {(hasKeys.puter || hasKeys.groq) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs">Your AI brain. You need at least one key.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/10">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-emerald-300">Recommended: Groq (FREE)</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Sign up at console.groq.com → create API key → paste below. No credit card needed.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    Groq API Key
                    {hasKeys.groq && <span className="text-emerald-400">✓</span>}
                  </Label>
                  <Input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)}
                    placeholder={hasKeys.groq ? "••••••••• (saved)" : "gsk_..."} className="bg-zinc-950/60 border-zinc-800 h-9 font-mono text-xs" />
                </div>

                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/20" /></div>
                  <div className="relative flex justify-center text-[10px]"><span className="bg-zinc-900 px-2 text-muted-foreground">OR</span></div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2">
                    Puter API Token
                    {hasKeys.puter && <span className="text-emerald-400">✓</span>}
                  </Label>
                  <Input type="password" value={puterToken} onChange={(e) => setPuterToken(e.target.value)}
                    placeholder={hasKeys.puter ? "••••••••• (saved)" : "Paste Puter token"} className="bg-zinc-950/60 border-zinc-800 h-9 font-mono text-xs" />
                </div>
              </CardContent>
            </Card>

            {/* Business Context */}
            <Card className="border-border/40 bg-zinc-900/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-400" /> Business Context</CardTitle>
                <CardDescription className="text-xs">Tell the AI about your business — policies, style, personality. This makes replies authentic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">About Your Business</Label>
                  <textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="We are ZyloVerse, a premium clothing brand from Dhaka. We sell hoodies, t-shirts, panjabis. COD all over Bangladesh. Delivery 2-3 days Dhaka, 3-5 outside. 7-day exchange policy."
                    className="w-full min-h-[90px] rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm resize-y focus:ring-1 focus:ring-white/20 focus:border-zinc-700 transition-all" rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" /> Training Data
                    <span className="text-[10px] text-zinc-600">(optional)</span>
                  </Label>
                  <textarea value={trainingData} onChange={(e) => setTrainingData(e.target.value)}
                    placeholder={"Paste previous chats so AI learns your tone:\n\nCustomer: bhai hoodie price koto?\nYou: Bhai, Premium Hoodie 850 taka. Order diben?\nCustomer: COD ache?\nYou: Ji bhai, COD ache puro Bangladesh e."}
                    className="w-full min-h-[110px] rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5 text-sm resize-y font-mono focus:ring-1 focus:ring-white/20 focus:border-zinc-700 transition-all" rows={4} />
                </div>
                <Button onClick={handleSaveBusinessContext} disabled={savingBiz} size="sm" className="h-9">
                  {savingBiz ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : savedBiz ? <Check className="h-3.5 w-3.5 mr-2" /> : <Brain className="h-3.5 w-3.5 mr-2" />}
                  {savingBiz ? "Saving..." : savedBiz ? "Saved!" : "Save AI Context"}
                </Button>
              </CardContent>
            </Card>
          </>)}

          {/* ═══ INTEGRATIONS TAB ═══ */}
          {tab === "integrations" && (<>
            {/* Telegram */}
            <Card className="border-border/40 bg-zinc-900/50 backdrop-blur">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4 text-blue-400" /> Telegram Bot</CardTitle>
                  {connectedBots.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs">Connect your Telegram bot — customers message it, AI replies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedBots.map((bot) => (
                  <div key={bot.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/15">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-500/15 flex items-center justify-center"><Bot className="h-4 w-4 text-blue-400" /></div>
                      <div>
                        <div className="text-sm font-medium">@{bot.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">ID: {bot.id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`https://t.me/${bot.name}`} target="_blank" rel="noopener"
                        className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                        Open <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      <button onClick={() => {
                        if (confirm(`Disconnect @${bot.name}?`)) {
                          fetch("/api/settings/connect", {
                            method: "POST", headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ user_id: user?.uuid, disconnect_bot_id: bot.id }),
                          }).then(() => setConnectedBots(prev => prev.filter(b => b.id !== bot.id))).catch(() => {});
                        }
                      }} className="text-[10px] text-red-400 hover:underline">Disconnect</button>
                    </div>
                  </div>
                ))}

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Bot Token</Label>
                  <Input value={botToken} onChange={(e) => setBotToken(e.target.value)}
                    placeholder="123456789:ABCdefGHIjklMNO..."
                    className="bg-zinc-950/60 border-zinc-800 h-9 font-mono text-xs" />
                  <p className="text-[10px] text-muted-foreground">
                    Create via <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-blue-400 hover:underline">@BotFather</a> → /newbot → copy token
                  </p>
                </div>

                <Button onClick={handleConnectBot} disabled={connecting || (!botToken && !puterToken && !groqKey)} size="sm" className="w-full h-9">
                  {connecting ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Connecting...</> : <><Send className="h-3.5 w-3.5 mr-2" /> Save & Connect</>}
                </Button>

                {connectResult && (
                  <div className={`p-3 rounded-lg text-xs ${connectResult.error ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}`}>
                    {connectResult.error || connectResult.message}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Messenger (coming soon) */}
            <Card className="border-border/40 bg-zinc-900/50 backdrop-blur opacity-60">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-indigo-400" /> Facebook Messenger</CardTitle>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">Coming Soon</span>
                </div>
                <CardDescription className="text-xs">Connect your Facebook Page to auto-reply on Messenger.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled size="sm" className="h-9 w-full">Connect Facebook Page</Button>
              </CardContent>
            </Card>
          </>)}

          {/* ═══ ACCOUNT / DANGER TAB ═══ */}
          {tab === "danger" && (<>
            <Card className="border-border/40 bg-zinc-900/50 backdrop-blur">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" onClick={signOut} className="w-full h-9 justify-start" size="sm">
                  <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                </Button>
              </CardContent>
            </Card>
            <Card className="border-red-500/20 bg-red-500/[0.02]">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-red-400 flex items-center gap-2"><Shield className="h-4 w-4" /> Danger Zone</CardTitle>
                <CardDescription className="text-xs">Irreversible actions. Be careful.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full h-9 justify-start text-red-400 border-red-500/20 hover:bg-red-500/10" size="sm">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Account & All Data
                </Button>
              </CardContent>
            </Card>
          </>)}
        </div>
      </div>
    </div>
  );
}

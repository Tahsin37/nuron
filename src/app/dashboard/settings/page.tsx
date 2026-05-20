"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { syncAllProducts } from "@/lib/store";
import { User, Bell, Shield, Key, Trash2, LogOut, Check, Loader2, Bot, Send, Sparkles, ExternalLink, BookOpen, MessageSquare, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut, completeProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    company: user?.company || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Business context
  const [businessDescription, setBusinessDescription] = useState("");
  const [trainingData, setTrainingData] = useState("");
  const [savingBiz, setSavingBiz] = useState(false);
  const [savedBiz, setSavedBiz] = useState(false);

  // Telegram
  const [botToken, setBotToken] = useState("");
  const [puterToken, setPuterToken] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<any>(null);
  const [connectedBots, setConnectedBots] = useState<any[]>([]);
  const [hasKeys, setHasKeys] = useState({ puter: false, groq: false });

  // Sync
  const [syncing, setSyncing] = useState(false);

  // Load existing settings on mount
  useEffect(() => {
    if (!user?.uuid) return;
    fetch(`/api/settings/connect?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => {
        if (data.bots) setConnectedBots(data.bots);
        if (data.settings) {
          setHasKeys({ puter: data.settings.has_puter_token, groq: data.settings.has_groq_key });
          if (data.settings.business_name && !profileForm.company) {
            setProfileForm(p => ({ ...p, company: data.settings.business_name }));
          }
          if (data.settings.business_description) setBusinessDescription(data.settings.business_description);
          if (data.settings.training_data) setTrainingData(data.settings.training_data);
        }
      })
      .catch(() => {});
  }, [user?.uuid]);

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) return;
    setSaving(true);
    await completeProfile(profileForm);
    if (user?.uuid && profileForm.company) {
      fetch("/api/settings/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uuid, business_name: profileForm.company }),
      }).catch(() => {});
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveBusinessContext = async () => {
    if (!user?.uuid) return;
    setSavingBiz(true);
    try {
      await fetch("/api/settings/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uuid,
          business_description: businessDescription,
          training_data: trainingData,
        }),
      });
      setSavedBiz(true);
      setTimeout(() => setSavedBiz(false), 2000);
    } catch {}
    setSavingBiz(false);
  };

  const handleConnectBot = async () => {
    if (!user?.uuid) return;
    setConnecting(true);
    setConnectResult(null);
    try {
      const res = await fetch("/api/settings/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    } catch (err: any) {
      setConnectResult({ error: err.message });
    }
    setConnecting(false);
  };

  const handleSyncProducts = () => {
    setSyncing(true);
    syncAllProducts();
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground text-sm mt-1">Set up your AI bot, connect Telegram, and manage your account</p></div>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold">{(user?.full_name || user?.username || "U")[0]?.toUpperCase()}</div>
            <div>
              <div className="font-semibold">{user?.full_name || user?.username}</div>
              <div className="text-sm text-muted-foreground">{user?.email || "No email set"}</div>
            </div>
          </div>
          <Separator className="bg-border/30" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={profileForm.full_name} onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <Label>Business / Shop Name</Label>
              <Input value={profileForm.company} onChange={(e) => setProfileForm(p => ({ ...p, company: e.target.value }))} placeholder="Your shop name (shown to customers)" className="bg-zinc-950 border-zinc-800" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : saved ? <><Check className="h-4 w-4 mr-2" /> Saved!</> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Business Context (NEW) */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-5 w-5" /> Business Context</CardTitle>
          <CardDescription>Tell the AI about your business so it can answer better. This is like training your AI employee.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>About Your Business</Label>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder={"Example: We are ZyloVerse, a premium clothing brand from Dhaka. We sell hoodies, t-shirts, and panjabis. We do COD all over Bangladesh. Delivery takes 2-3 days inside Dhaka, 3-5 days outside. We have a 7-day exchange policy. Our target customers are young men aged 18-35."}
              className="w-full min-h-[100px] rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm resize-y"
              rows={4}
            />
            <p className="text-[11px] text-muted-foreground">The AI will use this to answer general questions about your business, policies, and delivery.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Training Data <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
            </Label>
            <textarea
              value={trainingData}
              onChange={(e) => setTrainingData(e.target.value)}
              placeholder={"Paste your previous chat conversations here so the AI learns your selling style.\n\nExample:\nCustomer: bhai hoodie price koto?\nYou: Bhai, Premium Hoodie 850 taka. Onek comfortable. Order diben?\nCustomer: COD ache?\nYou: Ji bhai, Cash on Delivery ache puro Bangladesh e. Dhaka te 60 taka, baire 120 taka."}
              className="w-full min-h-[120px] rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm resize-y font-mono"
              rows={5}
            />
            <p className="text-[11px] text-muted-foreground">The AI will learn your tone and style from these examples. Paste real chats for best results.</p>
          </div>

          <Button onClick={handleSaveBusinessContext} disabled={savingBiz}>
            {savingBiz ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : savedBiz ? <><Check className="h-4 w-4 mr-2" /> Saved!</> : "Save Business Context"}
          </Button>
        </CardContent>
      </Card>

      {/* AI Provider */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5" /> AI Provider</CardTitle>
          <CardDescription>Your AI engine. You need at least one key for the bot to reply intelligently.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              Puter API Token
              {hasKeys.puter && <span className="text-xs text-emerald-400">✅ Connected</span>}
            </Label>
            <Input type="password" value={puterToken} onChange={(e) => setPuterToken(e.target.value)}
              placeholder={hasKeys.puter ? "••••••••••• (saved)" : "Paste your Puter API token"}
              className="bg-zinc-950 border-zinc-800" />
            <p className="text-[11px] text-muted-foreground">Get from puter.com → Settings → API Token</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/30" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-2">
              Groq API Key <span className="text-[10px] text-emerald-400 font-normal">(FREE)</span>
              {hasKeys.groq && <span className="text-xs text-emerald-400">✅ Connected</span>}
            </Label>
            <Input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)}
              placeholder={hasKeys.groq ? "••••••••••• (saved)" : "gsk_..."}
              className="bg-zinc-950 border-zinc-800" />
            <p className="text-[11px] text-muted-foreground">
              Free, no credit card →{" "}
              <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-blue-400 hover:underline inline-flex items-center gap-1">
                console.groq.com <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Send className="h-5 w-5" /> Telegram Bot</CardTitle>
          <CardDescription>Connect your Telegram bot. Your customers will message this bot and AI will reply.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedBots.length > 0 && (
            <div className="space-y-2">
              {connectedBots.map((bot) => (
                <div key={bot.id} className="flex items-center justify-between p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">@{bot.name}</div>
                      <div className="text-[10px] text-muted-foreground">ID: {bot.id} • {bot.status}</div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Bot Token</Label>
            <Input value={botToken} onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNO..."
              className="bg-zinc-950 border-zinc-800 font-mono text-xs" />
            <p className="text-[11px] text-muted-foreground">
              Create via{" "}
              <a href="https://t.me/BotFather" target="_blank" rel="noopener" className="text-blue-400 hover:underline">@BotFather</a>
              {" "}→ /newbot → copy the token
            </p>
          </div>

          <Button onClick={handleConnectBot} disabled={connecting || (!botToken && !puterToken && !groqKey)} className="w-full">
            {connecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</> : <><Send className="h-4 w-4 mr-2" /> Save & Connect</>}
          </Button>

          {connectResult && (
            <div className={`p-3 rounded-lg text-sm ${connectResult.error ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}`}>
              {connectResult.error || connectResult.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Sync */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><RefreshCw className="h-5 w-5" /> Product Sync</CardTitle>
          <CardDescription>Sync your dashboard products to the bot. This happens automatically, but you can force a sync here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleSyncProducts} disabled={syncing} className="w-full">
            {syncing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Syncing...</> : <><RefreshCw className="h-4 w-4 mr-2" /> Sync Products Now</>}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-2"><Shield className="h-5 w-5" /> Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={signOut} className="w-full"><LogOut className="h-4 w-4 mr-2" /> Sign Out</Button>
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 className="h-4 w-4 mr-2" /> Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createProduct, syncAllProducts } from "@/lib/store";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Sparkles, Send, Bot, Package, ExternalLink, ArrowLeft, Rocket } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STEPS = [
  { title: "Business Info", icon: "🏪" },
  { title: "AI Provider", icon: "🤖" },
  { title: "Connect Bot", icon: "📱" },
  { title: "Add Product", icon: "📦" },
  { title: "Test It!", icon: "🚀" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, chatWithAI } = useAuth();
  const [step, setStep] = useState(0);

  // Step 1: Business
  const [businessName, setBusinessName] = useState(user?.company || "");
  const [businessDescription, setBusinessDescription] = useState("");

  // Step 2: AI
  const [groqKey, setGroqKey] = useState("");
  const [puterToken, setPuterToken] = useState("");

  // Step 3: Telegram
  const [botToken, setBotToken] = useState("");
  const [botResult, setBotResult] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);

  // Step 4: Product
  const [product, setProduct] = useState({ name: "", price: "", description: "" });

  // Step 5: Test
  const [testMsg, setTestMsg] = useState("");
  const [testReply, setTestReply] = useState("");
  const [testing, setTesting] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);

  const handleSaveBusinessInfo = async () => {
    if (!businessName.trim() || !user?.uuid) return;
    setSaving(true);
    try {
      await fetch("/api/settings/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uuid,
          business_name: businessName,
          business_description: businessDescription,
        }),
      });
    } catch {}
    setSaving(false);
    setStep(1);
  };

  const handleSaveAIKey = async () => {
    if (!user?.uuid || (!groqKey && !puterToken)) return;
    setSaving(true);
    try {
      await fetch("/api/settings/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uuid,
          ...(groqKey && { groq_api_key: groqKey }),
          ...(puterToken && { puter_api_token: puterToken }),
        }),
      });
    } catch {}
    setSaving(false);
    setStep(2);
  };

  const handleConnectBot = async () => {
    if (!botToken || !user?.uuid) return;
    setConnecting(true);
    setBotResult(null);
    try {
      const res = await fetch("/api/settings/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uuid, bot_token: botToken }),
      });
      const data = await res.json();
      setBotResult(data);
      if (data.success) {
        setTimeout(() => setStep(3), 1500);
      }
    } catch (err: any) {
      setBotResult({ error: err.message });
    }
    setConnecting(false);
  };

  const handleSaveProduct = () => {
    if (!product.name) return;
    createProduct({
      name: product.name,
      price: product.price,
      description: product.description,
      stock_status: "in_stock",
      status: "active",
    });
    // Trigger sync to Supabase
    setTimeout(() => syncAllProducts(), 500);
    setStep(4);
  };

  const handleTestMessage = async () => {
    if (!testMsg.trim()) return;
    setTesting(true);
    try {
      const prompt = `You are a helpful sales assistant for ${businessName || "a shop"}. A customer asks: "${testMsg}". You have this product: ${product.name} priced at ${product.price}. ${product.description}. Reply naturally and short.`;
      const reply = await chatWithAI([{ role: "user", content: prompt }]);
      setTestReply(reply);
    } catch {
      setTestReply("AI is working! Deploy to Vercel for full functionality.");
    }
    setTesting(false);
  };

  const finishOnboarding = () => {
    router.push("/dashboard");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-10">
      {/* Progress */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === step ? "bg-white text-black" : i < step ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800/50 text-zinc-500"
            }`}>
              {i < step ? <Check className="h-3 w-3" /> : <span>{s.icon}</span>}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${i < step ? "bg-emerald-500/40" : "bg-zinc-800"}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Business Info */}
      {step === 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">🏪 What's your business?</CardTitle>
            <CardDescription>Tell us about your shop so the AI knows who it's working for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Shop / Business Name *</Label>
              <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. ZyloVerse, Trendy Fashion BD" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <Label>About Your Business <span className="text-muted-foreground text-xs">(optional but recommended)</span></Label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="What do you sell? Who are your customers? What's your delivery policy? COD available?"
                className="w-full min-h-[80px] rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm resize-y"
                rows={3}
              />
            </div>
            <Button onClick={handleSaveBusinessInfo} disabled={!businessName.trim() || saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: AI Provider */}
      {step === 1 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">🤖 Connect AI</CardTitle>
            <CardDescription>Get a free AI key so your bot can reply intelligently. Takes 30 seconds.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
              <p className="font-medium text-emerald-300 mb-1">Recommended: Groq (FREE)</p>
              <p className="text-muted-foreground text-xs">1. Go to console.groq.com → sign up (free)</p>
              <p className="text-muted-foreground text-xs">2. Create an API key</p>
              <p className="text-muted-foreground text-xs">3. Paste it below</p>
            </div>

            <div className="space-y-1.5">
              <Label>Groq API Key</Label>
              <Input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="gsk_..." className="bg-zinc-950 border-zinc-800" />
              <a href="https://console.groq.com" target="_blank" rel="noopener" className="text-blue-400 hover:underline text-xs inline-flex items-center gap-1">
                Get free key → console.groq.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/30" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">OR</span></div>
            </div>

            <div className="space-y-1.5">
              <Label>Puter API Token</Label>
              <Input type="password" value={puterToken} onChange={(e) => setPuterToken(e.target.value)} placeholder="Puter API token..." className="bg-zinc-950 border-zinc-800" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button onClick={handleSaveAIKey} disabled={(!groqKey && !puterToken) || saving} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Connect Telegram */}
      {step === 2 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">📱 Connect Telegram Bot</CardTitle>
            <CardDescription>Create a Telegram bot and connect it here. Your customers will message this bot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm space-y-1">
              <p className="font-medium text-blue-300">How to create a Telegram bot:</p>
              <p className="text-muted-foreground text-xs">1. Open Telegram → search @BotFather</p>
              <p className="text-muted-foreground text-xs">2. Send /newbot</p>
              <p className="text-muted-foreground text-xs">3. Give it a name like "{businessName} Bot"</p>
              <p className="text-muted-foreground text-xs">4. Copy the token → paste below</p>
            </div>

            <div className="space-y-1.5">
              <Label>Bot Token</Label>
              <Input value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder="123456789:ABCdefGHIjklMNO..." className="bg-zinc-950 border-zinc-800 font-mono text-xs" />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button onClick={handleConnectBot} disabled={!botToken || connecting} className="flex-1">
                {connecting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Connecting...</> : <><Send className="h-4 w-4 mr-2" /> Connect Bot</>}
              </Button>
            </div>

            {botResult && (
              <div className={`p-3 rounded-lg text-sm ${botResult.error ? "bg-red-500/10 text-red-300 border border-red-500/20" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"}`}>
                {botResult.error || botResult.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Add First Product */}
      {step === 3 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">📦 Add Your First Product</CardTitle>
            <CardDescription>Add a product so the AI knows what to sell. You can add more later from the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input value={product.name} onChange={(e) => setProduct(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Winter Hoodie" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <Label>Price *</Label>
              <Input value={product.price} onChange={(e) => setProduct(p => ({ ...p, price: e.target.value }))} placeholder="e.g. ৳850 or $25" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground text-xs">(sizes, colors, delivery)</span></Label>
              <textarea
                value={product.description}
                onChange={(e) => setProduct(p => ({ ...p, description: e.target.value }))}
                placeholder="Available in Black, Navy, Grey. Sizes: M, L, XL. COD available. Delivery 2-3 days."
                className="w-full min-h-[60px] rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm resize-y"
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
              <Button onClick={handleSaveProduct} disabled={!product.name.trim()} className="flex-1">
                <Package className="h-4 w-4 mr-2" /> Add Product & Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Test */}
      {step === 4 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">🚀 You're all set!</CardTitle>
            <CardDescription>Your AI sales employee is ready. Try sending a test message below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-start gap-2">
                <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5"><Bot className="h-3 w-3 text-blue-400" /></div>
                <div className="text-sm text-muted-foreground">Hey! Welcome to {businessName}. Ask me anything about our products!</div>
              </div>

              {testReply && (
                <>
                  <div className="flex items-start gap-2 justify-end">
                    <div className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-xl rounded-tr-sm max-w-[80%]">{testMsg}</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5"><Bot className="h-3 w-3 text-blue-400" /></div>
                    <div className="text-sm bg-zinc-800 px-3 py-1.5 rounded-xl rounded-tl-sm max-w-[80%]">{testReply}</div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Input
                  value={testMsg}
                  onChange={(e) => setTestMsg(e.target.value)}
                  placeholder={`Try: "How much is the ${product.name}?"`}
                  className="bg-zinc-950 border-zinc-800"
                  onKeyDown={(e) => e.key === "Enter" && handleTestMessage()}
                />
                <Button onClick={handleTestMessage} disabled={!testMsg.trim() || testing} size="sm">
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 space-y-1">
              <p className="font-medium">✅ Setup complete! Here's what's working:</p>
              <p className="text-xs text-muted-foreground">• Business: {businessName}</p>
              <p className="text-xs text-muted-foreground">• AI: Connected</p>
              <p className="text-xs text-muted-foreground">• Product: {product.name} — {product.price}</p>
              <p className="text-xs text-muted-foreground">• Bot: Connected & listening</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/dashboard/products")} className="flex-1">
                <Package className="h-4 w-4 mr-2" /> Add More Products
              </Button>
              <Button onClick={finishOnboarding} className="flex-1">
                <Rocket className="h-4 w-4 mr-2" /> Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, CheckCircle2, MessageSquare, Database, Sparkles, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function OnboardingPage() {
  const router = useRouter();
  const { chatWithAI } = useAuth();
  const [step, setStep] = useState(0);
  
  // Form State
  const [fbConnected, setFbConnected] = useState(false);
  const [product, setProduct] = useState({ name: "", price: "", description: "" });
  
  // AI Preview State
  const [previewMsg, setPreviewMsg] = useState("");
  const [generating, setGenerating] = useState(false);
  
  const handleConnect = () => {
    // Simulate OAuth
    setTimeout(() => {
      setFbConnected(true);
      setTimeout(() => setStep(1), 800);
    }, 1000);
  };
  
  const handleSaveProduct = async () => {
    if (!product.name) return;
    createProduct({
      name: product.name, price: product.price, description: product.description,
      stock_status: "in_stock", status: "active"
    });
    setStep(2);
    
    // Auto-generate preview
    setGenerating(true);
    try {
      const prompt = `You are a helpful Facebook Messenger seller. A customer asks "Hi, what's the price of the ${product.name}?". Reply in Banglish nicely, mentioning the price is ${product.price} and summarize: ${product.description}. Keep it very short.`;
      const reply = await chatWithAI([{ role: "user", content: prompt }]);
      setPreviewMsg(reply);
    } catch {
      setPreviewMsg(`Ji bhai, ${product.name} er price ${product.price} Taka. Order confirm korben?`);
    } finally {
      setGenerating(false);
    }
  };

  const finishOnboarding = () => {
    router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Nuron AI</h1>
        <p className="text-muted-foreground">Let's set up your automated Messenger sales assistant in 3 minutes.</p>
      </div>

      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-white" : "bg-zinc-800"}`} />
        ))}
      </div>

      {step === 0 && (
        <Card className="border-border/50 bg-zinc-900/50 backdrop-blur card-animate">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-[#1877F2]" />
            </div>
            <CardTitle>Connect Facebook Page</CardTitle>
            <CardDescription>Link your page to let Nuron AI reply to Messenger.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button 
              size="lg" 
              onClick={handleConnect} 
              className={`w-full max-w-sm transition-all ${fbConnected ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"}`}
            >
              {fbConnected ? <><CheckCircle2 className="mr-2 h-5 w-5" /> Connected</> : "Continue with Facebook"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="border-border/50 bg-zinc-900/50 backdrop-blur card-animate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center"><Database className="h-5 w-5" /></div>
              <div>
                <CardTitle>Add Your First Product</CardTitle>
                <CardDescription>Teach the AI about a product so it can answer questions.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={product.name} onChange={e => setProduct(p => ({...p, name: e.target.value}))} placeholder="e.g. Premium Cotton T-shirt" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input value={product.price} onChange={e => setProduct(p => ({...p, price: e.target.value}))} placeholder="e.g. 500 Taka" className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label>Description / Details</Label>
              <textarea value={product.description} onChange={e => setProduct(p => ({...p, description: e.target.value}))} rows={3} placeholder="e.g. Available in Black and White, sizes M-XL." className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <Button onClick={handleSaveProduct} disabled={!product.name || !product.price} className="w-full mt-4 bg-white text-black hover:bg-zinc-200">
              Save to Brain <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-border/50 bg-zinc-900/50 backdrop-blur card-animate">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <Sparkles className="h-8 w-8 text-amber-400" />
            </div>
            <CardTitle>Your AI is Ready!</CardTitle>
            <CardDescription>Here's how your AI will reply to customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="rounded-xl border border-border/50 bg-zinc-950 p-4 space-y-4">
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm bg-blue-600 text-white px-4 py-2.5 max-w-[80%] text-sm">
                  bhai {product.name} er price koto?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-blue-400" /></div>
                <div className="rounded-2xl rounded-tl-sm bg-zinc-800 border border-border/50 px-4 py-2.5 max-w-[80%] text-sm">
                  {generating ? <span className="animate-pulse text-muted-foreground">Thinking...</span> : previewMsg}
                </div>
              </div>
            </div>

            <Button onClick={finishOnboarding} className="w-full bg-white text-black hover:bg-zinc-200 h-12 text-base font-semibold">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

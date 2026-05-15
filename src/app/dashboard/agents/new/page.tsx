"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createAgent, addTrainingSource } from "@/lib/store";
import { agentTemplates, type AgentTemplate } from "@/lib/templates";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Bot, ArrowRight, ArrowLeft, Sparkles, Zap, LayoutTemplate } from "lucide-react";

export default function NewAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=templates, 1=basic, 2=personality, 3=behavior
  const [form, setForm] = useState({
    name: "", welcome_message: "Hi! 👋 How can I help you today?", fallback_message: "Let me connect you with our team for a detailed answer.",
    role: "hybrid" as "sales" | "support" | "hybrid",
    friendliness: 70, detail_level: 60, formality: 40, sales_aggressiveness: 50, emoji_usage: 40, humor_level: 25, persuasion_level: 60,
    product_recommendation: true, lead_capture: true, upsell: true, custom_instructions: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const applyTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setForm({
      name: template.name, welcome_message: template.welcome_message, fallback_message: template.fallback_message,
      role: template.behavior.role as "sales" | "support" | "hybrid",
      friendliness: template.personality.friendliness, detail_level: template.personality.detail_level,
      formality: template.personality.formality, sales_aggressiveness: template.personality.sales_aggressiveness,
      emoji_usage: template.personality.emoji_usage, humor_level: template.personality.humor_level,
      persuasion_level: template.personality.persuasion_level,
      product_recommendation: template.behavior.product_recommendation, lead_capture: template.behavior.lead_capture,
      upsell: template.behavior.upsell, custom_instructions: template.behavior.custom_instructions,
    });
    setStep(1);
  };

  const handleCreate = () => {
    if (!user || !form.name.trim()) return;
    const agent = createAgent({
      user_id: user.uuid, name: form.name, welcome_message: form.welcome_message, fallback_message: form.fallback_message,
      personality: { friendliness: form.friendliness, detail_level: form.detail_level, formality: form.formality, sales_aggressiveness: form.sales_aggressiveness, emoji_usage: form.emoji_usage, humor_level: form.humor_level, persuasion_level: form.persuasion_level },
      behavior: { role: form.role, product_recommendation: form.product_recommendation, lead_capture: form.lead_capture, upsell: form.upsell, custom_instructions: form.custom_instructions },
      status: "active",
    });
    // Auto-add sample training data from template
    if (selectedTemplate?.sample_training_text) {
      addTrainingSource({ agent_id: agent.id, type: "text", name: "Template Training Data", content: selectedTemplate.sample_training_text, status: "completed" });
    }
    router.push(`/dashboard/agents/${agent.id}`);
  };

  const SliderField = ({ label, value, onChange, leftLabel, rightLabel }: { label: string; value: number; onChange: (v: number) => void; leftLabel: string; rightLabel: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm"><Label>{label}</Label><span className="text-muted-foreground">{value}%</span></div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" />
      <div className="flex justify-between text-xs text-muted-foreground"><span>{leftLabel}</span><span>{rightLabel}</span></div>
    </div>
  );

  const totalSteps = 4;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold">Create AI Agent</h2><p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {totalSteps} — {step === 0 ? "Choose Template" : step === 1 ? "Basic Info" : step === 2 ? "Personality" : "Behavior"}</p></div>
      <div className="flex gap-1">{Array.from({ length: totalSteps }, (_, i) => <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-white" : "bg-zinc-800"}`} />)}</div>

      {/* Step 0: Template Selection */}
      {step === 0 && (
        <div className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5" /> Start from a Template</CardTitle>
              <CardDescription>Pick a pre-built agent to get started in 60 seconds, or create from scratch</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {agentTemplates.map((t) => (
                <button key={t.id} onClick={() => applyTemplate(t)} className="text-left p-4 rounded-xl border border-border/50 hover:border-border hover:bg-accent/30 transition-all group">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm group-hover:text-white transition-colors">{t.name}</div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      <Badge variant="outline" className="mt-2 text-[10px]">{t.category}</Badge>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform mt-1 shrink-0" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          <div className="text-center">
            <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Or <span className="underline">start from scratch</span> →
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle>Basic Information</CardTitle><CardDescription>Name your agent and set its messages</CardDescription></div>
              {selectedTemplate && <Badge variant="outline" className="text-xs">{selectedTemplate.emoji} {selectedTemplate.name}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label>Agent Name *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Sales Assistant Pro" className="bg-zinc-950 border-zinc-800" /></div>
            <div className="space-y-2"><Label>Welcome Message</Label><textarea value={form.welcome_message} onChange={(e) => update("welcome_message", e.target.value)} rows={3} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div className="space-y-2"><Label>Fallback Message</Label><textarea value={form.fallback_message} onChange={(e) => update("fallback_message", e.target.value)} rows={2} className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            <div className="space-y-2">
              <Label>Agent Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["sales", "support", "hybrid"] as const).map(r => (
                  <button key={r} onClick={() => update("role", r)} className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all ${form.role === r ? "border-white bg-zinc-800" : "border-zinc-800 hover:border-zinc-700"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" /> Templates</Button>
              <Button onClick={() => setStep(2)} disabled={!form.name.trim()} className="flex-1">Next: Personality <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Personality */}
      {step === 2 && (
        <Card className="border-border/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Personality System</CardTitle><CardDescription>Control how your AI agent communicates</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <SliderField label="Friendliness" value={form.friendliness} onChange={(v) => update("friendliness", v)} leftLabel="Professional" rightLabel="Very Friendly" />
            <SliderField label="Detail Level" value={form.detail_level} onChange={(v) => update("detail_level", v)} leftLabel="Concise" rightLabel="Very Detailed" />
            <SliderField label="Formality" value={form.formality} onChange={(v) => update("formality", v)} leftLabel="Casual" rightLabel="Very Formal" />
            <SliderField label="Sales Aggressiveness" value={form.sales_aggressiveness} onChange={(v) => update("sales_aggressiveness", v)} leftLabel="Soft Sell" rightLabel="Aggressive" />
            <SliderField label="Emoji Usage" value={form.emoji_usage} onChange={(v) => update("emoji_usage", v)} leftLabel="None" rightLabel="Heavy" />
            <SliderField label="Humor Level" value={form.humor_level} onChange={(v) => update("humor_level", v)} leftLabel="Serious" rightLabel="Humorous" />
            <SliderField label="Persuasion Level" value={form.persuasion_level} onChange={(v) => update("persuasion_level", v)} leftLabel="Informative" rightLabel="Persuasive" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Next: Behavior <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Behavior */}
      {step === 3 && (
        <Card className="border-border/50">
          <CardHeader><CardTitle>Behavior & Rules</CardTitle><CardDescription>Configure what your AI agent can do</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            {[{ key: "product_recommendation", label: "Product Recommendations", desc: "Agent recommends products based on conversation" },
              { key: "lead_capture", label: "Lead Capture", desc: "Collect visitor contact information" },
              { key: "upsell", label: "Upselling", desc: "Suggest upgrades and complementary products" }
            ].map(opt => (
              <div key={opt.key} className="flex items-center justify-between p-4 rounded-lg border border-zinc-800">
                <div><div className="font-medium text-sm">{opt.label}</div><div className="text-xs text-muted-foreground">{opt.desc}</div></div>
                <button onClick={() => update(opt.key, !(form as any)[opt.key])} className={`h-6 w-11 rounded-full transition-colors relative ${(form as any)[opt.key] ? "bg-white" : "bg-zinc-700"}`}>
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-zinc-900 transition-all ${(form as any)[opt.key] ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
            <div className="space-y-2"><Label>Custom Instructions</Label><textarea value={form.custom_instructions} onChange={(e) => update("custom_instructions", e.target.value)} rows={4} placeholder="Any specific rules or instructions for the agent..." className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
            {selectedTemplate && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-sm">
                <div className="flex items-center gap-2 font-medium text-emerald-400"><Zap className="h-4 w-4" /> Template training data included</div>
                <p className="text-xs text-muted-foreground mt-1">Sample training text from the "{selectedTemplate.name}" template will be auto-added.</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
              <Button onClick={handleCreate} className="flex-1 bg-white text-black hover:bg-zinc-200"><Bot className="mr-2 h-4 w-4" /> Create Agent</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

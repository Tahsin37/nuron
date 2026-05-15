"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getAgent, updateAgent, deleteAgent, getTrainingSources, addTrainingSource, deleteTrainingSource, getConversations, getLeads } from "@/lib/store";
import { buildAgentSystemPrompt } from "@/lib/rag";
import type { Agent, TrainingSource } from "@/lib/types";
import { Bot, Globe, FileText, Type, Table, Trash2, Plus, Code, Copy, Check, MessageSquare, Users, ImagePlus, Send, Loader2, Save, AlertTriangle } from "lucide-react";

// ==================== Toast Notification ====================
function Toast({ message, show }: { message: string; show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
        <Check className="h-4 w-4 text-emerald-400" />
        {message}
      </div>
    </div>
  );
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [sources, setSources] = useState<TrainingSource[]>([]);
  const [copied, setCopied] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newText, setNewText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState({ message: "", show: false });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Personality editing state
  const [personality, setPersonality] = useState({
    friendliness: 70, detail_level: 60, formality: 40,
    sales_aggressiveness: 50, emoji_usage: 40, humor_level: 25, persuasion_level: 60,
  });
  const [personalityDirty, setPersonalityDirty] = useState(false);

  // Test Chat state
  const [chatMessages, setChatMessages] = useState<{ id: string; role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: "", show: false }), 2500);
  };

  useEffect(() => {
    setMounted(true);
    const a = getAgent(agentId);
    if (a) {
      setAgent(a);
      setPersonality(a.personality);
    }
    setSources(getTrainingSources(agentId));
  }, [agentId]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  if (!mounted || !agent) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  const conversations = getConversations(agentId);
  const leads = getLeads(agentId);

  const embedCode = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://app.nuronai.com'}/embed.js" data-agent-id="${agent.id}" data-color="#ffffff" async></script>`;
  const widgetPreviewUrl = `/widget/${agent.id}`;

  const handleCopy = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    addTrainingSource({ agent_id: agentId, type: "url", name: newUrl, url: newUrl, content: `[Reference URL] The agent should be aware this URL is part of the business: ${newUrl}`, status: "completed" });
    setSources(getTrainingSources(agentId));
    setNewUrl("");
    showToast("URL added to knowledge base");
  };

  const handleAddText = () => {
    if (!newText.trim()) return;
    addTrainingSource({ agent_id: agentId, type: "text", name: `Text ${sources.length + 1}`, content: newText, status: "completed" });
    setSources(getTrainingSources(agentId));
    setNewText("");
    showToast("Training text added successfully");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      addTrainingSource({
        agent_id: agentId,
        type: "image",
        name: file.name,
        content: `[IMAGE: ${file.name}] This is a visual reference image for the agent's knowledge base. Image type: ${file.type}, Size: ${(file.size / 1024).toFixed(1)}KB. Base64 data is stored for context.`,
        url: base64,
        status: "completed",
      });
      setSources(getTrainingSources(agentId));
      showToast(`Image "${file.name}" added to training`);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteSource = (id: string) => {
    deleteTrainingSource(id);
    setSources(getTrainingSources(agentId));
    showToast("Training source removed");
  };

  const handleSavePersonality = () => {
    updateAgent(agentId, { personality });
    setPersonalityDirty(false);
    const updated = getAgent(agentId);
    if (updated) setAgent(updated);
    showToast("Personality settings saved");
  };

  const handleDeleteAgent = () => {
    deleteAgent(agentId);
    router.push("/dashboard/agents");
  };

  // Test Chat logic
  const handleTestChat = useCallback(async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { id: crypto.randomUUID(), role: "user" as const, content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const puter = (window as any).puter;
      if (!puter?.ai) throw new Error("Puter not ready");

      const currentAgent = getAgent(agentId);
      const systemPrompt = currentAgent ? buildAgentSystemPrompt(currentAgent) : "You are a helpful assistant.";
      const history = [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const response = await puter.ai.chat("gpt-4.1", [{ role: "system", content: systemPrompt }, ...history]);
      const content = response?.message?.content || response?.toString() || "I couldn't generate a response.";
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content }]);
    } catch {
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "⚠️ AI not available. Make sure you're signed in to Puter." }]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, agentId]);

  const SliderField = ({ label, value, onChange, leftLabel, rightLabel }: { label: string; value: number; onChange: (v: number) => void; leftLabel: string; rightLabel: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm"><Label className="capitalize">{label.replace(/_/g, " ")}</Label><span className="text-muted-foreground">{value}%</span></div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white" />
      <div className="flex justify-between text-xs text-muted-foreground"><span>{leftLabel}</span><span>{rightLabel}</span></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Toast message={toast.message} show={toast.show} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-zinc-800 flex items-center justify-center text-2xl font-bold">{agent.name[0]}</div>
          <div>
            <h2 className="text-2xl font-bold">{agent.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={agent.status === "active" ? "default" : "secondary"} className={agent.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}>{agent.status}</Badge>
              <span className="text-sm text-muted-foreground capitalize">{agent.behavior.role} agent</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 className="h-4 w-4 mr-1" /> Delete Agent
        </Button>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <div className="font-medium text-sm">Delete &ldquo;{agent.name}&rdquo;?</div>
                <div className="text-xs text-muted-foreground">This will permanently delete the agent, all training data, leads, and conversations.</div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={handleDeleteAgent}>Yes, Delete</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><MessageSquare className="h-5 w-5 text-purple-400" /><div><div className="text-2xl font-bold">{conversations.length}</div><div className="text-xs text-muted-foreground">Conversations</div></div></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><Users className="h-5 w-5 text-emerald-400" /><div><div className="text-2xl font-bold">{leads.length}</div><div className="text-xs text-muted-foreground">Leads</div></div></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 flex items-center gap-3"><FileText className="h-5 w-5 text-blue-400" /><div><div className="text-2xl font-bold">{sources.length}</div><div className="text-xs text-muted-foreground">Training Sources</div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="training" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-border/50 w-full justify-start overflow-x-auto overflow-y-hidden h-12 shrink-0">
          <TabsTrigger value="training" className="whitespace-nowrap">Training</TabsTrigger>
          <TabsTrigger value="test" className="whitespace-nowrap">Test Chat</TabsTrigger>
          <TabsTrigger value="embed" className="whitespace-nowrap">Embed Widget</TabsTrigger>
          <TabsTrigger value="personality" className="whitespace-nowrap">Personality</TabsTrigger>
        </TabsList>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base">Add Training Data</CardTitle><CardDescription>Teach your agent about your business — paste text, add URLs, or upload images</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {/* URL */}
              <div className="flex flex-col sm:flex-row gap-2"><div className="relative flex-1"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://your-website.com" className="pl-10 bg-zinc-950 border-zinc-800" /></div><Button onClick={handleAddUrl} className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-1" /> Add URL</Button></div>
              {/* Text */}
              <div className="space-y-2">
                <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={3} placeholder="Paste product descriptions, FAQs, pricing info, or any text about your business..." className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{newText.length > 0 ? `${newText.length} characters` : ""}</span>
                  <Button onClick={handleAddText} variant="outline" disabled={!newText.trim()}><Type className="h-4 w-4 mr-1" /> Add Text</Button>
                </div>
              </div>
              {/* Image Upload */}
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-zinc-800 text-sm hover:bg-zinc-800/50 transition-colors">
                    <ImagePlus className="h-4 w-4 mr-1" /> Upload Image
                  </div>
                </label>
                <Button variant="outline" disabled><FileText className="h-4 w-4 mr-1" /> Upload PDF <Badge variant="outline" className="ml-1 text-[9px]">Soon</Badge></Button>
                <Button variant="outline" disabled><Table className="h-4 w-4 mr-1" /> Google Sheets <Badge variant="outline" className="ml-1 text-[9px]">Soon</Badge></Button>
              </div>
            </CardContent>
          </Card>
          {sources.length > 0 && (
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-base">Training Sources ({sources.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {sources.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3 min-w-0">
                      {s.type === "url" ? <Globe className="h-4 w-4 text-blue-400 shrink-0" /> : s.type === "image" ? <ImagePlus className="h-4 w-4 text-pink-400 shrink-0" /> : s.type === "pdf" ? <FileText className="h-4 w-4 text-red-400 shrink-0" /> : s.type === "google_sheets" ? <Table className="h-4 w-4 text-green-400 shrink-0" /> : <Type className="h-4 w-4 text-purple-400 shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{s.type} • {s.status}{s.content ? ` • ${s.content.length} chars` : ""}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSource(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Chat Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-base flex items-center gap-2"><Bot className="h-5 w-5" /> Test Your Agent</CardTitle><CardDescription>Chat with your agent to test its personality and knowledge</CardDescription></div>
                <Button size="sm" variant="outline" onClick={() => setChatMessages([])}>Clear Chat</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={chatScrollRef} className="h-80 overflow-y-auto rounded-xl border border-border/30 bg-zinc-950 p-4 space-y-3 mb-3">
                {chatMessages.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Send a message to test your agent&apos;s responses
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role === "assistant" && <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5"><Bot className="h-3 w-3 text-zinc-400" /></div>}
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === "assistant" ? "bg-zinc-800/80 text-zinc-200" : "bg-white text-black"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center shrink-0"><Bot className="h-3 w-3 text-zinc-400" /></div>
                    <div className="bg-zinc-800/80 rounded-xl px-3 py-2"><div className="flex gap-1"><span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" /><span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" /><span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" /></div></div>
                  </div>
                )}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleTestChat(); }} className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a test message..." className="bg-zinc-950 border-zinc-800" disabled={chatLoading} />
                <Button type="submit" disabled={!chatInput.trim() || chatLoading}>
                  {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Tab */}
        <TabsContent value="embed" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Code className="h-5 w-5" /> Embed Widget</CardTitle><CardDescription>Add your AI agent to any website with a single line of code</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium"><span className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">1</span> Copy the embed code</div>
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-emerald-400 overflow-x-auto"><code>{embedCode}</code></pre>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="absolute top-2 right-2">
                    {copied ? <><Check className="h-3.5 w-3.5 mr-1" /> Copied!</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium"><span className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">2</span> Paste before the closing <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">&lt;/body&gt;</code> tag</div>
                <p className="text-sm text-muted-foreground">The widget will appear as a floating chat button on the bottom-right of your website.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium"><span className="h-6 w-6 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">3</span> Customize (optional)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                  <div className="p-3 rounded-lg border border-border/30 bg-zinc-950/50"><code className="text-emerald-400">data-color</code><br/>Widget button color</div>
                  <div className="p-3 rounded-lg border border-border/30 bg-zinc-950/50"><code className="text-emerald-400">data-position</code><br/>bottom-right or bottom-left</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base">Live Preview</CardTitle><CardDescription>This is how your widget chat looks to visitors</CardDescription></CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-border/30 overflow-hidden bg-zinc-950" style={{ height: 500 }}>
                <iframe src={widgetPreviewUrl} className="w-full h-full border-0" title="Widget Preview" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personality Tab — Now Editable! */}
        <TabsContent value="personality">
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Personality Settings</CardTitle>
                {personalityDirty && <Badge variant="outline" className="text-amber-400 border-amber-500/30">Unsaved changes</Badge>}
              </div>
              <CardDescription>Adjust these sliders to control how your AI agent communicates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderField label="friendliness" value={personality.friendliness} onChange={(v) => { setPersonality(p => ({ ...p, friendliness: v })); setPersonalityDirty(true); }} leftLabel="Professional" rightLabel="Very Friendly" />
              <SliderField label="detail_level" value={personality.detail_level} onChange={(v) => { setPersonality(p => ({ ...p, detail_level: v })); setPersonalityDirty(true); }} leftLabel="Concise" rightLabel="Very Detailed" />
              <SliderField label="formality" value={personality.formality} onChange={(v) => { setPersonality(p => ({ ...p, formality: v })); setPersonalityDirty(true); }} leftLabel="Casual" rightLabel="Very Formal" />
              <SliderField label="sales_aggressiveness" value={personality.sales_aggressiveness} onChange={(v) => { setPersonality(p => ({ ...p, sales_aggressiveness: v })); setPersonalityDirty(true); }} leftLabel="Soft Sell" rightLabel="Aggressive" />
              <SliderField label="emoji_usage" value={personality.emoji_usage} onChange={(v) => { setPersonality(p => ({ ...p, emoji_usage: v })); setPersonalityDirty(true); }} leftLabel="None" rightLabel="Heavy" />
              <SliderField label="humor_level" value={personality.humor_level} onChange={(v) => { setPersonality(p => ({ ...p, humor_level: v })); setPersonalityDirty(true); }} leftLabel="Serious" rightLabel="Humorous" />
              <SliderField label="persuasion_level" value={personality.persuasion_level} onChange={(v) => { setPersonality(p => ({ ...p, persuasion_level: v })); setPersonalityDirty(true); }} leftLabel="Informative" rightLabel="Persuasive" />
              <Button onClick={handleSavePersonality} disabled={!personalityDirty} className="w-full bg-white text-black hover:bg-zinc-200">
                <Save className="h-4 w-4 mr-2" /> Save Personality
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

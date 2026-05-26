"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, Loader2, Brain, Sparkles, Package, Clock, ChevronDown,
  ChevronRight, Flame, Snowflake, AlertTriangle, Cpu, Hash,
  BarChart3, MessageSquare, RefreshCw, Zap, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface DebugData {
  provider?: string;
  model?: string;
  tokensUsed?: number;
  processingTimeMs?: number;
  systemPromptUsed?: string;
  legacyIntent?: { level: string; confidence: number; shouldFlagHuman: boolean };
  stockSummary?: { name: string; price: string; stock: string; sku: string | null }[];
  totalProducts?: number;
  knowledgeBaseEntries?: number;
  error?: string;
}

interface AIResponse {
  reply: string;
  sentiment?: { tag: string; confidence: number; shouldHandoff: boolean; reason?: string };
  suggestedReplies?: string[];
  matchedProducts?: { id: string; name: string; price: string; stock_status: string; similarity?: number }[];
  debug?: DebugData;
}

const sentimentConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; gradient: string }> = {
  ready_to_buy: { icon: <Flame className="h-4 w-4" />, label: "Ready to Buy", color: "text-amber-400", bg: "bg-amber-500/15", gradient: "from-amber-500 to-orange-500" },
  window_shopper: { icon: <Snowflake className="h-4 w-4" />, label: "Window Shopper", color: "text-blue-400", bg: "bg-blue-500/15", gradient: "from-blue-500 to-cyan-500" },
  frustrated: { icon: <AlertTriangle className="h-4 w-4" />, label: "Frustrated", color: "text-red-400", bg: "bg-red-500/15", gradient: "from-red-500 to-rose-500" },
};

export default function PlaygroundPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !user?.uuid) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setLastResponse(null);

    try {
      const res = await fetch("/api/ai/test-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: user.uuid,
          message: userMsg.content,
          session_history: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data: AIResponse = await res.json();
      const aiMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", content: data.reply || "No response", timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
      setLastResponse(data);
    } catch {
      const errMsg: ChatMsg = { id: crypto.randomUUID(), role: "assistant", content: "⚠️ Failed to connect to the AI engine. Check your settings.", timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setMessages([]);
    setLastResponse(null);
    setShowSystemPrompt(false);
    setShowStock(false);
  };

  const sentiment = lastResponse?.sentiment?.tag ? sentimentConfig[lastResponse.sentiment.tag] : null;
  const debug = lastResponse?.debug;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            Bot Playground
          </h2>
          <p className="text-muted-foreground text-xs mt-1">Test your AI bot before deploying. Messages stay in this sandbox.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs rounded-lg border-white/10 hover:bg-white/5">
          <RefreshCw className="h-3 w-3 mr-1.5" /> Reset
        </Button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[calc(100vh-240px)]">

        {/* ═══ LEFT: Chat Simulator (Smartphone Frame) ═══ */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="w-full max-w-[380px]">
            {/* Phone Frame */}
            <div className="rounded-[2.5rem] border-2 border-zinc-700/60 bg-zinc-950 shadow-2xl shadow-black/50 overflow-hidden">
              {/* Notch / Status Bar */}
              <div className="bg-zinc-900 px-6 pt-3 pb-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
                  <span className="font-medium">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1,2,3,4].map(i => <div key={i} className="w-1 h-1.5 bg-zinc-500 rounded-sm" style={{height: `${3 + i}px`}} />)}
                    </div>
                    <span className="ml-1">●</span>
                  </div>
                </div>
                {/* Chat Header */}
                <div className="flex items-center gap-3 pb-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Your AI Bot</p>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400">Online</span>
                    </div>
                  </div>
                  {messages.length > 0 && (
                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{messages.length} msgs</span>
                  )}
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="h-[420px] overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-zinc-950 to-black/95">
                {messages.length === 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
                      <MessageSquare className="h-7 w-7 text-violet-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">Send a test message</p>
                    <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">Type anything a customer might say.<br/>Try &ldquo;What products do you have?&rdquo;</p>
                  </motion.div>
                )}

                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-lg",
                        msg.role === "user"
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-br-md"
                          : "bg-zinc-800/90 border border-white/5 text-zinc-100 rounded-bl-md"
                      )}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={cn("text-[9px] mt-1 text-right", msg.role === "user" ? "text-white/50" : "text-zinc-500")}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-zinc-800/90 border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="h-2 w-2 bg-zinc-500 rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={msgEndRef} />
              </div>

              {/* Input Bar */}
              <div className="px-3 py-3 bg-zinc-900 border-t border-zinc-800">
                <div className="flex gap-2 items-center">
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 h-10 bg-zinc-800 border-zinc-700 rounded-full px-4 text-sm focus-visible:ring-1 focus-visible:ring-violet-500/50 placeholder:text-zinc-500"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 shadow-lg shadow-violet-500/20 transition-all shrink-0"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Home Indicator */}
              <div className="bg-zinc-900 pb-2 pt-1 flex justify-center">
                <div className="w-24 h-1 rounded-full bg-zinc-700" />
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RIGHT: AI Brain Debugger ═══ */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold">AI Brain Debugger</h3>
            <span className="text-[10px] text-muted-foreground bg-zinc-800 px-2 py-0.5 rounded-full">Live</span>
          </div>

          {!lastResponse ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-12 flex flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-zinc-800/50 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400">Waiting for test message</p>
              <p className="text-xs text-zinc-600 mt-1">Send a message in the chat to see AI debug data</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Sentiment Card */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Sentiment Classification
                  </h4>
                  {lastResponse.sentiment?.shouldHandoff && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-semibold">HANDOFF TRIGGERED</span>
                  )}
                </div>
                {sentiment ? (
                  <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-xl ${sentiment.bg} flex items-center justify-center`}>
                      {lastResponse.sentiment?.tag === "ready_to_buy" && <Flame className={`h-6 w-6 ${sentiment.color}`} />}
                      {lastResponse.sentiment?.tag === "window_shopper" && <Snowflake className={`h-6 w-6 ${sentiment.color}`} />}
                      {lastResponse.sentiment?.tag === "frustrated" && <AlertTriangle className={`h-6 w-6 ${sentiment.color}`} />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-lg font-bold ${sentiment.color}`}>{sentiment.label}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(lastResponse.sentiment?.confidence || 0) * 100}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full bg-gradient-to-r ${sentiment.gradient}`}
                          />
                        </div>
                        <span className="text-xs text-zinc-400 font-mono">{((lastResponse.sentiment?.confidence || 0) * 100).toFixed(0)}%</span>
                      </div>
                      {lastResponse.sentiment?.reason && (
                        <p className="text-[11px] text-zinc-500 mt-1.5">{lastResponse.sentiment.reason}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No classification available</p>
                )}
              </motion.div>

              {/* Matched Products */}
              {lastResponse.matchedProducts && lastResponse.matchedProducts.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-3">
                    <Package className="h-3.5 w-3.5" /> Vision Matched Products
                  </h4>
                  <div className="space-y-2">
                    {lastResponse.matchedProducts.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-zinc-500">{p.price} • {p.stock_status === "in_stock" ? "✅ In Stock" : p.stock_status === "out_of_stock" ? "❌ Out of Stock" : "⏳ Pre-order"}</p>
                        </div>
                        {p.similarity !== undefined && (
                          <span className="text-xs font-mono text-violet-400">{(p.similarity * 100).toFixed(0)}% match</span>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Provider & Performance */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-3">
                  <Cpu className="h-3.5 w-3.5" /> Provider & Performance
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Provider", value: debug?.provider || "—", icon: <Sparkles className="h-3 w-3" /> },
                    { label: "Model", value: debug?.model || "—", icon: <Brain className="h-3 w-3" /> },
                    { label: "Tokens", value: debug?.tokensUsed ? String(debug.tokensUsed) : "—", icon: <Hash className="h-3 w-3" /> },
                    { label: "Latency", value: debug?.processingTimeMs ? `${debug.processingTimeMs}ms` : "—", icon: <Clock className="h-3 w-3" /> },
                  ].map(item => (
                    <div key={item.label} className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/50">
                      <div className="flex items-center gap-1.5 text-zinc-500 mb-1">{item.icon}<span className="text-[10px] uppercase tracking-wider">{item.label}</span></div>
                      <p className="text-sm font-semibold font-mono truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
                {debug?.totalProducts !== undefined && (
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Package className="h-3 w-3" /> {debug.totalProducts} products loaded
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <BarChart3 className="h-3 w-3" /> {debug.knowledgeBaseEntries || 0} KB entries
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Inventory Stock Summary */}
              {debug?.stockSummary && debug.stockSummary.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm overflow-hidden">
                  <button onClick={() => setShowStock(!showStock)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5" /> Injected Inventory ({debug.stockSummary.length})
                    </h4>
                    {showStock ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                  </button>
                  {showStock && (
                    <div className="px-4 pb-4">
                      <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-zinc-900/60 text-zinc-500"><th className="text-left px-3 py-2 font-medium">Product</th><th className="text-left px-3 py-2 font-medium">Price</th><th className="text-left px-3 py-2 font-medium">Stock</th></tr></thead>
                          <tbody>
                            {debug.stockSummary.map((item, i) => (
                              <tr key={i} className="border-t border-zinc-800/30">
                                <td className="px-3 py-2 font-medium truncate max-w-[150px]">{item.name}</td>
                                <td className="px-3 py-2 text-zinc-400">{item.price}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${item.stock === "in_stock" ? "bg-emerald-500/15 text-emerald-400" : item.stock === "out_of_stock" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>
                                    {item.stock === "in_stock" ? "In Stock" : item.stock === "out_of_stock" ? "Out" : "Pre-order"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* System Prompt Viewer */}
              {debug?.systemPromptUsed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm overflow-hidden">
                  <button onClick={() => setShowSystemPrompt(!showSystemPrompt)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900/30 transition-colors">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Brain className="h-3.5 w-3.5" /> System Instructions
                    </h4>
                    {showSystemPrompt ? <ChevronDown className="h-4 w-4 text-zinc-500" /> : <ChevronRight className="h-4 w-4 text-zinc-500" />}
                  </button>
                  {showSystemPrompt && (
                    <div className="px-4 pb-4">
                      <pre className="text-[11px] text-zinc-400 bg-zinc-900/60 border border-zinc-800/50 rounded-lg p-4 max-h-[300px] overflow-auto whitespace-pre-wrap font-mono leading-relaxed">
                        {debug.systemPromptUsed}
                      </pre>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Suggested Replies Preview */}
              {lastResponse.suggestedReplies && lastResponse.suggestedReplies.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
                    <Sparkles className="h-3.5 w-3.5" /> Pre-drafted Handoff Replies
                  </h4>
                  <div className="space-y-2">
                    {lastResponse.suggestedReplies.map((reply, i) => (
                      <div key={i} className="text-sm px-3 py-2.5 rounded-lg bg-zinc-900/80 border border-amber-500/10 text-zinc-300 flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-amber-500/15 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">{i + 1}</span>
                        {reply}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

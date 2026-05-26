"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Bot, Send, Loader2, ArrowLeft, Search, UserCircle, CheckCircle2, HandMetal, RotateCcw, Zap, X, Flame, Snowflake, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message { id: string; role: string; content: string; timestamp: string; }
interface Conv {
  id: string; visitor_name: string; status: string; source: string;
  messages: Message[]; last_message_at: string; started_at: string;
  visitor_id: string; sentiment_tag?: string; suggested_replies?: string[];
  abandoned_cart_triggered?: boolean;
}

const QUICK_REPLIES = [
  "Thank you for your interest! How can I help?",
  "This item is currently in stock. Would you like to order?",
  "We offer Cash on Delivery across Bangladesh.",
  "Could you please share your Name, Phone, and Address to place the order?",
  "I'll check with our team and get back to you shortly.",
  "Sorry, this item is currently out of stock. Can I suggest an alternative?",
];

const sentimentConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
  ready_to_buy: { icon: <Flame className="h-3 w-3" />, label: "Ready to Buy", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  window_shopper: { icon: <Snowflake className="h-3 w-3" />, label: "Browsing", color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  frustrated: { icon: <AlertTriangle className="h-3 w-3" />, label: "Frustrated", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/30" },
};

export default function InboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "needs_human" | "ai_handled">("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const fetchConvs = useCallback(() => {
    if (!user?.uuid) return;
    fetch(`/api/conversations?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => {
        const convs = data.conversations || [];
        setConversations(convs);
        if (convs.length > 0 && !selected) setSelected(convs[0].id);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.uuid, selected]);

  useEffect(() => { setLoading(true); fetchConvs(); }, [fetchConvs]);
  useEffect(() => { const t = setInterval(fetchConvs, 15000); return () => clearInterval(t); }, [fetchConvs]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selected, conversations]);

  const filteredConvs = conversations.filter(c => {
    if (filter === "needs_human") return c.status === "needs_human";
    if (filter === "ai_handled") return c.status === "resolved" || c.status === "active";
    return true;
  }).filter(c => !search || (c.visitor_name || "").toLowerCase().includes(search.toLowerCase()));

  const selectedConv = conversations.find(c => c.id === selected);
  const sentiment = selectedConv?.sentiment_tag ? sentimentConfig[selectedConv.sentiment_tag] : null;
  const aiSuggestions = selectedConv?.suggested_replies && Array.isArray(selectedConv.suggested_replies) && selectedConv.suggested_replies.length > 0 ? selectedConv.suggested_replies : null;

  const handleSendReply = async (text?: string) => {
    const replyContent = text || replyText.trim();
    if (!replyContent || !selectedConv || !user?.uuid) return;
    setSendingReply(true);
    setReplyText("");
    const msg: Message = { id: crypto.randomUUID(), role: "assistant", content: replyContent, timestamp: new Date().toISOString() };
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, messages: [...c.messages, msg] } : c));
    await fetch("/api/conversations/reply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: selectedConv.id, content: replyContent, user_id: user.uuid }),
    }).catch(() => {});
    setSendingReply(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedConv || !user?.uuid) return;
    setStatusUpdating(true);
    await fetch("/api/conversations/reply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: selectedConv.id, new_status: newStatus, user_id: user.uuid }),
    }).catch(() => {});
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, status: newStatus } : c));
    setStatusUpdating(false);
  };

  const srcLabel = (s: string) => s === "telegram" ? "Telegram" : s === "messenger" ? "Messenger" : s === "whatsapp" ? "WhatsApp" : s || "Unknown";
  const srcColor = (s: string) => s === "telegram" ? "text-blue-400" : s === "messenger" ? "text-indigo-400" : s === "whatsapp" ? "text-emerald-400" : "text-zinc-400";
  const showDetail = !!selected;

  const profile = selectedConv ? {
    name: selectedConv.visitor_name || "Unknown",
    id: selectedConv.visitor_id || "—",
    source: selectedConv.source,
    firstSeen: selectedConv.started_at ? new Date(selectedConv.started_at).toLocaleDateString() : "—",
    lastActive: selectedConv.last_message_at ? new Date(selectedConv.last_message_at).toLocaleString() : "—",
    msgCount: Array.isArray(selectedConv.messages) ? selectedConv.messages.length : 0,
    customerMsgs: Array.isArray(selectedConv.messages) ? selectedConv.messages.filter(m => m.role === "user").length : 0,
  } : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Inbox</h2>
          <p className="text-muted-foreground text-xs mt-0.5">{conversations.length} conversations • Auto-refreshes</p>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-border/50 self-start">
          {[
            { key: "all", label: "All", count: conversations.length },
            { key: "needs_human", label: "Human", count: conversations.filter(c => c.status === "needs_human").length, color: "text-rose-400" },
            { key: "ai_handled", label: "AI", count: conversations.filter(c => c.status !== "needs_human").length, color: "text-emerald-400" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key as any)} className={cn("px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all", filter === f.key ? "bg-zinc-800 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {f.label} <span className={cn("ml-0.5", f.color)}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 h-[calc(100vh-185px)] sm:h-[calc(100vh-200px)] min-h-[400px]">
        {/* List */}
        <Card className={cn("border-border/50 overflow-hidden flex flex-col w-full lg:w-80 shrink-0", showDetail ? "hidden lg:flex" : "flex")}>
          <div className="p-2 border-b border-border/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..." className="h-8 pl-8 text-xs bg-zinc-950 border-zinc-800" />
            </div>
          </div>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full"><Loader2 className="h-5 w-5 mb-2 animate-spin opacity-50" /><p className="text-xs">Loading...</p></div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <div className="h-10 w-10 mx-auto mb-2 rounded-xl bg-zinc-800 flex items-center justify-center"><MessageSquare className="h-5 w-5 opacity-50" /></div>
                <p className="text-xs font-medium">No conversations</p>
                <p className="text-[10px] mt-1 opacity-70">Messages will appear here when customers contact your bot</p>
              </div>
            ) : filteredConvs.map(conv => {
              const s = conv.sentiment_tag ? sentimentConfig[conv.sentiment_tag] : null;
              return (
                <button key={conv.id} onClick={() => { setSelected(conv.id); setShowProfile(false); }} className={cn("w-full text-left p-3 border-b border-border/10 hover:bg-accent/20 transition-colors", selected === conv.id && "bg-accent/40 border-l-2 border-l-blue-500")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0">{(conv.visitor_name || "U")[0].toUpperCase()}</div>
                      <span className="font-medium text-xs truncate max-w-[120px]">{conv.visitor_name || "User"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Sentiment Badge */}
                      {s && (
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 ${s.bg} ${s.color} border ${s.border}`}>
                          {s.icon} {s.label}
                        </span>
                      )}
                      {/* Status Badge */}
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${conv.status === "needs_human" ? "bg-rose-500/20 text-rose-400" : conv.status === "resolved" ? "bg-zinc-700 text-zinc-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                        {conv.status === "needs_human" ? "Human" : conv.status === "resolved" ? "Closed" : "AI"}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 truncate pl-9">
                    {Array.isArray(conv.messages) && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1]?.content : "No messages"}
                  </p>
                  <div className="flex items-center justify-between mt-1 pl-9">
                    <span className="text-[9px] text-muted-foreground">{conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ""}</span>
                    <span className={`text-[9px] ${srcColor(conv.source)}`}>{srcLabel(conv.source)}</span>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className={cn("border-border/50 overflow-hidden flex flex-col flex-1 shadow-2xl", !showDetail ? "hidden lg:flex" : "flex")}>
          {selectedConv ? (<>
            {/* Chat Header */}
            <div className="border-b border-border/30 py-3 px-4 sm:px-5 bg-zinc-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <button onClick={() => setSelected(null)} className="lg:hidden p-1.5 rounded-lg hover:bg-accent/50 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center font-bold text-base shrink-0 shadow-inner">{(selectedConv.visitor_name || "U")[0].toUpperCase()}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold">{selectedConv.visitor_name || "User"}</div>
                    {sentiment && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${sentiment.bg} ${sentiment.color} border ${sentiment.border}`}>
                        {sentiment.icon} {sentiment.label}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-0.5 block ${srcColor(selectedConv.source)}`}>
                    {srcLabel(selectedConv.source)} • {selectedConv.status === "needs_human" ? "Waiting for human" : selectedConv.status === "resolved" ? "Resolved" : "AI handling"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedConv.status !== "needs_human" && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-amber-500/30 text-amber-400 hover:bg-amber-500/10" disabled={statusUpdating} onClick={() => handleStatusChange("needs_human")}>
                    <HandMetal className="h-3 w-3 mr-1" /> Take Over
                  </Button>
                )}
                {selectedConv.status === "needs_human" && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" disabled={statusUpdating} onClick={() => handleStatusChange("active")}>
                    <Bot className="h-3 w-3 mr-1" /> Resume AI
                  </Button>
                )}
                {selectedConv.status !== "resolved" && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={statusUpdating} onClick={() => handleStatusChange("resolved")}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Resolve
                  </Button>
                )}
                {selectedConv.status === "resolved" && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={statusUpdating} onClick={() => handleStatusChange("active")}>
                    <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                  </Button>
                )}
                <Button size="sm" variant="ghost" className={cn("h-7 w-7 p-0", showProfile && "bg-accent")} onClick={() => setShowProfile(!showProfile)}>
                  <UserCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                {/* Human Handoff Banner */}
                {selectedConv.status === "needs_human" && (
                  <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-b border-amber-500/20 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-200">AI Handed Off Control</p>
                      <p className="text-[11px] text-amber-300/70">Select a pre-drafted response below to reply instantly, or type your own.</p>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {(Array.isArray(selectedConv.messages) ? selectedConv.messages : []).map((msg, i) => (
                    <div key={msg.id || i} className={cn("flex gap-3", msg.role === "assistant" && "justify-end")}>
                      {msg.role === "user" && <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-bold border border-white/5">{(selectedConv.visitor_name || "U")[0].toUpperCase()}</div>}
                      <div className={cn("rounded-2xl px-4 py-3 max-w-[80%] text-sm sm:text-[15px] shadow-md", msg.role === "user" ? "rounded-tl-sm bg-zinc-800/80 border border-white/5 text-zinc-100" : "rounded-tr-sm bg-zinc-700/40 text-zinc-100 border border-white/10 font-medium")}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className={cn("text-[10px] mt-1.5 text-right font-medium", msg.role === "assistant" ? "text-zinc-400" : "text-muted-foreground/60")}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ""}
                        </div>
                      </div>
                      {msg.role === "assistant" && <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 shadow-md border border-white/10"><Bot className="h-4 w-4 text-zinc-300" /></div>}
                    </div>
                  ))}
                  <div ref={msgEndRef} />
                </div>

                {/* AI Suggested Replies (for human handoff) */}
                {selectedConv.status === "needs_human" && aiSuggestions && (
                  <div className="border-t border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent p-3">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider">AI Suggested Replies</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {aiSuggestions.map((reply, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendReply(reply)}
                          disabled={sendingReply}
                          className="text-left text-sm px-4 py-3 rounded-xl bg-zinc-900/80 border border-amber-500/15 hover:border-amber-500/40 hover:bg-zinc-800/80 transition-all text-zinc-200 group flex items-center gap-3"
                        >
                          <div className="h-6 w-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-amber-400 group-hover:bg-amber-500/20 transition-colors">{i + 1}</div>
                          <span className="flex-1">{reply}</span>
                          <Send className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Replies Drawer (legacy) */}
                {showQuickReplies && !aiSuggestions && (
                  <div className="border-t border-border/20 bg-zinc-950/80 backdrop-blur-md p-3">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Quick Replies</span>
                      <button onClick={() => setShowQuickReplies(false)} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-white/5"><X className="h-4 w-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {QUICK_REPLIES.map((qr, i) => (
                        <button key={i} onClick={() => { setReplyText(qr); setShowQuickReplies(false); }}
                          className="text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-white/5 hover:bg-zinc-800 hover:border-white/20 transition-all text-left max-w-full truncate shadow-sm text-zinc-300">
                          {qr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Box */}
                <div className="p-3 sm:p-4 border-t border-border/20 bg-zinc-950">
                  <div className="flex gap-3 items-center">
                    <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5" onClick={() => setShowQuickReplies(!showQuickReplies)} title="Quick replies">
                      <Zap className="h-5 w-5" />
                    </Button>
                    <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..."
                      className="bg-zinc-900/50 border-white/10 text-sm sm:text-base h-11 flex-1 rounded-xl px-4 focus-visible:ring-1 focus-visible:ring-white/30 transition-all" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendReply()} />
                    <Button onClick={() => handleSendReply()} disabled={!replyText.trim() || sendingReply} className="bg-white hover:bg-zinc-200 text-black h-11 px-5 shrink-0 rounded-xl font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                      {sendingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Send
                    </Button>
                  </div>
                </div>
              </div>

              {/* Customer Profile Sidebar */}
              {showProfile && profile && (
                <div className="w-60 border-l border-border/30 bg-zinc-950/50 p-4 overflow-y-auto hidden md:block">
                  <div className="text-center mb-4">
                    <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold mx-auto mb-2">{profile.name[0].toUpperCase()}</div>
                    <h3 className="text-sm font-semibold">{profile.name}</h3>
                    <span className={`text-[10px] ${srcColor(selectedConv.source)}`}>{srcLabel(selectedConv.source)}</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Status", value: selectedConv.status === "needs_human" ? "Needs Human" : selectedConv.status === "resolved" ? "Resolved" : "AI Active" },
                      { label: "Sentiment", value: sentiment ? sentiment.label : "Not classified" },
                      { label: "Customer ID", value: profile.id.length > 12 ? profile.id.slice(0, 12) + "…" : profile.id },
                      { label: "First Seen", value: profile.firstSeen },
                      { label: "Last Active", value: profile.lastActive },
                      { label: "Total Messages", value: String(profile.msgCount) },
                      { label: "Customer Messages", value: String(profile.customerMsgs) },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                        <p className="text-xs font-medium mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>) : (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <div className="h-14 w-14 mx-auto mb-3 rounded-2xl bg-zinc-800 flex items-center justify-center"><MessageSquare className="h-7 w-7 opacity-50" /></div>
                <p className="text-sm font-medium">Select a conversation</p>
                <p className="text-xs text-muted-foreground mt-1">Click on a conversation to view the chat</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

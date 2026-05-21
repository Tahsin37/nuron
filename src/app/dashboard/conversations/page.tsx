"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Bot, Clock, AlertCircle, Send, Loader2, ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message { id: string; role: string; content: string; timestamp: string; }
interface Conv { id: string; visitor_name: string; status: string; source: string; messages: Message[]; last_message_at: string; }

export default function InboxPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "needs_human" | "ai_handled">("all");
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
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

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConv || !user?.uuid) return;
    await fetch("/api/conversations/reply", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: selectedConv.id, content: replyText, user_id: user.uuid }),
    }).catch(() => {});
    const msg: Message = { id: crypto.randomUUID(), role: "assistant", content: replyText, timestamp: new Date().toISOString() };
    setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, messages: [...c.messages, msg] } : c));
    setReplyText("");
  };

  const srcLabel = (s: string) => s === "telegram" ? "Telegram" : s === "messenger" ? "Messenger" : s;
  const srcColor = (s: string) => s === "telegram" ? "text-blue-400" : s === "messenger" ? "text-indigo-400" : "text-zinc-400";
  const showDetail = !!selected;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Conversations</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">Auto-refreshes every 15s</p>
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-border/50 self-start">
          <button onClick={() => setFilter("all")} className={cn("px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md", filter === "all" ? "bg-zinc-800 text-white" : "text-muted-foreground")}>All</button>
          <button onClick={() => setFilter("needs_human")} className={cn("px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md flex items-center gap-1", filter === "needs_human" ? "bg-rose-500/20 text-rose-400" : "text-muted-foreground")}><AlertCircle className="h-3 w-3" /> Human</button>
          <button onClick={() => setFilter("ai_handled")} className={cn("px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md flex items-center gap-1", filter === "ai_handled" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground")}><Bot className="h-3 w-3" /> AI</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)] sm:h-[calc(100vh-220px)] min-h-[400px]">
        {/* List */}
        <Card className={cn("border-border/50 overflow-hidden flex flex-col", showDetail ? "hidden lg:flex" : "flex")}>
          <div className="p-2 border-b border-border/20">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="h-8 pl-8 text-xs bg-zinc-950 border-zinc-800" />
            </div>
          </div>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full"><Loader2 className="h-5 w-5 mb-2 animate-spin opacity-50" /><p className="text-xs">Loading...</p></div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center h-full"><MessageSquare className="h-7 w-7 mb-2 opacity-50" /><p className="text-xs">No conversations</p></div>
            ) : filteredConvs.map(conv => (
              <button key={conv.id} onClick={() => setSelected(conv.id)} className={cn("w-full text-left p-3 sm:p-4 border-b border-border/20 hover:bg-accent/30 transition-colors", selected === conv.id && "bg-accent/50")}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs sm:text-sm truncate">{conv.visitor_name || "User"}</span>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${conv.status === "needs_human" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {conv.status === "needs_human" ? "Human" : "AI"}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">
                  {Array.isArray(conv.messages) && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1]?.content : "No messages"}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground"><Clock className="h-2.5 w-2.5" /> {conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ""}</div>
                  <span className={`text-[9px] sm:text-[10px] ${srcColor(conv.source)}`}>{srcLabel(conv.source)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detail */}
        <Card className={cn("border-border/50 lg:col-span-2 overflow-hidden flex flex-col", !showDetail ? "hidden lg:flex" : "flex")}>
          {selectedConv ? (<>
            <CardHeader className="border-b border-border/30 py-2.5 sm:py-3 bg-zinc-900/30 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button onClick={() => setSelected(null)} className="lg:hidden p-1 rounded hover:bg-accent"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm sm:text-lg">
                    {(selectedConv.visitor_name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-sm sm:text-base">{selectedConv.visitor_name || "User"}</CardTitle>
                    <span className={`text-[10px] sm:text-xs ${srcColor(selectedConv.source)}`}>{srcLabel(selectedConv.source)}</span>
                  </div>
                </div>
                {selectedConv.status === "needs_human" && (
                  <div className="bg-rose-500/20 text-rose-400 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> <span className="hidden sm:inline">Needs Attention</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {(Array.isArray(selectedConv.messages) ? selectedConv.messages : []).map((msg, i) => (
                <div key={msg.id || i} className={cn("flex gap-2 sm:gap-3", msg.role === "user" && "justify-end")}>
                  {msg.role === "assistant" && <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center shrink-0"><Bot className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" /></div>}
                  <div className={cn("rounded-2xl px-3 py-2 sm:px-4 sm:py-3 max-w-[85%] sm:max-w-md text-xs sm:text-sm shadow-sm", msg.role === "assistant" ? "rounded-tl-sm bg-zinc-800 border border-border/50" : "rounded-tr-sm bg-blue-600 text-white")}>
                    {msg.content}
                    <div className={cn("text-[9px] sm:text-[10px] mt-1 text-right", msg.role === "user" ? "text-blue-200" : "text-muted-foreground")}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ""}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </CardContent>
            <div className="p-3 sm:p-4 border-t border-border/30 bg-zinc-950">
              <div className="flex gap-2">
                <Input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type a reply..."
                  className="bg-zinc-900 border-zinc-800 text-sm h-9" onKeyDown={e => e.key === 'Enter' && handleSendReply()} />
                <Button onClick={handleSendReply} className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 shrink-0 h-9"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </>) : (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center"><MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" /><p className="text-sm">Select a conversation</p></div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

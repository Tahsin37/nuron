"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getConversations, addMessageToConversation } from "@/lib/store";
import type { Conversation, ChatMessage } from "@/lib/types";
import { MessageSquare, Bot, User, Clock, AlertCircle, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "needs_human" | "ai_handled">("all");
  const [replyText, setReplyText] = useState("");
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => { 
    setMounted(true); 
    const c = getConversations(); 
    setConversations(c); 
    if (c.length > 0) setSelected(c[0].id); 
  }, []);
  
  if (!mounted) return null;

  const filteredConvs = conversations.filter(c => {
    if (filter === "needs_human") return c.status === "needs_human";
    if (filter === "ai_handled") return c.status === "resolved" || c.status === "active";
    return true;
  });

  const selectedConv = conversations.find(c => c.id === selected);

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConv) return;
    const newMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: replyText, timestamp: new Date().toISOString() };
    addMessageToConversation(selectedConv.id, newMsg);
    setConversations(getConversations());
    setReplyText("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Messenger Inbox</h2><p className="text-muted-foreground text-sm mt-1">Manage Facebook and Messenger conversations</p></div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-border/50">
          <button onClick={() => setFilter("all")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", filter === "all" ? "bg-zinc-800 text-white" : "text-muted-foreground hover:text-white")}>All</button>
          <button onClick={() => setFilter("needs_human")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5", filter === "needs_human" ? "bg-rose-500/20 text-rose-400" : "text-muted-foreground hover:text-white")}><AlertCircle className="h-3 w-3" /> Needs Human</button>
          <button onClick={() => setFilter("ai_handled")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5", filter === "ai_handled" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-white")}><Bot className="h-3 w-3" /> AI Handled</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation List */}
        <Card className="border-border/50 overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="h-full">
              {filteredConvs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center"><MessageSquare className="h-8 w-8 mb-3 opacity-50" /><p className="text-sm">No conversations found</p></div>
              ) : filteredConvs.map(conv => (
                <button key={conv.id} onClick={() => setSelected(conv.id)} className={cn("w-full text-left p-4 border-b border-border/20 hover:bg-accent/30 transition-colors", selected === conv.id && "bg-accent/50")}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{conv.visitor_name || "Facebook User"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${conv.status === "needs_human" ? "bg-rose-500/20 text-rose-400" : conv.status === "resolved" ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                      {conv.status === "needs_human" ? "Human" : conv.status === "resolved" ? "Resolved" : "AI"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{conv.messages[conv.messages.length - 1]?.content || "No messages"}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" /> {new Date(conv.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    {conv.source === "messenger" && <span className="text-[10px] text-blue-400">Messenger</span>}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card className="border-border/50 lg:col-span-2 overflow-hidden flex flex-col">
          {selectedConv ? (
            <>
              <CardHeader className="border-b border-border/30 py-3 bg-zinc-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-lg">
                      {(selectedConv.visitor_name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedConv.visitor_name || "Facebook User"}</CardTitle>
                      <span className="text-xs text-muted-foreground">{selectedConv.source === "messenger" ? "Messenger" : "Facebook Page"}</span>
                    </div>
                  </div>
                  {selectedConv.status === "needs_human" && (
                    <div className="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" /> Needs Attention
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConv.messages.map(msg => (
                  <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
                    {msg.role === "assistant" && <div className="h-8 w-8 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-blue-400" /></div>}
                    <div className={cn("rounded-2xl px-4 py-3 max-w-md text-sm shadow-sm", msg.role === "assistant" ? "rounded-tl-sm bg-zinc-800 border border-border/50" : "rounded-tr-sm bg-blue-600 text-white")}>
                      {msg.content}
                      <div className={cn("text-[10px] mt-1 text-right", msg.role === "user" ? "text-blue-200" : "text-muted-foreground")}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-4 border-t border-border/30 bg-zinc-950">
                <div className="flex gap-2">
                  <Input 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)} 
                    placeholder="Type a manual reply..." 
                    className="bg-zinc-900 border-zinc-800 focus-visible:ring-1"
                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                  />
                  <Button onClick={handleSendReply} className="bg-blue-600 hover:bg-blue-700 text-white px-4 shrink-0"><Send className="h-4 w-4" /></Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Sending a manual reply will transition this chat to Human Handled.
                </p>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center"><MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>Select a conversation</p></div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

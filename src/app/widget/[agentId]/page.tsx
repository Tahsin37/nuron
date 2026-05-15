"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Bot, Send, User, Loader2, ExternalLink } from "lucide-react";
import { getAgent, initStore, createLead, createConversation, addMessageToConversation } from "@/lib/store";
import { buildAgentSystemPrompt } from "@/lib/rag";

interface Message { id: string; role: "user" | "assistant"; content: string; timestamp: string; }
interface LeadForm { name: string; email: string; phone: string; }

export default function WidgetPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadForm, setLeadForm] = useState<LeadForm>({ name: "", email: "", phone: "" });
  const [puterReady, setPuterReady] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [storeReady, setStoreReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load Puter.js
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).puter) {
      const script = document.createElement("script");
      script.src = "https://js.puter.com/v2/";
      script.async = true;
      script.onload = () => setPuterReady(true);
      document.head.appendChild(script);
    } else if ((window as any).puter) {
      setPuterReady(true);
    }
  }, []);

  // Build system prompt from agent config + training data (RAG)
  useEffect(() => {
    if (!puterReady) return;
    initStore().then(() => {
      setStoreReady(true);
      const agent = getAgent(agentId);
      if (agent) {
        const prompt = buildAgentSystemPrompt(agent);
        setSystemPrompt(prompt);
        // Create a new conversation record
        const conv = createConversation({
          agent_id: agentId,
          visitor_id: `visitor_${crypto.randomUUID().slice(0, 8)}`,
          messages: [{
            id: "welcome", role: "assistant",
            content: agent.welcome_message,
            timestamp: new Date().toISOString(),
          }],
          status: "active",
        });
        setConversationId(conv.id);
        setMessages([{
          id: "welcome", role: "assistant",
          content: agent.welcome_message,
          timestamp: new Date().toISOString(),
        }]);
      } else {
        setMessages([{
          id: "welcome", role: "assistant",
          content: "Hi! 👋 I'm your AI assistant. How can I help you today?",
          timestamp: new Date().toISOString(),
        }]);
      }
    });
  }, [agentId, puterReady]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messageCount >= 3 && !leadCaptured && !showLeadForm) setShowLeadForm(true);
  }, [messageCount, leadCaptured, showLeadForm]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setMessageCount((c) => c + 1);

    // Persist user message to conversation
    if (conversationId && storeReady) {
      addMessageToConversation(conversationId, { id: userMsg.id, role: "user", content: userMsg.content, timestamp: userMsg.timestamp });
    }

    try {
      if (puterReady && (window as any).puter) {
        const puter = (window as any).puter;
        const chatHistory = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        const systemMsg = { role: "system", content: systemPrompt || `You are a helpful AI assistant. Agent ID: ${agentId}` };
        const response = await puter.ai.chat("gpt-4.1", [systemMsg, ...chatHistory]);
        const content = response?.message?.content || response?.toString() || "I'd be happy to help! Could you tell me more about what you're looking for?";
        const assistantMsg = { id: crypto.randomUUID(), role: "assistant" as const, content, timestamp: new Date().toISOString() };
        setMessages((prev) => [...prev, assistantMsg]);

        // Persist assistant message to conversation
        if (conversationId && storeReady) {
          addMessageToConversation(conversationId, { id: assistantMsg.id, role: "assistant", content: assistantMsg.content, timestamp: assistantMsg.timestamp });
        }
      } else {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: "assistant",
          content: "Thanks for your message! I'm currently loading my AI capabilities. Please try again in a moment.",
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: "I appreciate your patience! Let me connect you with our team. Could you share your email so we can follow up?",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, puterReady, agentId, systemPrompt, conversationId, storeReady]);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.email) return;

    // Save lead to store!
    if (storeReady) {
      createLead({
        agent_id: agentId,
        name: leadForm.name || "Anonymous",
        email: leadForm.email,
        phone: leadForm.phone || undefined,
        source: "widget",
        product_interest: "",
        notes: `Captured after ${messageCount} messages`,
      });
    }

    setLeadCaptured(true);
    setShowLeadForm(false);
    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(), role: "assistant",
      content: `Thanks${leadForm.name ? ` ${leadForm.name}` : ""}! I've noted your details. How else can I help you today? 🙂`,
      timestamp: new Date().toISOString(),
    }]);
  };

  const agent = storeReady ? getAgent(agentId) : null;
  const agentName = agent?.name || "AI Assistant";

  return (
    <div className="h-screen w-full flex flex-col bg-[#0a0a0b] text-white font-sans">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shrink-0">
        <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center">
          <Bot className="h-4 w-4 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{agentName}</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-3.5 w-3.5 text-zinc-300" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === "assistant" ? "rounded-tl-sm bg-zinc-800/80 text-zinc-100" : "rounded-tr-sm bg-white text-black"
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                <User className="h-3.5 w-3.5 text-zinc-300" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center shrink-0"><Bot className="h-3.5 w-3.5 text-zinc-300" /></div>
            <div className="rounded-2xl rounded-tl-sm bg-zinc-800/80 px-4 py-3">
              <div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" /><span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" /><span className="h-2 w-2 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" /></div>
            </div>
          </div>
        )}
        {/* Lead Capture Form */}
        {showLeadForm && !leadCaptured && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="text-sm font-medium">📋 Want me to save your info for a personalized follow-up?</div>
            <form onSubmit={handleLeadSubmit} className="space-y-2">
              <input type="text" placeholder="Your name" value={leadForm.name} onChange={(e) => setLeadForm(f => ({ ...f, name: e.target.value }))} className="w-full h-9 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
              <input type="email" placeholder="Email *" required value={leadForm.email} onChange={(e) => setLeadForm(f => ({ ...f, email: e.target.value }))} className="w-full h-9 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
              <input type="tel" placeholder="Phone (optional)" value={leadForm.phone} onChange={(e) => setLeadForm(f => ({ ...f, phone: e.target.value }))} className="w-full h-9 rounded-lg bg-zinc-800 border border-zinc-700 px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600" />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 h-9 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors">Submit</button>
                <button type="button" onClick={() => setShowLeadForm(false)} className="h-9 px-3 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors">Skip</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shrink-0 space-y-2">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 h-10 rounded-xl bg-zinc-800 border border-zinc-700 px-4 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600" disabled={isLoading} />
          <button type="submit" disabled={!input.trim() || isLoading} className="h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
        {/* Viral Powered-By Link */}
        <a href="https://nuronai.com?ref=widget" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors py-1">
          <ExternalLink className="h-2.5 w-2.5" />
          Powered by <span className="font-semibold">Nuron AI</span> — Build your AI employee free
        </a>
      </div>
    </div>
  );
}

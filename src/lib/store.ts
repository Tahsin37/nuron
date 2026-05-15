"use client";

import { Agent, Lead, Conversation, ChatMessage, TrainingSource, AnalyticsData, Product } from "./types";

// ==================== Data Store ====================
// Uses Puter KV (cloud-persistent) with in-memory cache.
// Data survives browser cache clears — tied to user's Puter account.

const DATA_KEY = "nuron_app_data";
let memoryCache: AppData | null = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

interface AppData {
  agents: Agent[];
  leads: Lead[];
  conversations: Conversation[];
  trainingSources: TrainingSource[];
  products: Product[];
}

const emptyData = (): AppData => ({ agents: [], leads: [], conversations: [], trainingSources: [], products: [] });

// Load data from Puter KV into memory cache
export async function initStore(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const puter = (window as any).puter;
    if (puter?.kv) {
      const stored = await puter.kv.get(DATA_KEY);
      if (stored) {
        memoryCache = typeof stored === "string" ? JSON.parse(stored) : stored;
        return;
      }
    }
  } catch {
    // KV unavailable — use empty data
  }
  memoryCache = emptyData();
}

function getData(): AppData {
  if (!memoryCache) memoryCache = emptyData();
  return memoryCache;
}

// Debounced save to Puter KV (avoids hammering the API)
function persistData() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    try {
      const puter = (window as any).puter;
      if (puter?.kv && memoryCache) {
        await puter.kv.set(DATA_KEY, JSON.stringify(memoryCache));
      }
    } catch (err) {
      console.error("Failed to persist data:", err);
    }
  }, 500);
}

// ==================== Input Sanitization ====================
function sanitize(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

function sanitizeObj<T extends Record<string, any>>(obj: T): T {
  const cleaned = { ...obj };
  for (const key in cleaned) {
    if (typeof cleaned[key] === "string") {
      (cleaned as any)[key] = sanitize(cleaned[key]);
    }
  }
  return cleaned;
}

// ==================== Agents ====================
export function getAgents(): Agent[] {
  return getData().agents;
}

export function getAgent(id: string): Agent | undefined {
  return getData().agents.find((a) => a.id === id);
}

export function createAgent(agent: Omit<Agent, "id" | "created_at" | "updated_at">): Agent {
  const data = getData();
  const newAgent: Agent = {
    ...agent,
    name: sanitize(agent.name),
    welcome_message: sanitize(agent.welcome_message),
    fallback_message: sanitize(agent.fallback_message),
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  data.agents.push(newAgent);
  persistData();
  return newAgent;
}

export function updateAgent(id: string, updates: Partial<Agent>): Agent | undefined {
  const data = getData();
  const index = data.agents.findIndex((a) => a.id === id);
  if (index === -1) return undefined;
  data.agents[index] = { ...data.agents[index], ...updates, updated_at: new Date().toISOString() };
  persistData();
  return data.agents[index];
}

export function deleteAgent(id: string): boolean {
  const data = getData();
  const index = data.agents.findIndex((a) => a.id === id);
  if (index === -1) return false;
  data.agents.splice(index, 1);
  data.leads = data.leads.filter((l) => l.agent_id !== id);
  data.conversations = data.conversations.filter((c) => c.agent_id !== id);
  data.trainingSources = data.trainingSources.filter((t) => t.agent_id !== id);
  persistData();
  return true;
}

// ==================== Training Sources ====================
export function getTrainingSources(agentId: string): TrainingSource[] {
  return getData().trainingSources.filter((t) => t.agent_id === agentId);
}

export function addTrainingSource(source: Omit<TrainingSource, "id" | "created_at">): TrainingSource {
  const data = getData();
  const newSource: TrainingSource = {
    ...source,
    name: sanitize(source.name),
    content: source.content ? sanitize(source.content) : undefined,
    url: source.url ? sanitize(source.url) : undefined,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  data.trainingSources.push(newSource);
  persistData();
  return newSource;
}

export function deleteTrainingSource(id: string): boolean {
  const data = getData();
  const index = data.trainingSources.findIndex((t) => t.id === id);
  if (index === -1) return false;
  data.trainingSources.splice(index, 1);
  persistData();
  return true;
}

// ==================== Leads ====================
export function getLeads(agentId?: string): Lead[] {
  const data = getData();
  if (agentId) return data.leads.filter((l) => l.agent_id === agentId);
  return data.leads;
}

export function createLead(lead: Omit<Lead, "id" | "created_at">): Lead {
  const data = getData();
  const newLead: Lead = {
    ...sanitizeObj(lead),
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  data.leads.push(newLead);
  persistData();
  return newLead;
}

// ==================== Conversations ====================
export function getConversations(agentId?: string): Conversation[] {
  const data = getData();
  if (agentId) return data.conversations.filter((c) => c.agent_id === agentId);
  return data.conversations;
}

export function getConversation(id: string): Conversation | undefined {
  return getData().conversations.find((c) => c.id === id);
}

export function createConversation(conv: Omit<Conversation, "id" | "started_at" | "last_message_at">): Conversation {
  const data = getData();
  const now = new Date().toISOString();
  const newConv: Conversation = { ...conv, id: crypto.randomUUID(), started_at: now, last_message_at: now };
  data.conversations.push(newConv);
  persistData();
  return newConv;
}

export function addMessageToConversation(conversationId: string, message: ChatMessage): Conversation | undefined {
  const data = getData();
  const index = data.conversations.findIndex((c) => c.id === conversationId);
  if (index === -1) return undefined;
  data.conversations[index].messages.push(message);
  data.conversations[index].last_message_at = new Date().toISOString();
  persistData();
  return data.conversations[index];
}

// ==================== Analytics ====================
export function getAnalytics(): AnalyticsData {
  const data = getData();
  const totalConversations = data.conversations.length;
  const totalLeads = data.leads.length;
  const conversionRate = totalConversations > 0 ? Math.round((totalLeads / totalConversations) * 1000) / 10 : 0;

  const fallback_count = data.conversations.filter(c => c.status === "needs_human").length;
  const ai_handled_count = data.conversations.filter(c => c.status === "resolved" || c.status === "active").length;

  // Real conversation data over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    return {
      date: dateStr,
      count: data.conversations.filter((c) => c.started_at.split("T")[0] === dateStr).length,
    };
  });

  // Extract real common questions from user messages
  const userMessages = data.conversations.flatMap((c) =>
    c.messages.filter((m) => m.role === "user").map((m) => m.content)
  );
  const questionCounts: Record<string, number> = {};
  userMessages.forEach((msg) => {
    const short = msg.length > 60 ? msg.slice(0, 60) + "…" : msg;
    questionCounts[short] = (questionCounts[short] || 0) + 1;
  });
  const common_questions = Object.entries(questionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([question, count]) => ({ question, count }));

  // Real product interest from leads
  const productCounts: Record<string, number> = {};
  data.leads.forEach((l) => {
    if (l.product_interest) productCounts[l.product_interest] = (productCounts[l.product_interest] || 0) + 1;
  });
  const top_products = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([product, mentions]) => ({ product, mentions }));

  // Real hourly distribution from conversations
  const hourCounts = Array.from({ length: 24 }, () => 0);
  data.conversations.forEach((c) => {
    const hour = new Date(c.started_at).getHours();
    hourCounts[hour]++;
  });

  return {
    total_conversations: totalConversations,
    total_leads: totalLeads,
    conversion_rate: conversionRate,
    common_questions,
    top_products,
    active_hours: hourCounts.map((count, hour) => ({ hour, count })),
    unanswered_queries: fallback_count, // map unanswered to fallback for now
    conversations_over_time: last7Days,
    fallback_count,
    ai_handled_count
  };
}

// ==================== Products ====================
export function getProducts(): Product[] {
  return getData().products || [];
}

export function getProduct(id: string): Product | undefined {
  return (getData().products || []).find(p => p.id === id);
}

export function createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">): Product {
  const data = getData();
  if (!data.products) data.products = [];
  const newProduct: Product = {
    ...sanitizeObj(product),
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  data.products.push(newProduct);
  persistData();
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): Product | undefined {
  const data = getData();
  if (!data.products) data.products = [];
  const index = data.products.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  data.products[index] = { ...data.products[index], ...updates, updated_at: new Date().toISOString() };
  persistData();
  return data.products[index];
}

export function deleteProduct(id: string): boolean {
  const data = getData();
  if (!data.products) return false;
  const index = data.products.findIndex(p => p.id === id);
  if (index === -1) return false;
  data.products.splice(index, 1);
  persistData();
  return true;
}

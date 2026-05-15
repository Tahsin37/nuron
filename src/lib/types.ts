// ==================== Agent Types ====================
export interface Agent {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  welcome_message: string;
  fallback_message: string;
  personality: AgentPersonality;
  behavior: AgentBehavior;
  status: "active" | "inactive" | "training";
  created_at: string;
  updated_at: string;
}

export interface AgentPersonality {
  friendliness: number; // 0 = professional, 100 = very friendly
  detail_level: number; // 0 = concise, 100 = very detailed
  formality: number; // 0 = casual, 100 = very formal
  sales_aggressiveness: number; // 0 = soft, 100 = aggressive
  emoji_usage: number; // 0 = none, 100 = heavy
  humor_level: number; // 0 = serious, 100 = very humorous
  persuasion_level: number; // 0 = informative, 100 = highly persuasive
}

export interface AgentBehavior {
  role: "sales" | "support" | "hybrid";
  product_recommendation: boolean;
  lead_capture: boolean;
  upsell: boolean;
  custom_instructions: string;
}

// ==================== Training Types ====================
export interface TrainingSource {
  id: string;
  agent_id: string;
  type: "url" | "pdf" | "text" | "image" | "google_sheets";
  name: string;
  content?: string;
  url?: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

// ==================== Lead Types ====================
export interface Lead {
  id: string;
  agent_id: string; // The AI employee that captured this
  name: string;
  email?: string;
  phone?: string;
  budget?: string;
  need?: string;
  product_interest?: string;
  notes?: string;
  source: string; // e.g. "messenger", "facebook_page"
  buying_intent?: "hot" | "warm" | "cold";
  created_at: string;
}

// ==================== Product Types ====================
export interface Product {
  id: string;
  name: string;
  price: string;
  discount?: string; // e.g. "10%" or "100 Tk off"
  stock_status: "in_stock" | "out_of_stock" | "preorder";
  category?: string;
  tags?: string[]; // e.g. ["panjabi", "cotton", "winter"]
  colors?: string[]; // e.g. ["Black", "White", "Navy"]
  sizes?: string[]; // e.g. ["M", "L", "XL", "XXL"]
  delivery_info?: string;
  description?: string;
  notes?: string;
  faq?: { question: string; answer: string }[];
  image_urls?: string[];
  product_url?: string;
  status: "active" | "draft" | "archived";
  created_at: string;
  updated_at: string;
}

// ==================== Conversation Types ====================
export interface Conversation {
  id: string;
  agent_id: string;
  visitor_id: string; // e.g. Messenger PSID
  visitor_name?: string;
  messages: ChatMessage[];
  status: "active" | "needs_human" | "resolved" | "archived";
  lead_id?: string;
  source?: "messenger" | "facebook_page";
  started_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

// ==================== Analytics Types ====================
export interface AnalyticsData {
  total_conversations: number;
  total_leads: number;
  conversion_rate: number;
  fallback_count: number;
  ai_handled_count: number;
  common_questions: { question: string; count: number }[];
  top_products: { product: string; mentions: number }[];
  active_hours: { hour: number; count: number }[];
  unanswered_queries: number;
  conversations_over_time: { date: string; count: number }[];
}

// ==================== User Types ====================
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  company?: string;
  created_at: string;
}

// ==================== Widget Types ====================
export interface WidgetConfig {
  agent_id: string;
  agent_name: string;
  welcome_message: string;
  primary_color: string;
  position: "bottom-right" | "bottom-left";
  avatar_url?: string;
}

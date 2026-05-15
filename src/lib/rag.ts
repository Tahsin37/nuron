"use client";

import { getTrainingSources } from "./store";

// ============================================================
// RAG Pipeline — Retrieval-Augmented Generation
// Builds context-aware system prompts from training data
// ============================================================

/**
 * Build a system prompt for an agent using its training data + personality.
 * This is the core of what makes the AI agent "know" the user's business.
 */
export function buildAgentSystemPrompt(agent: {
  name: string;
  welcome_message: string;
  fallback_message: string;
  personality: {
    friendliness: number;
    detail_level: number;
    formality: number;
    sales_aggressiveness: number;
    emoji_usage: number;
    humor_level: number;
    persuasion_level: number;
  };
  behavior: {
    role: string;
    product_recommendation: boolean;
    lead_capture: boolean;
    upsell: boolean;
    custom_instructions: string;
  };
  id: string;
}): string {
  // 1. Gather training data
  const sources = getTrainingSources(agent.id);
  const trainingChunks: string[] = [];

  sources.forEach((source) => {
    if (source.type === "image") {
      trainingChunks.push(`[IMAGE REFERENCE: ${source.name}] ${source.content || "Visual reference image provided as part of the business knowledge."}`);
    } else if (source.content) {
      trainingChunks.push(`[${source.type.toUpperCase()}: ${source.name}]\n${source.content}`);
    }
    if (source.url && source.type === "url") {
      trainingChunks.push(`[WEBSITE: ${source.url}] — Content from this URL is part of the business knowledge base.`);
    }
  });

  const knowledgeBase = trainingChunks.length > 0
    ? `\n\n## BUSINESS KNOWLEDGE BASE\nUse the following information to answer questions accurately. This is YOUR knowledge — refer to it naturally:\n\n${trainingChunks.join("\n\n---\n\n")}`
    : "\n\n## NOTE\nNo specific business training data has been provided yet. Be helpful and honest about what you can and cannot answer.";

  // 2. Map personality sliders to natural language
  const p = agent.personality;
  const tone = p.friendliness > 70 ? "very warm, friendly, and approachable" :
               p.friendliness > 40 ? "balanced and professional yet personable" :
               "formal, polished, and business-focused";

  const detail = p.detail_level > 70 ? "Give thorough, comprehensive responses with examples." :
                 p.detail_level > 40 ? "Be reasonably detailed but don't over-explain." :
                 "Keep responses very concise — 1-3 sentences max.";

  const formality = p.formality > 70 ? "Use formal language, proper grammar, and a corporate tone." :
                    p.formality > 40 ? "Use a professional but conversational tone." :
                    "Be casual, relaxed, and conversational — like texting a friend.";

  const sales = p.sales_aggressiveness > 70 ? "Actively push for conversions. Recommend products proactively. Create urgency. Ask for the sale." :
                p.sales_aggressiveness > 40 ? "Recommend products when relevant. Gently guide toward a purchase." :
                "Focus on helping, not selling. Only mention products if directly asked.";

  const emoji = p.emoji_usage > 70 ? "Use emojis frequently to add personality 🎉✨🚀" :
                p.emoji_usage > 40 ? "Use occasional emojis for warmth 👋" :
                "Do not use emojis. Keep it text-only.";

  const humor = p.humor_level > 60 ? "Add light humor and wit when appropriate." :
                "Keep the tone serious and professional.";

  const persuasion = p.persuasion_level > 70 ? "Use persuasive techniques: social proof, scarcity, benefits-focused framing." :
                     p.persuasion_level > 40 ? "Highlight benefits naturally without being pushy." :
                     "Be purely informative. Let the customer decide without persuasion.";

  // 3. Map behavior rules
  const behaviorRules: string[] = [];
  if (agent.behavior.product_recommendation) {
    behaviorRules.push("- RECOMMEND products/services based on customer needs when relevant.");
  }
  if (agent.behavior.lead_capture) {
    behaviorRules.push("- CAPTURE LEADS: After building rapport (2-3 exchanges), naturally ask for their name, email, and what they need help with. Frame it as 'so we can follow up with personalized info.'");
  }
  if (agent.behavior.upsell) {
    behaviorRules.push("- UPSELL: When a customer shows interest in a product, mention complementary products or premium options.");
  }
  if (agent.behavior.custom_instructions) {
    behaviorRules.push(`- CUSTOM RULES: ${agent.behavior.custom_instructions}`);
  }

  const roleDescription = agent.behavior.role === "sales"
    ? "You are an AI sales agent. Your primary goal is to help customers find the right products/services and guide them toward a purchase."
    : agent.behavior.role === "support"
    ? "You are an AI support agent. Your primary goal is to answer questions, resolve issues, and ensure customer satisfaction."
    : "You are an AI sales and support hybrid agent. Help customers with questions AND guide them toward solutions when appropriate.";

  // 4. Assemble final system prompt
  return `# IDENTITY
You are "${agent.name}", an AI employee deployed on a business website. ${roleDescription}

## PERSONALITY
- Tone: ${tone}
- ${detail}
- ${formality}
- ${sales}
- ${emoji}
- ${humor}
- ${persuasion}

## BEHAVIOR RULES
${behaviorRules.length > 0 ? behaviorRules.join("\n") : "- Be helpful, accurate, and professional."}

## CONVERSATION GUIDELINES
- Never reveal you are an AI unless directly asked. Act as a knowledgeable team member.
- If you don't know something from the knowledge base, say something like "Let me connect you with our team for specifics on that" rather than making things up.
- Keep responses focused and relevant.
- Welcome message style: "${agent.welcome_message}"
- Fallback when stuck: "${agent.fallback_message}"
- Never discuss competitors negatively.
- Do not share internal pricing strategies or confidential business information beyond what's in the knowledge base.
${knowledgeBase}`;
}

/**
 * Chunk text into smaller segments for future embedding/vector search.
 * For now, this is used for basic context injection.
 */
export function chunkText(text: string, maxChunkSize: number = 500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + " " + sentence).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ==================== Knowledge Base Test API ====================
// GET /api/test/knowledge → verifies the full pipeline

import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, buildProductContext, detectIntent, generateAIReply } from "@/lib/ai-pipeline";
import { getProductsByUser, saveProduct, getOrCreateConversation, appendMessage, getConversationHistory, getUserSettings } from "@/lib/server-store";
import type { Product } from "@/lib/types";

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {};
  const userId = request.nextUrl.searchParams.get("user_id") || "test_user_mvp";

  try {
    // Test 1: Save a test product
    const testProduct: Partial<Product> = {
      id: "test-product-001",
      name: "Black Premium Panjabi",
      price: "৳1,200",
      discount: "10% off for first order",
      stock_status: "in_stock",
      category: "Clothing",
      tags: ["panjabi", "cotton", "black"],
      colors: ["Black", "Navy", "White"],
      sizes: ["M", "L", "XL", "XXL"],
      delivery_info: "Dhaka: ৳60, Outside Dhaka: ৳120. Delivery in 2-3 days.",
      description: "Premium quality cotton panjabi.",
      faq: [
        { question: "COD আছে?", answer: "Yes, Cash on Delivery available." },
        { question: "Exchange policy?", answer: "7-day easy exchange." },
      ],
      status: "active",
    };

    await saveProduct(userId, testProduct);
    results["1_save_product"] = "✅ Product saved to Supabase";

    // Test 2: Fetch products
    const products = await getProductsByUser(userId);
    results["2_fetch_products"] = {
      status: products.length > 0 ? "✅ Products fetched" : "⚠️ No products found",
      count: products.length,
    };

    // Test 3: Build context
    const context = buildProductContext(products);
    results["3_product_context"] = {
      status: context.length > 0 ? "✅ Context built" : "⚠️ Empty context",
      preview: context.substring(0, 150) + "...",
    };

    // Test 4: System prompt
    const systemPrompt = buildSystemPrompt(products, "Test Shop");
    results["4_system_prompt"] = {
      status: "✅ Built",
      has_product_data: systemPrompt.includes("Black Premium Panjabi"),
      has_language_rule: systemPrompt.includes("CRITICAL LANGUAGE RULE"),
    };

    // Test 5: Intent detection
    results["5_intent_detection"] = [
      { msg: "price koto?", ...detectIntent("price koto?") },
      { msg: "order dite chai", ...detectIntent("order dite chai") },
      { msg: "hello", ...detectIntent("hello") },
      { msg: "refund chai", ...detectIntent("refund chai") },
    ].map(r => ({ ...r, confidence: Math.round(r.confidence * 100) + "%" }));

    // Test 6: AI reply (per-user keys)
    const settings = await getUserSettings(userId);
    const aiKeys = {
      puterToken: settings?.puter_api_token || undefined,
      groqKey: settings?.groq_api_key || undefined,
    };
    const hasUserAI = !!aiKeys.puterToken || !!aiKeys.groqKey;
    const hasGlobalAI = !!process.env.PUTER_API_TOKEN || !!process.env.GROQ_API_KEY;

    const reply = await generateAIReply(systemPrompt, [{ role: "user", content: "What is the price?" }], aiKeys);
    const isFallback = reply.includes("get back to you") || reply.includes("wait korun") || reply.includes("অপেক্ষা");

    results["6_ai_reply"] = {
      status: !isFallback ? "✅ Real AI reply" : "⚠️ Fallback (no AI key)",
      reply,
      user_ai_keys: hasUserAI ? "Yes" : "No",
      global_ai_keys: hasGlobalAI ? "Yes" : "No",
    };

    // Test 7: Conversations
    const conv = await getOrCreateConversation(userId, "test_visitor", "Test Customer");
    results["7_conversations"] = conv ? { status: "✅ Works", id: conv.id } : { status: "❌ Failed" };

    // Summary
    results["_summary"] = {
      overall: !JSON.stringify(results).includes("❌") ? "✅ ALL PASSED" : "⚠️ Issues found",
      user_id: userId,
      ai_ready: hasUserAI || hasGlobalAI ? "Yes ✅" : "❌ Add AI key in Settings",
    };

    return NextResponse.json(results, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, hint: "Run supabase-migration.sql + supabase-migration-v2.sql" }, { status: 500 });
  }
}

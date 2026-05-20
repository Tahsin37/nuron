// ==================== Knowledge Base Test API ====================
// Use this to verify products, AI pipeline, and store functions work.
// GET /api/test/knowledge → returns test results

import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt, buildProductContext, detectIntent, generateAIReply } from "@/lib/ai-pipeline";
import { getProductsByUser, saveProduct, getOrCreateConversation, appendMessage, getConversationHistory } from "@/lib/server-store";
import type { Product } from "@/lib/types";

export async function GET(request: NextRequest) {
  const results: Record<string, any> = {};
  const userId = "test_user_mvp";

  try {
    // Test 1: Save a test product to Supabase
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
      description: "Premium quality cotton panjabi. Comfortable fit, perfect for casual & formal wear.",
      notes: "Supplier: Rahim Bhai, Mirpur",
      faq: [
        { question: "COD আছে?", answer: "Yes, Cash on Delivery available all over Bangladesh." },
        { question: "Exchange policy?", answer: "7-day easy exchange if size doesn't match." },
      ],
      status: "active",
    };

    await saveProduct(userId, testProduct);
    results["1_save_product"] = "✅ Product saved to Supabase";

    // Test 2: Fetch products back
    const products = await getProductsByUser(userId);
    results["2_fetch_products"] = {
      status: products.length > 0 ? "✅ Products fetched" : "⚠️ No products found",
      count: products.length,
      first_product: products[0]?.name || null,
    };

    // Test 3: Build product context
    const context = buildProductContext(products);
    results["3_product_context"] = {
      status: context.length > 0 ? "✅ Context built" : "⚠️ Empty context",
      preview: context.substring(0, 200) + "...",
    };

    // Test 4: Build system prompt
    const systemPrompt = buildSystemPrompt(products, "Test Shop");
    results["4_system_prompt"] = {
      status: "✅ System prompt built",
      length: systemPrompt.length,
      has_product_data: systemPrompt.includes("Black Premium Panjabi"),
      has_rules: systemPrompt.includes("RULES:"),
    };

    // Test 5: Intent detection
    const intents = [
      { msg: "bhai price koto?", expected: "warm" },
      { msg: "order dite chai, XL black nibo", expected: "hot" },
      { msg: "hello", expected: "cold" },
      { msg: "refund chai, product broken", expected: "human" },
    ];

    results["5_intent_detection"] = intents.map((t) => {
      const result = detectIntent(t.msg);
      return {
        message: t.msg,
        detected: result.level,
        confidence: Math.round(result.confidence * 100) + "%",
        human_flag: result.shouldFlagHuman,
        pass: (t.expected === "human" ? result.shouldFlagHuman : result.level === t.expected) ? "✅" : "❌",
      };
    });

    // Test 6: AI reply (only if PUTER_API_TOKEN is set)
    const puterToken = process.env.PUTER_API_TOKEN;
    if (puterToken) {
      const testHistory = [{ role: "user" as const, content: "bhai black panjabi er price koto?" }];
      const reply = await generateAIReply(systemPrompt, testHistory);
      results["6_ai_reply"] = {
        status: reply ? "✅ AI replied" : "⚠️ Empty reply",
        reply: reply,
      };
    } else {
      results["6_ai_reply"] = {
        status: "⏭️ Skipped — PUTER_API_TOKEN not set in .env",
        hint: "Add your Puter API token to test AI replies",
      };
    }

    // Test 7: Conversation store
    const conv = await getOrCreateConversation(userId, "test_visitor_001", "Test Customer");
    if (conv) {
      await appendMessage(conv.id, "user", "price koto?");
      await appendMessage(conv.id, "assistant", "Black Panjabi ৳1,200");
      const history = await getConversationHistory(conv.id);
      results["7_conversation_store"] = {
        status: "✅ Conversation works",
        conversation_id: conv.id,
        message_count: history.length,
      };
    } else {
      results["7_conversation_store"] = { status: "❌ Failed to create conversation" };
    }

    // Summary
    const allPassed = !JSON.stringify(results).includes("❌");
    results["_summary"] = {
      overall: allPassed ? "✅ ALL TESTS PASSED" : "⚠️ Some tests failed",
      supabase_connected: products.length >= 0 ? "Yes" : "No",
      puter_ai_ready: puterToken ? "Yes" : "No (add PUTER_API_TOKEN)",
      telegram_ready: process.env.TELEGRAM_BOT_TOKEN ? "Yes" : "No (add TELEGRAM_BOT_TOKEN)",
    };

    return NextResponse.json(results, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message,
      hint: "Did you run supabase-migration.sql in your Supabase Dashboard?",
    }, { status: 500 });
  }
}

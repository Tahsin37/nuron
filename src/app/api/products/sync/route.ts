// ==================== Product Sync API ====================
// Called by the client-side store to sync products to Supabase
// so the Telegram/Messenger bots can read them server-side.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, product, action } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    if (action === "delete" && product?.id) {
      await supabase.from("products").delete().eq("id", product.id).eq("user_id", user_id);
      return NextResponse.json({ success: true, action: "deleted" });
    }

    if (action === "upsert" && product) {
      const { error } = await supabase.from("products").upsert({
        id: product.id,
        user_id,
        name: product.name,
        price: product.price,
        discount: product.discount || null,
        stock_status: product.stock_status || "in_stock",
        category: product.category || null,
        tags: product.tags || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        delivery_info: product.delivery_info || null,
        description: product.description || null,
        notes: product.notes || null,
        faq: product.faq || [],
        image_urls: product.image_urls || [],
        product_url: product.product_url || null,
        status: product.status || "active",
        created_at: product.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error("[ProductSync] Upsert error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: "upserted" });
    }

    // Bulk sync — sync all products at once
    if (action === "bulk" && Array.isArray(product)) {
      for (const p of product) {
        await supabase.from("products").upsert({
          id: p.id,
          user_id,
          name: p.name,
          price: p.price,
          discount: p.discount || null,
          stock_status: p.stock_status || "in_stock",
          category: p.category || null,
          tags: p.tags || [],
          colors: p.colors || [],
          sizes: p.sizes || [],
          delivery_info: p.delivery_info || null,
          description: p.description || null,
          notes: p.notes || null,
          faq: p.faq || [],
          image_urls: p.image_urls || [],
          product_url: p.product_url || null,
          status: p.status || "active",
          created_at: p.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      return NextResponse.json({ success: true, action: "bulk_synced", count: product.length });
    }

    return NextResponse.json({ error: "Invalid action. Use upsert, delete, or bulk." }, { status: 400 });
  } catch (err: any) {
    console.error("[ProductSync] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==================== Google Sheets Inventory Sync ====================
// Cron: */5 * * * * (every 5 minutes)
// Fetches CSV from public Google Sheets URLs and upserts products.

const { createClient } = require("@supabase/supabase-js");
const { parse } = require("csv-parse/sync");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("[Sheets Sync] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  }
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/**
 * Convert a Google Sheets share URL to a CSV export URL.
 * Handles formats like:
 *   https://docs.google.com/spreadsheets/d/SHEET_ID/edit...
 *   https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv
 */
function toCsvUrl(url) {
  if (!url) return null;
  // Already a CSV export URL
  if (url.includes("/export?") && url.includes("format=csv")) return url;
  if (url.includes("/pub?") && url.includes("output=csv")) return url;

  // Extract sheet ID from standard URL
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const sheetId = match[1];

  // Extract gid if present
  const gidMatch = url.match(/gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Map CSV columns to product fields.
 * Supports flexible column naming (case-insensitive).
 */
function mapCsvRowToProduct(row) {
  const keys = Object.keys(row);
  const find = (patterns) => {
    for (const p of patterns) {
      const key = keys.find(k => k.toLowerCase().trim().includes(p));
      if (key && row[key]?.toString().trim()) return row[key].toString().trim();
    }
    return undefined;
  };

  const name = find(["name", "product", "title", "item"]);
  if (!name) return null;

  const stockRaw = find(["stock", "inventory", "availability", "qty", "quantity"]);
  let stock_status = "in_stock";
  if (stockRaw) {
    const lower = stockRaw.toLowerCase();
    if (lower === "0" || lower.includes("out") || lower === "no") stock_status = "out_of_stock";
    else if (lower.includes("pre")) stock_status = "preorder";
  }

  const colorsRaw = find(["color", "colours", "colors"]);
  const sizesRaw = find(["size", "sizes"]);

  return {
    name,
    sku: find(["sku", "code", "id", "product_id"]),
    price: find(["price", "cost", "amount", "mrp"]) || "0",
    description: find(["description", "desc", "details", "about"]),
    category: find(["category", "type", "group"]),
    stock_status,
    delivery_info: find(["delivery", "shipping", "dispatch"]),
    discount: find(["discount", "offer", "sale"]),
    colors: colorsRaw ? colorsRaw.split(/[,;|]/).map(c => c.trim()).filter(Boolean) : undefined,
    sizes: sizesRaw ? sizesRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean) : undefined,
  };
}

/**
 * Run the Sheets sync for all tenants with a configured Google Sheet URL.
 */
async function runSheetsSync() {
  console.log("[Sheets Sync] Starting sync cycle...");
  const supabase = getSupabase();

  // Find all tenants with a Google Sheet URL
  const { data: tenants, error } = await supabase
    .from("user_settings")
    .select("user_id, google_sheet_url, last_sync_time, business_name")
    .not("google_sheet_url", "is", null)
    .neq("google_sheet_url", "");

  if (error) {
    console.error("[Sheets Sync] Failed to fetch tenants:", error.message);
    return;
  }

  if (!tenants || tenants.length === 0) {
    console.log("[Sheets Sync] No tenants with Google Sheet URLs configured.");
    return;
  }

  console.log(`[Sheets Sync] Found ${tenants.length} tenant(s) to sync.`);

  for (const tenant of tenants) {
    try {
      const csvUrl = toCsvUrl(tenant.google_sheet_url);
      if (!csvUrl) {
        console.warn(`[Sheets Sync] Invalid URL for ${tenant.user_id}: ${tenant.google_sheet_url}`);
        continue;
      }

      console.log(`[Sheets Sync] Syncing ${tenant.business_name || tenant.user_id}...`);

      // Fetch CSV data
      const res = await fetch(csvUrl, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) {
        console.error(`[Sheets Sync] HTTP ${res.status} for ${tenant.user_id}`);
        continue;
      }

      const csvText = await res.text();
      if (!csvText.trim()) {
        console.warn(`[Sheets Sync] Empty CSV for ${tenant.user_id}`);
        continue;
      }

      // Parse CSV
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });

      if (!records.length) {
        console.warn(`[Sheets Sync] No records parsed for ${tenant.user_id}`);
        continue;
      }

      // Map to products
      const products = records
        .map(mapCsvRowToProduct)
        .filter(Boolean);

      if (products.length === 0) {
        console.warn(`[Sheets Sync] No valid products mapped for ${tenant.user_id}`);
        continue;
      }

      // Bulk upsert
      let upserted = 0, errors = 0;
      for (const product of products) {
        try {
          const matchField = product.sku ? "sku" : "name";
          const matchValue = product.sku || product.name;

          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("user_id", tenant.user_id)
            .eq(matchField, matchValue)
            .limit(1)
            .maybeSingle();

          if (existing) {
            const { error: upErr } = await supabase
              .from("products")
              .update({ ...product, updated_at: new Date().toISOString() })
              .eq("id", existing.id);
            upErr ? errors++ : upserted++;
          } else {
            const { error: inErr } = await supabase
              .from("products")
              .insert({
                ...product,
                user_id: tenant.user_id,
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            inErr ? errors++ : upserted++;
          }
        } catch (e) {
          errors++;
        }
      }

      // Update last sync time
      await supabase
        .from("user_settings")
        .update({ last_sync_time: new Date().toISOString() })
        .eq("user_id", tenant.user_id);

      console.log(`[Sheets Sync] ✅ ${tenant.business_name || tenant.user_id}: ${upserted} upserted, ${errors} errors (${products.length} total rows)`);
    } catch (e) {
      console.error(`[Sheets Sync] Error syncing ${tenant.user_id}:`, e.message || e);
    }
  }

  console.log("[Sheets Sync] Sync cycle complete.");
}

module.exports = { runSheetsSync };

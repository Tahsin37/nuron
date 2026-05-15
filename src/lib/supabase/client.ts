import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return null if Supabase isn't configured — app falls back to localStorage
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

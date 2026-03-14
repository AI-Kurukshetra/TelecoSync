import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getSupabaseBrowserConfig();

  return createBrowserClient(url, publishableKey);
}

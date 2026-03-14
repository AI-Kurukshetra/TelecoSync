import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceRoleConfig } from "@/lib/supabase/config";

export function createAdminSupabaseClient() {
  const { url, serviceRoleKey } = getSupabaseServiceRoleConfig();

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

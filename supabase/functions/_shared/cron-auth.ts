import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let cachedSecret: string | null = null;

export async function isCronAuthorized(req: Request): Promise<boolean> {
  const header = req.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) return false;
  const token = header.slice(7).trim();
  if (!token) return false;

  if (!cachedSecret) {
    try {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { data, error } = await supabase.rpc("get_cron_secret");
      if (error || typeof data !== "string" || !data) {
        console.error("[cron-auth] Failed to load cron secret:", error ?? "empty");
        return false;
      }
      cachedSecret = data;
    } catch (e) {
      console.error("[cron-auth] RPC error:", e);
      return false;
    }
  }

  return token === cachedSecret;
}

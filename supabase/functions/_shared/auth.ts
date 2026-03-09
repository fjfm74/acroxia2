import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type AuthMode =
  | "public"
  | "internal_key"
  | "service_role"
  | "admin_user"
  | "authenticated_user";

export interface AuthorizationResult {
  ok: boolean;
  status: number;
  error?: string;
  mode?: AuthMode;
  userId?: string;
  userEmail?: string | null;
}

interface AuthorizeRequestOptions {
  req: Request;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  body?: Record<string, unknown> | null;
  allowPublic?: boolean;
  allowInternalKey?: boolean;
  internalKeyEnvName?: string;
  allowServiceRoleToken?: boolean;
  allowAdminUser?: boolean;
  allowAuthenticatedUser?: boolean;
}

function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

// deno-lint-ignore no-explicit-any
async function isAdminUser(
  supabase: any,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("[auth] Error checking admin role:", error);
    return false;
  }

  return !!data;
}

export async function authorizeRequest(
  options: AuthorizeRequestOptions,
): Promise<AuthorizationResult> {
  const {
    req,
    supabaseUrl,
    supabaseServiceRoleKey,
    body,
    allowPublic = false,
    allowInternalKey = false,
    internalKeyEnvName = "EDGE_INTERNAL_KEY",
    allowServiceRoleToken = false,
    allowAdminUser = false,
    allowAuthenticatedUser = false,
  } = options;

  if (allowPublic) {
    return { ok: true, status: 200, mode: "public" };
  }

  if (allowInternalKey) {
    const expectedInternalKey = Deno.env.get(internalKeyEnvName);
    if (expectedInternalKey) {
      const internalKeyFromHeader = req.headers.get("x-internal-key");
      const internalKeyFromBody =
        body && typeof body.internalKey === "string" ? body.internalKey : null;

      if (
        internalKeyFromHeader === expectedInternalKey ||
        internalKeyFromBody === expectedInternalKey
      ) {
        return { ok: true, status: 200, mode: "internal_key" };
      }
    }
  }

  const token = extractBearerToken(req.headers.get("Authorization"));
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (allowServiceRoleToken && token === supabaseServiceRoleKey) {
    return { ok: true, status: 200, mode: "service_role" };
  }

  if (!allowAdminUser && !allowAuthenticatedUser) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return { ok: false, status: 401, error: "Invalid authentication token" };
  }

  if (allowAdminUser) {
    const admin = await isAdminUser(supabase, user.id);
    if (admin) {
      return {
        ok: true,
        status: 200,
        mode: "admin_user",
        userId: user.id,
        userEmail: user.email,
      };
    }
  }

  if (allowAuthenticatedUser) {
    return {
      ok: true,
      status: 200,
      mode: "authenticated_user",
      userId: user.id,
      userEmail: user.email,
    };
  }

  return { ok: false, status: 403, error: "Admin access required" };
}

export function authErrorResponse(
  auth: AuthorizationResult,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify({ error: auth.error || "Unauthorized" }), {
    status: auth.status || 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

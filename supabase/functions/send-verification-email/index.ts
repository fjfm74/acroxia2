import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { SignupEmail } from "../_shared/email-templates/signup.tsx";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_NAME = "ACROXIA";
const PRIMARY_SITE_URL = "https://acroxia.com";
const ROOT_DOMAIN = "acroxia.com";
const LOVABLE_APP_ORIGIN_PATTERN = /https:\/\/[a-z0-9-]+\.lovable\.app/gi;
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(value);
}

function normalizeConfirmationUrl(rawUrl: string | undefined) {
  if (!rawUrl) return `${PRIMARY_SITE_URL}/verificado`;
  const normalized = rawUrl.replace(LOVABLE_APP_ORIGIN_PATTERN, PRIMARY_SITE_URL);

  try {
    const url = new URL(normalized);
    for (const param of ["redirect_to", "redirectTo", "redirect_url", "return_to"]) {
      const value = url.searchParams.get(param);
      if (value) url.searchParams.set(param, value.replace(LOVABLE_APP_ORIGIN_PATTERN, PRIMARY_SITE_URL));
    }
    if (url.hostname.endsWith(".lovable.app")) {
      url.protocol = "https:";
      url.hostname = ROOT_DOMAIN;
      url.port = "";
    }
    return url.toString();
  } catch (_error) {
    return `${PRIMARY_SITE_URL}/verificado`;
  }
}

function htmlToPlainText(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|br)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s+\n/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
}

async function hashValue(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function isRateLimited(supabase: any, ip: string, email: string): Promise<boolean> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);
  const emailHash = await hashValue(email);
  const endpoints = [`verification_email:ip:${ip}`, `verification_email:email:${emailHash}`];

  for (const endpoint of endpoints) {
    const { count, error } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .eq("endpoint", endpoint)
      .gte("created_at", windowStart.toISOString());
    if (!error && (count || 0) >= RATE_LIMIT_MAX) return true;
  }

  await supabase.from("rate_limits").insert(endpoints.map((endpoint) => ({ ip_address: ip, endpoint })));
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json().catch(() => null);
    const email = normalizeEmail(String(body?.email || ""));
    const analysisId = typeof body?.analysisId === "string" ? body.analysisId.trim() : "";
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const ip = getClientIP(req);
    if (await isRateLimited(supabase, ip, email)) {
      return new Response(JSON.stringify({ error: "Too many verification emails requested" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "3600", ...corsHeaders },
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      console.log("Verification email skipped: profile not found", { email });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const redirectPath = analysisId
      ? `${PRIMARY_SITE_URL}/verificado?analysisId=${encodeURIComponent(analysisId)}`
      : `${PRIMARY_SITE_URL}/verificado`;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: redirectPath },
    });
    if (linkError) throw linkError;

    const confirmationUrl = normalizeConfirmationUrl(linkData?.properties?.action_link);
    const html = await renderAsync(
      React.createElement(SignupEmail, {
        siteName: SITE_NAME,
        siteUrl: PRIMARY_SITE_URL,
        recipient: email,
        confirmationUrl,
      }),
    );
    const text = htmlToPlainText(html);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ACROXIA <noreply@acroxia.com>",
        to: [email],
        reply_to: "contacto@acroxia.com",
        subject: "Confirma tu email en ACROXIA",
        html,
        text,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error", { status: resendResponse.status, body: errorText });
      throw new Error("Failed to send verification email");
    }

    const result = await resendResponse.json();
    console.log("Verification email sent", { id: result.id, email });
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("send-verification-email error", { error: message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
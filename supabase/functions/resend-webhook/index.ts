import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_TOKEN = Deno.env.get("RESEND_WEBHOOK_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

function normalizeEmail(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function parseEmailFromMailbox(text: string): string {
  const value = String(text || "");
  const match = value.match(/<([^>]+)>/);
  return normalizeEmail(match ? match[1] : value);
}

function getEventType(payload: any): string {
  const rawType = String(payload?.type || payload?.event || payload?.event_type || "").toLowerCase();
  if (rawType.startsWith("email.")) return rawType.slice(6);
  return rawType;
}

function getEventData(payload: any): any {
  return payload?.data && typeof payload.data === "object" ? payload.data : payload;
}

function getProviderMessageId(payload: any, data: any): string | null {
  const id =
    data?.email_id ||
    data?.emailId ||
    data?.message_id ||
    data?.messageId ||
    data?.id ||
    payload?.email_id ||
    payload?.id;

  const normalized = String(id || "").trim();
  return normalized || null;
}

function getRecipientEmail(payload: any, data: any): string | null {
  const candidates: string[] = [];
  const toField = data?.to ?? payload?.to;

  if (Array.isArray(toField)) {
    for (const entry of toField) {
      const parsed = parseEmailFromMailbox(String(entry || ""));
      if (parsed) candidates.push(parsed);
    }
  } else if (typeof toField === "string") {
    const parsed = parseEmailFromMailbox(toField);
    if (parsed) candidates.push(parsed);
  }

  const fallback = normalizeEmail(
    String(data?.recipient || data?.email || data?.to_email || payload?.recipient || payload?.email || ""),
  );
  if (fallback) candidates.push(fallback);

  return candidates.find(Boolean) || null;
}

function getFailureDetail(payload: any, data: any): string {
  const fragments = [
    payload?.reason,
    payload?.error,
    payload?.message,
    data?.reason,
    data?.error,
    data?.message,
    data?.response,
    data?.smtp_response,
    data?.smtpResponse,
    data?.bounce?.type,
    data?.bounce?.subType,
    data?.bounce?.subtype,
  ]
    .map((v) => String(v || "").trim())
    .filter((v) => v.length > 0);

  return fragments.join(" | ").slice(0, 1000);
}

function isFailureEvent(eventType: string): boolean {
  return [
    "bounced",
    "bounce",
    "complained",
    "complaint",
    "failed",
    "rejected",
    "blocked",
    "delivery_failed",
  ].some((x) => eventType.includes(x));
}

function shouldAutoUnsubscribe(eventType: string, failureDetail: string): boolean {
  const event = String(eventType || "").toLowerCase();
  const detail = String(failureDetail || "").toLowerCase();

  if (event.includes("complain")) return true;

  if (!(event.includes("bounce") || event.includes("failed") || event.includes("rejected") || event.includes("blocked"))) {
    return false;
  }

  // Keep subscriber active for transient/content filtering scenarios.
  if (
    detail.includes("content") ||
    detail.includes("rspamd") ||
    detail.includes("policy") ||
    detail.includes("temporary") ||
    detail.includes("temporar") ||
    detail.includes("greylist") ||
    detail.includes("rate limit") ||
    detail.includes("timeout")
  ) {
    return false;
  }

  // Auto-unsubscribe only when the mailbox is clearly invalid/permanent.
  return (
    detail.includes("user unknown") ||
    detail.includes("mailbox unavailable") ||
    detail.includes("no such user") ||
    detail.includes("does not exist") ||
    detail.includes("invalid recipient")
  );
}

function verifyWebhookToken(req: Request): boolean {
  if (!RESEND_WEBHOOK_TOKEN) return false;
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token");
  const headerToken = req.headers.get("x-webhook-token");
  return queryToken === RESEND_WEBHOOK_TOKEN || headerToken === RESEND_WEBHOOK_TOKEN;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!RESEND_WEBHOOK_TOKEN) {
    return new Response(JSON.stringify({ error: "RESEND_WEBHOOK_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!verifyWebhookToken(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized webhook call" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any = null;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventType = getEventType(payload);
  const data = getEventData(payload);
  const providerMessageId = getProviderMessageId(payload, data);
  const recipientEmail = getRecipientEmail(payload, data);
  const failureDetail = getFailureDetail(payload, data);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const nowIso = new Date().toISOString();
  const isFailure = isFailureEvent(eventType);

  try {
    if (providerMessageId) {
      const updatePayload: Record<string, unknown> = {};
      if (isFailure) {
        updatePayload.status = "failed";
        updatePayload.error_message = failureDetail || `Webhook event: ${eventType}`;
      } else if (eventType.includes("deliver")) {
        updatePayload.status = "sent";
      }

      if (Object.keys(updatePayload).length > 0) {
        await supabase
          .from("blog_newsletter_deliveries")
          .update(updatePayload)
          .eq("provider_message_id", providerMessageId);
      }
    }

    const autoUnsubscribe = isFailure && shouldAutoUnsubscribe(eventType, failureDetail);
    if (autoUnsubscribe && recipientEmail) {
      await supabase
        .from("blog_subscribers")
        .update({
          unsubscribed: true,
          unsubscribed_at: nowIso,
          unsubscribe_reason: `auto_webhook_${eventType}${failureDetail ? `: ${failureDetail}` : ""}`.slice(0, 250),
        })
        .ilike("email", recipientEmail)
        .eq("unsubscribed", false);
    }

    console.log("[resend-webhook] Processed event", {
      eventType,
      providerMessageId,
      recipientEmail,
      isFailure,
      autoUnsubscribe,
    });

    return new Response(
      JSON.stringify({
        success: true,
        eventType,
        providerMessageId,
        recipientEmail,
        isFailure,
        autoUnsubscribe,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[resend-webhook] Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});


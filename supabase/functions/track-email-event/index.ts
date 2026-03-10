import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_TOKEN = Deno.env.get("RESEND_WEBHOOK_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

// 1x1 transparent GIF
const PIXEL_GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));

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

  return (
    detail.includes("user unknown") ||
    detail.includes("mailbox unavailable") ||
    detail.includes("no such user") ||
    detail.includes("does not exist") ||
    detail.includes("invalid recipient")
  );
}

function verifyWebhookToken(req: Request, url: URL): boolean {
  if (!RESEND_WEBHOOK_TOKEN) return false;
  const queryToken = url.searchParams.get("token");
  const headerToken = req.headers.get("x-webhook-token");
  return queryToken === RESEND_WEBHOOK_TOKEN || headerToken === RESEND_WEBHOOK_TOKEN;
}

async function handleResendWebhook(req: Request, url: URL): Promise<Response> {
  if (!RESEND_WEBHOOK_TOKEN) {
    return new Response(JSON.stringify({ error: "RESEND_WEBHOOK_TOKEN not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!verifyWebhookToken(req, url)) {
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
  const isFailure = isFailureEvent(eventType);
  const nowIso = new Date().toISOString();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    return new Response(
      JSON.stringify({
        success: true,
        eventType,
        providerMessageId,
        recipientEmail,
        isFailure,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("track-email-event webhook error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

async function handleLegacyTracker(url: URL): Promise<Response> {
  const type = url.searchParams.get("type");
  const campaignId = url.searchParams.get("cid");
  const email = url.searchParams.get("email");
  const redirectUrl = url.searchParams.get("url");

  if (!type || !campaignId || !email) {
    return new Response("Missing params", { status: 400, headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const decodedEmail = decodeURIComponent(email);

    await supabase.from("email_campaign_events").insert({
      campaign_id: campaignId,
      event_type: type === "click" ? "clicked" : "opened",
      recipient_email: decodedEmail,
      metadata: redirectUrl ? { url: decodeURIComponent(redirectUrl) } : null,
    });

    if (type === "open") {
      const { data: campaign } = await supabase
        .from("email_campaigns")
        .select("total_opened")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        await supabase
          .from("email_campaigns")
          .update({ total_opened: (campaign.total_opened || 0) + 1 })
          .eq("id", campaignId);
      }
    } else if (type === "click") {
      const { data: campaign } = await supabase
        .from("email_campaigns")
        .select("total_clicked")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        await supabase
          .from("email_campaigns")
          .update({ total_clicked: (campaign.total_clicked || 0) + 1 })
          .eq("id", campaignId);
      }
    }
  } catch (err) {
    console.error("track-email-event legacy error:", err);
  }

  if (type === "open") {
    return new Response(PIXEL_GIF, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  if (type === "click" && redirectUrl) {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: decodeURIComponent(redirectUrl) },
    });
  }

  return new Response("OK", { status: 200, headers: corsHeaders });
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method === "POST") {
    return handleResendWebhook(req, url);
  }

  return handleLegacyTracker(url);
});

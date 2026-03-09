import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// 1x1 transparent GIF
const PIXEL_GIF = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));

serve(async (req: Request) => {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const campaignId = url.searchParams.get("cid");
  const email = url.searchParams.get("email");
  const redirectUrl = url.searchParams.get("url");

  if (!type || !campaignId || !email) {
    return new Response("Missing params", { status: 400 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Record event
    await supabase.from("email_campaign_events").insert({
      campaign_id: campaignId,
      event_type: type === "click" ? "clicked" : "opened",
      recipient_email: decodeURIComponent(email),
      metadata: redirectUrl ? { url: decodeURIComponent(redirectUrl) } : null,
    });

    // Update campaign counters
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
    console.error("track-email-event error:", err);
  }

  // For opens: return 1x1 pixel
  if (type === "open") {
    return new Response(PIXEL_GIF, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  // For clicks: redirect
  if (type === "click" && redirectUrl) {
    return new Response(null, {
      status: 302,
      headers: { Location: decodeURIComponent(redirectUrl) },
    });
  }

  return new Response("OK", { status: 200 });
});

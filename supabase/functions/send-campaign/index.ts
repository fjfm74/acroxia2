import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 500;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Admin access required");

    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error("campaign_id required");

    // Get campaign
    const { data: campaign, error: campError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campError || !campaign) throw new Error("Campaign not found");
    if (campaign.status !== "draft" && campaign.status !== "scheduled") {
      throw new Error(`Campaign status is ${campaign.status}, cannot send`);
    }

    // Update status to sending
    await supabase
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign_id);

    // Collect recipients based on target_audience
    const recipients = new Set<string>();
    const audience = campaign.target_audience;
    const segment = campaign.target_segment;

    // Inquilinos: blog_subscribers + profiles with marketing_consent
    if (audience === "inquilino" || audience === "all") {
      const { data: subs } = await supabase
        .from("blog_subscribers")
        .select("email")
        .eq("audience", "inquilino")
        .eq("confirmed", true)
        .eq("unsubscribed", false);
      subs?.forEach((s: any) => recipients.add(s.email.toLowerCase()));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_type", "inquilino")
        .eq("marketing_consent", true);
      profiles?.forEach((p: any) => recipients.add(p.email.toLowerCase()));
    }

    // Propietarios
    if (audience === "propietario" || audience === "all") {
      const { data: subs } = await supabase
        .from("blog_subscribers")
        .select("email")
        .eq("audience", "propietario")
        .eq("confirmed", true)
        .eq("unsubscribed", false);
      subs?.forEach((s: any) => recipients.add(s.email.toLowerCase()));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_type", "propietario")
        .eq("marketing_consent", true);
      profiles?.forEach((p: any) => recipients.add(p.email.toLowerCase()));
    }

    // Profesionales: marketing_contacts
    if (audience === "profesional" || audience === "all") {
      let query = supabase
        .from("marketing_contacts")
        .select("email")
        .eq("unsubscribed", false);

      if (segment && segment !== "__none__") {
        query = query.eq("segment", segment);
      }

      // Fetch all (may be >1000)
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await query.range(from, from + PAGE - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        data.forEach((c: any) => recipients.add(c.email.toLowerCase()));
        if (data.length < PAGE) break;
        from += PAGE;
      }
    }

    const recipientList = Array.from(recipients);
    const totalRecipients = recipientList.length;

    // Update total_recipients
    await supabase
      .from("email_campaigns")
      .update({ total_recipients: totalRecipients })
      .eq("id", campaign_id);

    if (totalRecipients === 0) {
      await supabase
        .from("email_campaigns")
        .update({ status: "sent", sent_at: new Date().toISOString(), total_sent: 0 })
        .eq("id", campaign_id);

      return new Response(JSON.stringify({ success: true, total: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Inject tracking pixel and wrap links
    const trackBaseUrl = `${SUPABASE_URL}/functions/v1/track-email-event`;
    let totalSent = 0;
    let totalBounced = 0;

    // Send in batches
    for (let i = 0; i < recipientList.length; i += BATCH_SIZE) {
      const batch = recipientList.slice(i, i + BATCH_SIZE);

      const sendPromises = batch.map(async (email) => {
        try {
          // Add tracking pixel and unsubscribe link per recipient
          const trackPixel = `<img src="${trackBaseUrl}?type=open&cid=${campaign_id}&email=${encodeURIComponent(email)}" width="1" height="1" style="display:none;" />`;
          const unsubscribeUrl = `https://acroxia.com/unsubscribe?email=${encodeURIComponent(email)}&source=campaign&cid=${campaign_id}`;
          
          // Replace links for click tracking
          let htmlWithTracking = campaign.html_content;
          htmlWithTracking = htmlWithTracking.replace(
            /href="(https?:\/\/[^"]+)"/g,
            (match: string, url: string) => {
              if (url.includes("unsubscribe")) return match;
              const trackedUrl = `${trackBaseUrl}?type=click&cid=${campaign_id}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(url)}`;
              return `href="${trackedUrl}"`;
            }
          );

          // Add pixel before closing </body> or at end
          htmlWithTracking = htmlWithTracking.replace(
            "</body>",
            `${trackPixel}</body>`
          );

          // Add unsubscribe link if not already present
          if (!htmlWithTracking.includes("Darme de baja")) {
            htmlWithTracking = htmlWithTracking.replace(
              "</div>\n  </div>\n</body>",
              `<div style="text-align:center;padding:16px;"><a href="${unsubscribeUrl}" style="color:#7A7775;font-size:12px;">Darme de baja</a></div></div>\n  </div>\n</body>`
            );
          }

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ACROXIA News <noreply@acroxia.com>",
              to: [email],
              reply_to: "contacto@acroxia.com",
              subject: campaign.subject,
              html: htmlWithTracking,
            }),
          });

          if (response.ok) {
            totalSent++;
            await supabase.from("email_campaign_events").insert({
              campaign_id,
              event_type: "sent",
              recipient_email: email,
            });
          } else {
            const err = await response.json();
            console.error(`Failed to send to ${email}:`, err);
            totalBounced++;
            await supabase.from("email_campaign_events").insert({
              campaign_id,
              event_type: "bounced",
              recipient_email: email,
              metadata: err,
            });
          }
        } catch (err) {
          console.error(`Error sending to ${email}:`, err);
          totalBounced++;
        }
      });

      await Promise.all(sendPromises);

      // Update progress
      await supabase
        .from("email_campaigns")
        .update({ total_sent: totalSent, total_bounced: totalBounced })
        .eq("id", campaign_id);

      if (i + BATCH_SIZE < recipientList.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    // Final update
    await supabase
      .from("email_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        total_sent: totalSent,
        total_bounced: totalBounced,
      })
      .eq("id", campaign_id);

    console.log(`Campaign ${campaign_id} sent: ${totalSent}/${totalRecipients}, bounced: ${totalBounced}`);

    return new Response(
      JSON.stringify({ success: true, total: totalRecipients, sent: totalSent, bounced: totalBounced }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("send-campaign error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

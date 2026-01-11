import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailTemplate } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Lead {
  id: string;
  email: string;
  analysis_id: string;
  contract_status: string;
  email_count: number;
  created_at: string;
}

// Generate secure token for unsubscribe validation
function generateUnsubscribeToken(email: string, secret: string): string {
  const data = email + ':' + secret.slice(0, 8);
  return btoa(data).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    
    // Calculate date thresholds
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    console.log("Starting nurturing email process...");
    console.log(`Looking for Day 2 leads (created before ${twoDaysAgo.toISOString()})`);
    console.log(`Looking for Day 5 leads (created before ${fiveDaysAgo.toISOString()})`);

    // Get leads for Day 2 tips email (email_count = 1, created >= 2 days ago)
    const { data: day2Leads, error: day2Error } = await supabase
      .from("leads")
      .select("id, email, analysis_id, contract_status, email_count, created_at")
      .eq("email_count", 1)
      .eq("unsubscribed", false)
      .is("converted_at", null)
      .lte("created_at", twoDaysAgo.toISOString())
      .limit(50);

    if (day2Error) {
      console.error("Error fetching Day 2 leads:", day2Error);
      throw day2Error;
    }

    // Get leads for Day 5 offer email (email_count = 2, created >= 5 days ago)
    const { data: day5Leads, error: day5Error } = await supabase
      .from("leads")
      .select("id, email, analysis_id, contract_status, email_count, created_at")
      .eq("email_count", 2)
      .eq("unsubscribed", false)
      .is("converted_at", null)
      .lte("created_at", fiveDaysAgo.toISOString())
      .limit(50);

    if (day5Error) {
      console.error("Error fetching Day 5 leads:", day5Error);
      throw day5Error;
    }

    console.log(`Found ${day2Leads?.length || 0} Day 2 leads and ${day5Leads?.length || 0} Day 5 leads`);

    let tipsEmailsSent = 0;
    let offerEmailsSent = 0;
    const errors: string[] = [];

    // Send Day 2 tips emails
    for (const lead of (day2Leads || []) as Lead[]) {
      try {
        const token = generateUnsubscribeToken(lead.email, supabaseServiceKey);
        const unsubscribeUrl = `https://acroxia.com/unsubscribe?email=${encodeURIComponent(lead.email)}&token=${token}`;
        
        const emailTemplate = getEmailTemplate("nurturing_tips", {
          email: lead.email,
          analysisId: lead.analysis_id,
          contractStatus: lead.contract_status,
          unsubscribeUrl,
        });

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ACROXIA <info@acroxia.com>",
            to: [lead.email],
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send tips email to ${lead.email}:`, errorText);
          errors.push(`Tips email to ${lead.email}: ${errorText}`);
          continue;
        }

        // Update lead record
        await supabase
          .from("leads")
          .update({
            email_count: 2,
            last_email_sent_at: new Date().toISOString(),
          })
          .eq("id", lead.id);

        tipsEmailsSent++;
        console.log(`Tips email sent to ${lead.email}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error sending tips email to ${lead.email}:`, error);
        errors.push(`Tips email to ${lead.email}: ${errorMessage}`);
      }
    }

    // Send Day 5 offer emails
    for (const lead of (day5Leads || []) as Lead[]) {
      try {
        const token = generateUnsubscribeToken(lead.email, supabaseServiceKey);
        const unsubscribeUrl = `https://acroxia.com/unsubscribe?email=${encodeURIComponent(lead.email)}&token=${token}`;
        
        const emailTemplate = getEmailTemplate("nurturing_offer", {
          email: lead.email,
          analysisId: lead.analysis_id,
          contractStatus: lead.contract_status,
          unsubscribeUrl,
        });

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ACROXIA <info@acroxia.com>",
            to: [lead.email],
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error(`Failed to send offer email to ${lead.email}:`, errorText);
          errors.push(`Offer email to ${lead.email}: ${errorText}`);
          continue;
        }

        // Update lead record
        await supabase
          .from("leads")
          .update({
            email_count: 3,
            last_email_sent_at: new Date().toISOString(),
          })
          .eq("id", lead.id);

        offerEmailsSent++;
        console.log(`Offer email sent to ${lead.email}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error sending offer email to ${lead.email}:`, error);
        errors.push(`Offer email to ${lead.email}: ${errorMessage}`);
      }
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      stats: {
        day2LeadsFound: day2Leads?.length || 0,
        day5LeadsFound: day5Leads?.length || 0,
        tipsEmailsSent,
        offerEmailsSent,
        totalEmailsSent: tipsEmailsSent + offerEmailsSent,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Nurturing email process completed:", summary);

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in send-nurturing-emails:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

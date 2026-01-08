import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getEmailTemplate, type EmailData } from "../_shared/email-templates.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMIT_MAX = 5; // Max requests
const RATE_LIMIT_WINDOW_HOURS = 1; // Time window in hours

interface SendEmailRequest {
  type: 'confirmation' | 'welcome' | 'password_reset' | 'password_changed' | 'analysis_completed' | 'low_credits' | 'contact';
  to: string;
  data: EmailData;
}

// Get client IP from request headers
function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  const cfIP = req.headers.get("cf-connecting-ip");
  if (cfIP) {
    return cfIP;
  }
  
  return "unknown";
}

// Check rate limit for contact form submissions
async function checkRateLimit(supabase: any, ip: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);
  
  // Count requests in the time window
  const { count, error } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("endpoint", endpoint)
    .gte("created_at", windowStart.toISOString());
  
  if (error) {
    console.error("Rate limit check error:", error);
    // On error, allow the request but log it
    return { allowed: true, remaining: RATE_LIMIT_MAX };
  }
  
  const currentCount = count || 0;
  const remaining = Math.max(0, RATE_LIMIT_MAX - currentCount);
  
  return { 
    allowed: currentCount < RATE_LIMIT_MAX, 
    remaining 
  };
}

// Record a request for rate limiting
async function recordRequest(supabase: any, ip: string, endpoint: string): Promise<void> {
  const { error } = await supabase
    .from("rate_limits")
    .insert({ ip_address: ip, endpoint: endpoint });
  
  if (error) {
    console.error("Failed to record rate limit:", error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: SendEmailRequest = await req.json();

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, to" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Apply rate limiting only to contact form submissions
    if (type === "contact") {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const clientIP = getClientIP(req);
      
      const { allowed, remaining } = await checkRateLimit(supabase, clientIP, "contact_form");
      
      if (!allowed) {
        console.log(`Rate limit exceeded for IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            error: "Has enviado demasiados mensajes. Por favor, espera una hora antes de intentarlo de nuevo.",
            rateLimited: true 
          }),
          { 
            status: 429, 
            headers: { 
              "Content-Type": "application/json",
              "X-RateLimit-Limit": RATE_LIMIT_MAX.toString(),
              "X-RateLimit-Remaining": "0",
              "Retry-After": "3600",
              ...corsHeaders 
            } 
          }
        );
      }
      
      // Record this request
      await recordRequest(supabase, clientIP, "contact_form");
      
      console.log(`Contact form from IP ${clientIP}, remaining: ${remaining - 1}`);
    }

    console.log(`Sending ${type} email to ${to}`);

    const template = getEmailTemplate(type, data);

    // Send via Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ACROXIA <noreply@acroxia.com>",
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Resend API error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    const emailResponse = await response.json();
    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, id: emailResponse.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

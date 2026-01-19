import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    // Validate token
    if (!token) {
      return new Response(
        JSON.stringify({ status: "error", code: "MISSING_TOKEN", message: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(
        JSON.stringify({ status: "error", code: "INVALID_TOKEN", message: "Invalid token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from("blog_subscribers")
      .select("id, confirmed, audience")
      .eq("confirmation_token", token)
      .maybeSingle();

    if (findError) {
      console.error("Error finding subscriber:", findError);
      return new Response(
        JSON.stringify({ status: "error", code: "DB_ERROR", message: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriber) {
      return new Response(
        JSON.stringify({ status: "error", code: "NOT_FOUND", message: "Token not found or expired" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already confirmed
    if (subscriber.confirmed) {
      return new Response(
        JSON.stringify({ 
          status: "already_confirmed", 
          audience: subscriber.audience 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Confirm subscription
    const { error: updateError } = await supabase
      .from("blog_subscribers")
      .update({ 
        confirmed: true, 
        confirmed_at: new Date().toISOString() 
      })
      .eq("id", subscriber.id);

    if (updateError) {
      console.error("Error confirming subscription:", updateError);
      return new Response(
        JSON.stringify({ status: "error", code: "UPDATE_ERROR", message: "Failed to confirm subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Subscription confirmed for audience: ${subscriber.audience}`);

    return new Response(
      JSON.stringify({ 
        status: "success", 
        audience: subscriber.audience 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ status: "error", code: "INTERNAL_ERROR", message: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

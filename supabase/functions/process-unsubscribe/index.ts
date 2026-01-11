import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate token for validation (same algorithm as in send-nurturing-emails)
function generateToken(email: string, secret: string): string {
  const data = email + ':' + secret.slice(0, 8);
  return btoa(data).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, reason } = await req.json();

    if (!email || !token) {
      return new Response(
        JSON.stringify({ success: false, error: "Email y token son requeridos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate token
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expectedToken = generateToken(email, secret);

    if (token !== expectedToken) {
      console.error("Token inválido para email:", email);
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update lead to unsubscribed
    const { data, error } = await supabase
      .from("leads")
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: reason || null,
      })
      .eq("email", email)
      .select()
      .single();

    if (error) {
      console.error("Error actualizando lead:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Error al procesar la solicitud" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: "Email no encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Lead unsubscribed: ${email}, reason: ${reason || 'no especificada'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Te has dado de baja correctamente" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error en process-unsubscribe:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

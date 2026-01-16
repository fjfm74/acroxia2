import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email styles (same as other ACROXIA emails)
const baseStyles = `
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #FAF8F5;
    margin: 0;
    padding: 0;
    color: #1F1D1B;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(31, 29, 27, 0.08);
  }
  .header {
    background-color: #1F1D1B;
    padding: 32px;
    text-align: center;
  }
  .logo {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    color: #FAF8F5;
    letter-spacing: 2px;
    margin: 0;
  }
  .content {
    padding: 48px 40px;
  }
  .title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    color: #1F1D1B;
    margin: 0 0 24px 0;
    text-align: center;
  }
  .text {
    font-size: 16px;
    color: #4A4745;
    margin: 0 0 16px 0;
  }
  .button-container {
    text-align: center;
    margin: 32px 0;
  }
  .button {
    display: inline-block;
    background-color: #1F1D1B;
    color: #FAF8F5 !important;
    padding: 16px 40px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.5px;
  }
  .note {
    font-size: 14px;
    color: #7A7775;
    text-align: center;
    margin-top: 24px;
  }
  .footer {
    background-color: #F5F3F0;
    padding: 32px 40px;
    text-align: center;
  }
  .footer-text {
    font-size: 13px;
    color: #7A7775;
    margin: 0 0 8px 0;
  }
  .footer-link {
    color: #1F1D1B;
    text-decoration: none;
  }
  .highlight-box {
    background-color: #FAF8F5;
    border-radius: 12px;
    padding: 20px;
    margin: 24px 0;
    text-align: center;
  }
`;

const generateConfirmationEmail = (confirmUrl: string, audience: string) => {
  const audienceLabel = audience === "inquilino" ? "inquilinos" : "propietarios";
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 40px 20px; background-color: #FAF8F5;">
    <div class="container">
      <div class="header">
        <h1 class="logo">ACROXIA</h1>
      </div>
      <div class="content">
        <h2 class="title">Confirma tu suscripción</h2>
        <p class="text">¡Hola!</p>
        <p class="text">
          Estás a un clic de recibir nuestros mejores artículos para <strong>${audienceLabel}</strong> directamente en tu bandeja de entrada.
        </p>
        <div class="highlight-box">
          <p style="margin: 0; font-size: 14px; color: #4A4745;">
            📚 Consejos legales, guías prácticas y novedades sobre el alquiler en España
          </p>
        </div>
        <div class="button-container">
          <a href="${confirmUrl}" class="button">Confirmar suscripción</a>
        </div>
        <p class="note">
          Si no solicitaste esta suscripción, puedes ignorar este email.
        </p>
      </div>
      <div class="footer">
        <p class="footer-text">ACROXIA - Tu escudo legal para el alquiler</p>
        <p class="footer-text">
          <a href="mailto:contacto@acroxia.com" class="footer-link">contacto@acroxia.com</a> | Barcelona
        </p>
        <p class="footer-text" style="margin-top: 16px;">
          © 2026 ACROXIA. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, audience } = await req.json();

    if (!email || !audience) {
      return new Response(
        JSON.stringify({ error: "Email y audiencia son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-blog-confirmation] Processing for ${email}, audience: ${audience}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the subscriber to get the confirmation token
    const { data: subscriber, error: findError } = await supabase
      .from("blog_subscribers")
      .select("confirmation_token, confirmed")
      .eq("email", email.toLowerCase())
      .eq("audience", audience)
      .single();

    if (findError || !subscriber) {
      console.error("[send-blog-confirmation] Subscriber not found:", findError);
      return new Response(
        JSON.stringify({ error: "Suscriptor no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (subscriber.confirmed) {
      console.log("[send-blog-confirmation] Already confirmed, skipping email");
      return new Response(
        JSON.stringify({ success: true, message: "Ya confirmado" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate confirmation URL
    const confirmUrl = `https://acroxia.com/confirmar-blog?token=${subscriber.confirmation_token}`;

    // Send confirmation email via Resend API
    const emailHtml = generateConfirmationEmail(confirmUrl, audience);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ACROXIA Blog <blog@acroxia.com>",
        to: [email],
        subject: "Confirma tu suscripción al blog de ACROXIA",
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[send-blog-confirmation] Email error:", errorData);
      throw new Error(errorData.message || "Failed to send email");
    }

    console.log(`[send-blog-confirmation] Confirmation email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Email de confirmación enviado" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("[send-blog-confirmation] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

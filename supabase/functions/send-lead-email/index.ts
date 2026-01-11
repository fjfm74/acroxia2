import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeadEmailRequest {
  email: string;
  analysisId: string;
  contractStatus: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, analysisId, contractStatus }: LeadEmailRequest = await req.json();

    if (!email || !analysisId) {
      throw new Error("Email y analysisId son requeridos");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch analysis data
    const { data: analysis, error: fetchError } = await supabase
      .from("anonymous_analyses")
      .select("*")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      throw new Error("Análisis no encontrado");
    }

    const result = analysis.analysis_result || {};
    
    // Determine status message based on contract status
    let statusMessage = "";
    switch (contractStatus) {
      case "not_signed":
        statusMessage = "Vemos que aún no has firmado el contrato. ¡Estás a tiempo de negociar!";
        break;
      case "signed_want_claim":
        statusMessage = "Aunque ya hayas firmado, las cláusulas ilegales son nulas de pleno derecho y puedes reclamar.";
        break;
      case "need_another":
        statusMessage = "¿Tienes otro contrato que revisar? Recuerda que puedes analizarlo gratis.";
        break;
    }

    // Calculate risk level
    const riskLevel = result.illegal_clauses >= 2 ? "alto" : 
                      result.illegal_clauses >= 1 || result.suspicious_clauses >= 3 ? "medio" : "bajo";

    const riskColor = riskLevel === "alto" ? "#DC2626" : riskLevel === "medio" ? "#D97706" : "#16A34A";

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu resumen de análisis - ACROXIA</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1F1D1B; background-color: #FAF8F5; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 600; margin: 0; color: #1F1D1B;">ACROXIA</h1>
      <p style="color: #6B6B6B; font-size: 14px; margin-top: 8px;">Análisis inteligente de contratos de alquiler</p>
    </div>

    <!-- Main Card -->
    <div style="background-color: #FFFFFF; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
      
      <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 600; margin: 0 0 24px 0;">
        Resumen de tu análisis
      </h2>

      <!-- Risk Level -->
      <div style="background-color: ${riskLevel === 'alto' ? '#FEF2F2' : riskLevel === 'medio' ? '#FFFBEB' : '#F0FDF4'}; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="font-size: 14px; color: #6B6B6B; margin: 0 0 8px 0;">Nivel de riesgo</p>
        <p style="font-size: 28px; font-weight: bold; color: ${riskColor}; margin: 0; text-transform: uppercase;">
          ${riskLevel}
        </p>
      </div>

      <!-- Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
        <div style="text-align: center; padding: 16px; background-color: #F0FDF4; border-radius: 8px;">
          <p style="font-size: 24px; font-weight: bold; color: #16A34A; margin: 0;">${result.valid_clauses || 0}</p>
          <p style="font-size: 12px; color: #6B6B6B; margin: 4px 0 0 0;">Correctas</p>
        </div>
        <div style="text-align: center; padding: 16px; background-color: #FFFBEB; border-radius: 8px;">
          <p style="font-size: 24px; font-weight: bold; color: #D97706; margin: 0;">${result.suspicious_clauses || 0}</p>
          <p style="font-size: 12px; color: #6B6B6B; margin: 4px 0 0 0;">Sospechosas</p>
        </div>
        <div style="text-align: center; padding: 16px; background-color: #FEF2F2; border-radius: 8px;">
          <p style="font-size: 24px; font-weight: bold; color: #DC2626; margin: 0;">${result.illegal_clauses || 0}</p>
          <p style="font-size: 12px; color: #6B6B6B; margin: 4px 0 0 0;">Ilegales</p>
        </div>
      </div>

      <!-- Status Message -->
      ${statusMessage ? `
      <div style="background-color: #F3F4F6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #1F1D1B;">
          💡 ${statusMessage}
        </p>
      </div>
      ` : ''}

      <!-- CTA -->
      <div style="text-align: center; margin-top: 32px;">
        <p style="font-size: 14px; color: #6B6B6B; margin: 0 0 16px 0;">
          ¿Quieres ver el análisis completo con todas las cláusulas y recomendaciones?
        </p>
        <a href="https://acroxia.com/resultado-previo/${analysisId}" style="display: inline-block; background-color: #1F1D1B; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Ver informe completo
        </a>
        <p style="font-size: 12px; color: #6B6B6B; margin-top: 12px;">
          Tu análisis estará disponible durante 24 horas
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 40px; color: #6B6B6B; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        Este análisis es informativo y no constituye asesoramiento legal.
      </p>
      <p style="margin: 0;">
        © 2026 ACROXIA · <a href="https://acroxia.com/privacidad" style="color: #6B6B6B;">Política de privacidad</a>
      </p>
    </div>

  </div>
</body>
</html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ACROXIA <noreply@acroxia.com>",
        to: [email],
        subject: `Tu contrato tiene ${result.illegal_clauses || 0} cláusulas potencialmente ilegales`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error("Error enviando email");
    }

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    // Update lead record with email sent timestamp
    await supabase
      .from("leads")
      .update({ 
        last_email_sent_at: new Date().toISOString(),
        email_count: 1,
      })
      .eq("analysis_id", analysisId)
      .eq("email", email);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in send-lead-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

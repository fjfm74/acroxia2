import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "nuriafrancis@gmail.com";
const SITE_URL = "https://acroxia.com";

interface AlertPayload {
  process: string;
  processName?: string;
  error: string;
  context?: Record<string, any>;
}

function formatContextDetails(context: Record<string, any>): string {
  if (!context || Object.keys(context).length === 0) return "";
  
  const items = Object.entries(context)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      const formattedKey = key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .toLowerCase()
        .replace(/^\w/, c => c.toUpperCase());
      return `<li style="margin-bottom: 8px;"><strong>${formattedKey}:</strong> ${value}</li>`;
    });
  
  return items.length > 0 ? `<ul style="margin: 0; padding-left: 20px;">${items.join("")}</ul>` : "";
}

function getManualExecutionUrl(process: string): string {
  const processUrls: Record<string, string> = {
    "schedule-daily-post": `${SITE_URL}/admin/blog`,
    "schedule-daily-post-landlord": `${SITE_URL}/admin/blog`,
    "monitor-boe": `${SITE_URL}/admin/boe`,
    "send-nurturing-emails": `${SITE_URL}/admin/contacts`,
  };
  return processUrls[process] || `${SITE_URL}/admin`;
}

function generateAlertEmailHTML(payload: AlertPayload): string {
  const timestamp = new Date().toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const contextDetails = formatContextDetails(payload.context || {});
  const manualUrl = getManualExecutionUrl(payload.process);
  const processDisplayName = payload.processName || payload.process;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #FAF8F5; padding: 40px 20px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #DC2626; color: white; padding: 24px 32px; text-align: center; }
    .header h1 { margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; }
    .header .subtitle { margin: 8px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 32px; }
    .alert-box { background: #FEE2E2; border-left: 4px solid #DC2626; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
    .alert-box h2 { margin: 0 0 12px; font-size: 18px; color: #1F1D1B; }
    .alert-box .timestamp { font-size: 14px; color: #5C5752; margin-bottom: 12px; }
    .error-message { background: #F5F3F0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 14px; color: #DC2626; word-break: break-all; margin-bottom: 24px; }
    .details-section { margin-bottom: 24px; }
    .details-section h3 { font-size: 16px; color: #1F1D1B; margin: 0 0 12px; }
    .actions { text-align: center; padding: 24px 0; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 0 8px 12px; }
    .btn-primary { background: #1F1D1B; color: #FAF8F5; }
    .btn-secondary { background: transparent; color: #1F1D1B; border: 2px solid #1F1D1B; }
    .footer { background: #F5F3F0; padding: 20px 32px; text-align: center; color: #5C5752; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ACROXIA</h1>
      <p class="subtitle">⚠️ Alerta del Sistema</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h2>Ha fallado un proceso programado</h2>
        <p class="timestamp">🕐 ${timestamp}</p>
        <p style="margin: 0; font-size: 16px; color: #1F1D1B;"><strong>Proceso:</strong> ${processDisplayName}</p>
      </div>
      
      <div class="error-message">
        ${payload.error}
      </div>
      
      ${contextDetails ? `
      <div class="details-section">
        <h3>Detalles adicionales:</h3>
        ${contextDetails}
      </div>
      ` : ""}
      
      <div class="actions">
        <a href="${SITE_URL}/admin" class="btn btn-primary">Ir al Panel Admin</a>
        <a href="${manualUrl}" class="btn btn-secondary">Ver proceso afectado</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este email se genera automáticamente cuando un proceso crítico falla.</p>
      <p style="margin-top: 8px;">Si el proceso se recuperó automáticamente, no es necesaria ninguna acción.</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: AlertPayload = await req.json();
    
    if (!payload.process || !payload.error) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: process, error" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending alert email for process: ${payload.process}`);
    console.log(`Error: ${payload.error}`);

    const emailHtml = generateAlertEmailHTML(payload);
    const processDisplayName = payload.processName || payload.process;
    const subject = `⚠️ Error en ${processDisplayName}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ACROXIA Alertas <alertas@acroxia.com>",
        to: [ADMIN_EMAIL],
        reply_to: "contacto@acroxia.com",
        subject,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Failed to send alert email:", errorData);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await emailResponse.json();
    console.log("Alert email sent successfully:", result.id);

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-alert-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

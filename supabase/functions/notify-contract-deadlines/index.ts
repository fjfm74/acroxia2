// Envía email interno de aviso URGENTE a admin cuando un contrato
// landlord está a 5 días de vencer el plazo de presentación de la fianza
// (signing_date + 30 días, plazo legal estándar en España).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const ADMIN_EMAIL = "nuriafrancis@gmail.com";
const DAYS_BEFORE = 5;
const PRESENTATION_WINDOW_DAYS = 30; // Plazo legal para presentar fianza

interface ContractRow {
  id: string;
  file_name: string;
  property_address: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
  signing_date: string;
  monthly_rent: number | null;
  deposit_amount: number | null;
  user_id: string;
}

function escapeHtml(v: unknown): string {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function buildHtml(contracts: (ContractRow & { deadline: string; ownerEmail?: string })[]): string {
  const rows = contracts.map((c) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #E8E6E3;font-family:monospace;font-size:12px;">${escapeHtml(c.id.slice(0, 8))}</td>
      <td style="padding:12px;border-bottom:1px solid #E8E6E3;"><strong>${escapeHtml(c.property_address || c.file_name)}</strong><br><span style="color:#7A7775;font-size:12px;">${escapeHtml(c.tenant_name || "Sin inquilino")}</span></td>
      <td style="padding:12px;border-bottom:1px solid #E8E6E3;color:#DC2626;font-weight:600;">${escapeHtml(c.deadline)}</td>
      <td style="padding:12px;border-bottom:1px solid #E8E6E3;font-size:12px;">${escapeHtml(c.ownerEmail || c.user_id.slice(0, 8))}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Inter,Arial,sans-serif;background:#FAF8F5;padding:40px 20px;margin:0;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
    <div style="background:#DC2626;color:#fff;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-family:'Playfair Display',Georgia,serif;font-size:26px;">🚨 AVISO URGENTE</h1>
      <p style="margin:8px 0 0;opacity:.95;font-size:15px;">Expedientes a punto de vencer el plazo de presentación</p>
    </div>
    <div style="padding:32px;">
      <div style="background:#FEE2E2;border-left:4px solid #DC2626;padding:20px;border-radius:8px;margin-bottom:24px;">
        <p style="margin:0 0 8px;font-size:16px;color:#1F1D1B;"><strong>Quedan ${DAYS_BEFORE} días</strong> para que se agote el plazo legal de presentación de fianza de <strong>${contracts.length} expediente${contracts.length !== 1 ? "s" : ""}</strong>.</p>
        <p style="margin:0;font-size:14px;color:#5C5752;">Si no se presenta en plazo, el propietario se expone a <strong>sanciones administrativas</strong> y responsabilidad frente al inquilino. Actúa YA.</p>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#F5F3F0;text-align:left;">
            <th style="padding:12px;">ID</th><th style="padding:12px;">Expediente</th><th style="padding:12px;">Vence</th><th style="padding:12px;">Propietario</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:center;margin-top:28px;">
        <a href="https://contratoalquiler.com/admin" style="display:inline-block;padding:14px 32px;border-radius:50px;background:#1F1D1B;color:#FAF8F5;text-decoration:none;font-weight:600;font-size:14px;">Ir al Panel Admin</a>
      </div>
    </div>
    <div style="background:#F5F3F0;padding:18px 32px;text-align:center;color:#5C5752;font-size:12px;">
      Aviso automático diario · ContratoAlquiler
    </div>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calcula fecha de firma cuyo plazo (signing_date + 30) cae en hoy + 5 días.
    // Es decir: signing_date = hoy + 5 - 30 = hoy - 25
    const target = new Date();
    target.setUTCDate(target.getUTCDate() + DAYS_BEFORE - PRESENTATION_WINDOW_DAYS);
    const targetSigningDate = target.toISOString().slice(0, 10);

    const { data: contracts, error } = await supabase
      .from("landlord_contracts")
      .select("id, file_name, property_address, tenant_name, tenant_email, signing_date, monthly_rent, deposit_amount, user_id")
      .eq("signing_date", targetSigningDate);

    if (error) throw error;

    if (!contracts || contracts.length === 0) {
      console.log(`No contracts with signing_date=${targetSigningDate}`);
      return new Response(JSON.stringify({ success: true, count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enriquecer con email del propietario
    const userIds = [...new Set(contracts.map((c) => c.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);
    const emailById = new Map((profiles || []).map((p: any) => [p.id, p.email]));

    const enriched = contracts.map((c: ContractRow) => {
      const d = new Date(c.signing_date);
      d.setUTCDate(d.getUTCDate() + PRESENTATION_WINDOW_DAYS);
      return { ...c, deadline: d.toISOString().slice(0, 10), ownerEmail: emailById.get(c.user_id) };
    });

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ContratoAlquiler Alertas <noreply@contratoalquiler.com>",
        to: [ADMIN_EMAIL],
        reply_to: "contacto@acroxia.com",
        subject: `🚨 URGENTE: ${contracts.length} expediente${contracts.length !== 1 ? "s" : ""} vence${contracts.length !== 1 ? "n" : ""} el plazo en ${DAYS_BEFORE} días`,
        html: buildHtml(enriched),
      }),
    });

    if (!emailRes.ok) {
      const txt = await emailRes.text();
      console.error("Resend failed:", txt);
      return new Response(JSON.stringify({ success: false, error: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await emailRes.json();
    console.log(`Alert sent for ${contracts.length} contract(s):`, result.id);

    return new Response(JSON.stringify({ success: true, count: contracts.length, emailId: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("notify-contract-deadlines error:", e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

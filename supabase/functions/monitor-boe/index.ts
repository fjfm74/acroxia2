import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Configuration ───────────────────────────────────────────────────────────
const STATE_KEY = "arrendamientos_monitor_v1";
const BOOTSTRAP_DAYS = 45;
const LOOKBACK_OVERLAP_DAYS = 2;
const MAX_SEEN = 5000;

const SEARCH_TERMS = [
  "arrendamiento", "alquiler", "vivienda", "desahucio", "fianza",
  "inquilino", "mercado residencial tensionado", "irav",
  "arrendatario", "arrendador", "renta", "lau"
];

// Section codes as they appear in BOE XML (numeric strings)
const SECTIONS = ["1", "3"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateBOE(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return SEARCH_TERMS.some(t => lower.includes(t));
}

// ─── XML Parsing helpers ─────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : "";
}

function extractAllBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const regex = new RegExp(`<${tag}[\\s>][\\s\\S]*?</${tag}>`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[0]);
  }
  return blocks;
}

// ─── BOE API ─────────────────────────────────────────────────────────────────

interface FoundItem {
  boe_id: string;
  title: string;
  publication_date: string;
  pdf_url: string | null;
  boe_url: string | null;
  section: string | null;
  department: string | null;
  summary: string | null;
  source: string;
}

async function fetchSummary(dateStr: string): Promise<FoundItem[]> {
  const url = `https://www.boe.es/datosabiertos/api/boe/sumario/${dateStr}`;
  console.log(`[BOE] Fetching summary: ${url}`);
  const items: FoundItem[] = [];

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ACROXIA-Monitor/2.0" },
    });
    if (res.status === 404) {
      console.log(`[BOE] No summary for ${dateStr} (404), skipping`);
      return items;
    }
    if (!res.ok) {
      console.warn(`[BOE] Summary ${dateStr} returned ${res.status}`);
      return items;
    }

    const xml = await res.text();
    
    // Extract publication date
    const pubDateRaw = extractTag(xml, "fecha_publicacion") || dateStr;
    const pubDate = pubDateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

    // Find all <seccion> blocks
    const secciones = extractAllBlocks(xml, "seccion");
    console.log(`[BOE] ${dateStr}: found ${secciones.length} secciones`);

    for (const secXml of secciones) {
      const secCode = extractAttr(secXml, "seccion", "codigo");
      
      // Filter by configured sections
      if (SECTIONS.length > 0 && !SECTIONS.includes(secCode)) continue;

      // Find all <item> blocks within this section
      const itemBlocks = extractAllBlocks(secXml, "item");
      
      for (const itemXml of itemBlocks) {
        const identificador = extractTag(itemXml, "identificador");
        const titulo = extractTag(itemXml, "titulo");
        
        if (!identificador || !titulo) continue;
        if (!isRelevant(titulo)) continue;

        // Extract the department from parent context
        // Try to find which departamento this item belongs to
        const deptName = extractAttr(secXml, "departamento", "nombre") || null;

        const pdfUrl = extractTag(itemXml, "url_pdf").replace(/<[^>]*>/g, "").trim() || null;
        const htmlUrl = extractTag(itemXml, "url_html") || `https://www.boe.es/diario_boe/txt.php?id=${identificador}`;

        items.push({
          boe_id: identificador,
          title: titulo,
          publication_date: pubDate,
          pdf_url: pdfUrl || `https://www.boe.es/boe/dias/${pubDate.replace(/-/g, "/")}/pdfs/${identificador}.pdf`,
          boe_url: htmlUrl,
          section: secCode,
          department: deptName,
          summary: titulo.substring(0, 500),
          source: "sumario",
        });

        console.log(`[BOE] MATCH: ${identificador} - ${titulo.substring(0, 80)}...`);
      }
    }
  } catch (err) {
    console.warn(`[BOE] Error fetching summary ${dateStr}:`, err);
  }

  return items;
}

async function fetchLegislation(): Promise<FoundItem[]> {
  const items: FoundItem[] = [];
  const queries = ["arrendamiento urbano vivienda", "mercado residencial tensionado"];

  for (const q of queries) {
    try {
      const url = `https://www.boe.es/datosabiertos/api/legislacion-consolidada?query=${encodeURIComponent(q)}&limit=20`;
      console.log(`[BOE] Legislation search: ${url}`);
      const res = await fetch(url, {
        headers: { "User-Agent": "ACROXIA-Monitor/2.0" },
      });
      if (!res.ok) {
        console.warn(`[BOE] Legislation search ${res.status}`);
        continue;
      }

      const xml = await res.text();
      const itemBlocks = extractAllBlocks(xml, "item");
      console.log(`[BOE] Legislation "${q}": ${itemBlocks.length} items`);

      for (const itemXml of itemBlocks) {
        const id = extractTag(itemXml, "identificador");
        const titulo = extractTag(itemXml, "titulo");
        if (!id || !titulo) continue;

        const urlPdf = extractTag(itemXml, "url_pdf").replace(/<[^>]*>/g, "").trim() || null;
        const urlHtml = extractTag(itemXml, "url_html") || null;
        const fechaPub = extractTag(itemXml, "fecha_publicacion") || formatDateISO(new Date());

        items.push({
          boe_id: id,
          title: titulo,
          publication_date: fechaPub.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
          pdf_url: urlPdf,
          boe_url: urlHtml,
          section: null,
          department: null,
          summary: titulo.substring(0, 500),
          source: "legislacion_consolidada",
        });
      }
    } catch (err) {
      console.warn(`[BOE] Legislation search error:`, err);
    }
  }
  return items;
}

// ─── State Management ────────────────────────────────────────────────────────

interface MonitorState {
  last_checked: string;
  seen_ids: string[];
}

async function loadState(supabase: any): Promise<MonitorState> {
  const { data } = await supabase
    .from("legal_monitor_state")
    .select("value")
    .eq("key", STATE_KEY)
    .maybeSingle();

  if (data?.value) return data.value as MonitorState;

  const from = new Date();
  from.setDate(from.getDate() - BOOTSTRAP_DAYS);
  return { last_checked: formatDateISO(from), seen_ids: [] };
}

async function saveState(supabase: any, state: MonitorState): Promise<void> {
  if (state.seen_ids.length > MAX_SEEN) {
    state.seen_ids = state.seen_ids.slice(-MAX_SEEN);
  }
  await supabase
    .from("legal_monitor_state")
    .upsert({ key: STATE_KEY, value: state, updated_at: new Date().toISOString() }, { onConflict: "key" });
}

// ─── Email Notification ─────────────────────────────────────────────────────

function buildEmailHtml(items: FoundItem[], fromDate: string, toDate: string): string {
  const rows = items.map(item => `
    <tr style="border-bottom:1px solid #E5E2DE;">
      <td style="padding:16px;">
        <div style="font-size:11px;color:#8B8680;margin-bottom:6px;">
          ${item.boe_id} · ${item.section ? `Sección ${item.section}` : item.source} · ${item.department || ""}
        </div>
        <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#1F1D1B;margin:0 0 8px;line-height:1.4;">
          ${item.title}
        </h3>
        <div>
          ${item.boe_url ? `<a href="${item.boe_url}" style="display:inline-block;background:#1F1D1B;color:#FAF8F5;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:13px;margin-right:8px;">Ver en BOE</a>` : ""}
          ${item.pdf_url ? `<a href="${item.pdf_url}" style="display:inline-block;border:1px solid #1F1D1B;color:#1F1D1B;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:13px;">PDF</a>` : ""}
        </div>
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#F5F3F0;">
    <div style="max-width:600px;margin:0 auto;background:#FAF8F5;">
      <div style="background:#1F1D1B;padding:28px;text-align:center;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;color:#FAF8F5;font-size:22px;margin:0;">ACROXIA</h1>
        <p style="color:#A8A49E;font-size:11px;margin:6px 0 0;letter-spacing:2px;">MONITOR BOE · ARRENDAMIENTOS</p>
      </div>
      <div style="padding:28px;">
        <div style="background:#E8F5E9;border-left:4px solid #22C55E;padding:14px 18px;margin-bottom:20px;">
          <p style="margin:0;color:#1F1D1B;font-size:15px;"><strong>${items.length}</strong> novedad${items.length !== 1 ? "es" : ""}</p>
          <p style="margin:4px 0 0;color:#5C5752;font-size:13px;">Periodo: ${fromDate} → ${toDate}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
        <div style="text-align:center;margin-top:24px;">
          <a href="https://acroxia.com/admin/boe" style="display:inline-block;background:#1F1D1B;color:#FAF8F5;padding:12px 24px;border-radius:50px;text-decoration:none;font-size:14px;">Panel de Administración</a>
        </div>
      </div>
      <div style="background:#F5F3F0;padding:20px;text-align:center;">
        <p style="margin:0;font-size:11px;color:#8B8680;">Monitor automático BOE · © 2026 ACROXIA</p>
      </div>
    </div>
  </body></html>`;
}

async function sendNotification(items: FoundItem[], fromDate: string, toDate: string, supabaseUrl: string, resendKey: string | undefined): Promise<void> {
  if (!resendKey) {
    console.warn("[NOTIFY] No RESEND_API_KEY, skipping email");
    return;
  }
  const html = buildEmailHtml(items, fromDate, toDate);
  const subject = `🔔 BOE: ${items.length} novedad${items.length !== 1 ? "es" : ""} sobre arrendamientos – ${toDate}`;
  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "ACROXIA Monitor <alertas@acroxia.com>",
        to: ["nuriafrancis@gmail.com"],
        reply_to: "contacto@acroxia.com",
        subject,
        html,
      }),
    });
    console.log(emailRes.ok ? "[NOTIFY] Email sent" : `[NOTIFY] Email failed: ${await emailRes.text()}`);
  } catch (err) {
    console.error("[NOTIFY] Email error:", err);
  }
}

// ─── Main Handler ────────────────────────────────────────────────────────────

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  let source = "manual";
  try { const body = await req.json(); source = body.source || "manual"; } catch { /* no body */ }

  console.log(`[MONITOR] Started – source: ${source}`);
  const result: any = { ok: false, from: "", to: "", encontrados: 0, nuevos: 0, aviso: null };

  try {
    // 1. Load state
    const state = await loadState(supabase);
    const seenSet = new Set(state.seen_ids);

    // 2. Date range with lookback overlap
    const lastChecked = new Date(state.last_checked);
    const fromDate = new Date(lastChecked);
    fromDate.setDate(fromDate.getDate() - LOOKBACK_OVERLAP_DAYS);
    const toDate = new Date();

    result.from = formatDateBOE(fromDate);
    result.to = formatDateBOE(toDate);
    console.log(`[MONITOR] Range: ${result.from} → ${result.to}, seen_ids: ${seenSet.size}`);

    // 3. Fetch summaries for each day
    const allItems: FoundItem[] = [];
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dayItems = await fetchSummary(formatDateBOE(current));
      allItems.push(...dayItems);
      current.setDate(current.getDate() + 1);
    }

    // 4. Also fetch legislation
    const legItems = await fetchLegislation();
    allItems.push(...legItems);

    result.encontrados = allItems.length;
    console.log(`[MONITOR] Total found: ${allItems.length}`);

    // 5. Deduplicate against seen_ids
    const newItems: FoundItem[] = [];
    for (const item of allItems) {
      if (!seenSet.has(item.boe_id)) {
        seenSet.add(item.boe_id);
        newItems.push(item);
      }
    }
    result.nuevos = newItems.length;
    console.log(`[MONITOR] New items: ${newItems.length}`);

    // 6. Insert new items
    if (newItems.length > 0) {
      const { error: insertErr } = await supabase
        .from("boe_publications")
        .upsert(
          newItems.map(item => ({
            boe_id: item.boe_id,
            title: item.title,
            publication_date: item.publication_date,
            pdf_url: item.pdf_url,
            boe_url: item.boe_url,
            section: item.section,
            department: item.department,
            summary: item.summary,
            status: "pending_review",
          })),
          { onConflict: "boe_id" }
        );
      if (insertErr) {
        console.error("[MONITOR] Insert error:", insertErr);
        result.aviso = `Error al insertar: ${insertErr.message}`;
      }

      // 7. Send notification
      await sendNotification(newItems, formatDateISO(fromDate), formatDateISO(toDate), supabaseUrl, resendKey);
    }

    // 8. Save state
    state.last_checked = formatDateISO(toDate);
    state.seen_ids = Array.from(seenSet);
    await saveState(supabase, state);

    // 9. Log
    await supabase.from("boe_monitoring_logs").insert({
      source,
      success: true,
      publications_found: result.encontrados,
      new_publications: result.nuevos,
      error_message: result.aviso,
    });

    result.ok = true;
    console.log(`[MONITOR] Done – ${JSON.stringify(result)}`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[MONITOR] Fatal error:", err);
    result.aviso = err.message || "Unknown error";
    await supabase.from("boe_monitoring_logs").insert({
      source, success: false, publications_found: result.encontrados,
      new_publications: result.nuevos, error_message: result.aviso, retry_pending: true,
    });
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ process: "monitor-boe", processName: "Monitor BOE", error: err.message, context: { source } }),
      });
    } catch { /* best effort */ }
    return new Response(JSON.stringify(result), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(handler);

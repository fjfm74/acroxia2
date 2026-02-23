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
  "arrendatario", "arrendador", "renta", "LAU"
];

const SECTIONS = ["I", "III"];

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
  return SEARCH_TERMS.some(t => lower.includes(t.toLowerCase()));
}

function stableId(item: any): string {
  return item.id || item.identificador || item.urlPdf || `${item.titulo?.substring(0, 80)}_${item.fechaPublicacion || ""}`;
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
      headers: { Accept: "application/json", "User-Agent": "ACROXIA-Monitor/2.0" },
    });
    if (res.status === 404) {
      console.log(`[BOE] No summary for ${dateStr} (404), skipping`);
      return items;
    }
    if (!res.ok) {
      console.warn(`[BOE] Summary ${dateStr} returned ${res.status}`);
      return items;
    }

    const json = await res.json();
    const data = json?.data?.sumario;
    if (!data) return items;

    const pubDate = data.metaInfo?.fechaPublicacion || dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
    const diario = data.diario || [];

    for (const seccion of diario) {
      const secId = seccion.seccion?.codigo || "";
      if (SECTIONS.length > 0 && !SECTIONS.includes(secId)) continue;

      const walk = (container: any) => {
        const entries = container.items || container.epigrafes || container.departamentos || [];
        for (const entry of entries) {
          if (entry.items || entry.epigrafes || entry.departamentos) {
            walk(entry);
          }
          const titulo = entry.titulo || entry.title || "";
          const id = entry.id || entry.identificador || "";
          if (!titulo || !id) continue;
          if (!isRelevant(titulo)) continue;

          items.push({
            boe_id: id,
            title: titulo,
            publication_date: pubDate,
            pdf_url: entry.urlPdf || null,
            boe_url: entry.urlHtml || `https://www.boe.es/diario_boe/txt.php?id=${id}`,
            section: secId || null,
            department: entry.departamento || container.departamento || null,
            summary: (entry.control || titulo).substring(0, 500),
            source: "sumario",
          });
        }
      };
      walk(seccion);
    }
  } catch (err) {
    console.warn(`[BOE] Error fetching summary ${dateStr}:`, err);
  }

  return items;
}

async function fetchLegislation(): Promise<FoundItem[]> {
  const items: FoundItem[] = [];
  const queries = ["arrendamiento urbano vivienda", "mercado residencial tensionado irav"];

  for (const q of queries) {
    try {
      const url = `https://www.boe.es/datosabiertos/api/legislacion-consolidada?query=${encodeURIComponent(q)}&limit=50`;
      console.log(`[BOE] Legislation search: ${url}`);
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "ACROXIA-Monitor/2.0" },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const results = json?.data?.items || json?.data || [];
      for (const r of results) {
        const titulo = r.titulo || r.title || "";
        const id = r.id || r.identificador || "";
        if (!titulo || !id) continue;

        items.push({
          boe_id: id,
          title: titulo,
          publication_date: r.fechaPublicacion || r.fecha_publicacion || formatDateISO(new Date()),
          pdf_url: r.urlPdf || null,
          boe_url: r.urlHtml || r.url || null,
          section: null,
          department: r.departamento || null,
          summary: (r.analisis || titulo).substring(0, 500),
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
  last_checked: string; // ISO date
  seen_ids: string[];
}

async function loadState(supabase: any): Promise<MonitorState> {
  const { data } = await supabase
    .from("legal_monitor_state")
    .select("value")
    .eq("key", STATE_KEY)
    .maybeSingle();

  if (data?.value) {
    return data.value as MonitorState;
  }

  // Bootstrap: start from BOOTSTRAP_DAYS ago
  const from = new Date();
  from.setDate(from.getDate() - BOOTSTRAP_DAYS);
  return { last_checked: formatDateISO(from), seen_ids: [] };
}

async function saveState(supabase: any, state: MonitorState): Promise<void> {
  // Trim seen_ids to MAX_SEEN
  if (state.seen_ids.length > MAX_SEEN) {
    state.seen_ids = state.seen_ids.slice(-MAX_SEEN);
  }

  await supabase
    .from("legal_monitor_state")
    .upsert({
      key: STATE_KEY,
      value: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" });
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
        <div style="display:flex;gap:8px;">
          ${item.boe_url ? `<a href="${item.boe_url}" style="display:inline-block;background:#1F1D1B;color:#FAF8F5;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:13px;">Ver en BOE</a>` : ""}
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
          <p style="margin:0;color:#1F1D1B;font-size:15px;"><strong>${items.length}</strong> novedad${items.length !== 1 ? "es" : ""} encontrada${items.length !== 1 ? "s" : ""}</p>
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
    if (emailRes.ok) {
      console.log("[NOTIFY] Email sent successfully");
    } else {
      console.error("[NOTIFY] Email failed:", await emailRes.text());
    }
  } catch (err) {
    console.error("[NOTIFY] Email error:", err);
  }

  // Also send alert
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        process: "monitor-boe",
        processName: "Monitor BOE Arrendamientos",
        error: `${items.length} novedades encontradas (${fromDate} → ${toDate})`,
        context: { count: items.length, titles: items.slice(0, 5).map(i => i.title.substring(0, 80)) },
      }),
    });
  } catch { /* best effort */ }
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
  try {
    const body = await req.json();
    source = body.source || "manual";
  } catch { /* no body */ }

  console.log(`[MONITOR] Started – source: ${source}`);

  const result: any = { ok: false, from: "", to: "", encontrados: 0, nuevos: 0, aviso: null };

  try {
    // 1. Load state
    const state = await loadState(supabase);
    const seenSet = new Set(state.seen_ids);

    // 2. Calculate date range with lookback overlap
    const lastChecked = new Date(state.last_checked);
    const fromDate = new Date(lastChecked);
    fromDate.setDate(fromDate.getDate() - LOOKBACK_OVERLAP_DAYS);
    const toDate = new Date();

    result.from = formatDateBOE(fromDate);
    result.to = formatDateBOE(toDate);

    console.log(`[MONITOR] Range: ${result.from} → ${result.to}, seen_ids: ${seenSet.size}`);

    // 3. Fetch summaries for each day in range
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
      const id = item.boe_id;
      if (!seenSet.has(id)) {
        seenSet.add(id);
        newItems.push(item);
      }
    }

    result.nuevos = newItems.length;
    console.log(`[MONITOR] New items: ${newItems.length}`);

    // 6. Insert new items into boe_publications
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
      source,
      success: false,
      publications_found: result.encontrados,
      new_publications: result.nuevos,
      error_message: result.aviso,
      retry_pending: true,
    });

    // Alert
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          process: "monitor-boe",
          processName: "Monitor BOE",
          error: err.message,
          context: { source, attempted_at: new Date().toISOString() },
        }),
      });
    } catch { /* best effort */ }

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(handler);

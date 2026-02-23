import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Configuration ───────────────────────────────────────────────────────────
const STATE_KEY = "arrendamientos_monitor_v2_acroxia";
const BOOTSTRAP_DAYS = 45;
const LOOKBACK_OVERLAP_DAYS = 2;
const MAX_SEEN = 5000;

// ─── Relevance: INCLUDE patterns ─────────────────────────────────────────────
const INCLUDE_PATTERNS: RegExp[] = [
  // Core rental legislation
  /ley\s*29\/1994/i,
  /arrendamientos?\s*urbanos?/i,
  /ley\s*12\/2023/i,
  /derecho\s*a\s*la\s*vivienda/i,
  /\birav\b/i,
  /índice\s*de\s*referencia\s*de\s*arrendamientos?\s*de\s*vivienda/i,
  // Tensioned zones
  /zonas?\s*(de\s*)?mercado\s*residencial\s*tensionad/i,
  /mercado\s*residencial\s*tensionado/i,
  // Financial aspects
  /depósito\s*de\s*fianza/i,
  /fianzas?\s*de\s*arrendamientos?/i,
  /gastos?\s*de\s*gestión\s*inmobiliaria/i,
  /garantía\s*adicional/i,
  /actualización\s*de\s*renta/i,
  /subida\s*(de(l)?\s*)?alquiler/i,
  // Contract lifecycle
  /prórroga.{0,30}arrendamiento/i,
  /preaviso.{0,30}arrendamiento/i,
  /arrendamiento.{0,30}prórroga/i,
  /arrendamiento.{0,30}preaviso/i,
  /contrato\s*de\s*alquiler\s*residencial/i,
  /arrendamiento\s*de\s*vivienda/i,
  /renta\s*de\s*alquiler/i,
  // Housing laws (autonómicas y estatales)
  /\bley\b.{0,20}\bvivienda\b/i,
  /\bvivienda\b.{0,20}\b(ley|decreto|real\s*decreto|orden)\b/i,
  /\bpolítica\s*(de\s*)?vivienda\b/i,
  /\bparque\s*(público\s*)?de\s*vivienda/i,
  /vivienda\s*(protegida|social|asequible|habitual)/i,
  /alquiler\s*(social|asequible|protegido)/i,
  // Evictions & tenants
  /desahucio/i,
  /lanzamiento.{0,30}(vivienda|arrendamiento|inquilino)/i,
  /\binquilino/i,
  /\barrendatario/i,
  /\barrendador/i,
  // Abusive clauses
  /cláusula.{0,20}(abusiva|nula).{0,30}(alquiler|arrendamiento|vivienda)/i,
  // Registry & government
  /registro\s*de\s*contratos\s*de\s*arrendamiento/i,
  /secretaría\s*de\s*estado\s*de\s*vivienda/i,
];

// ─── Relevance: EXCLUDE patterns (strict) ────────────────────────────────────
const EXCLUDE_PATTERNS: RegExp[] = [
  /alquiler\s*de\s*corta\s*duración/i,
  /uso\s*turístico/i,
  /turístic[oa]/i,
  /vacacional/i,
  /número\s*de\s*registro/i,
  /registro\s*único/i,
  /código\s*de\s*alquiler/i,
  /anuncio\s*de\s*(licitación|formalización|adjudicación)/i,
  /expediente\s*:/i,
  /objeto\s*:/i,
  /arrendamiento\s*de\s*(vehículos?|equipos?|licencias?|maquinaria|software)/i,
  /\birpf\b/i,
  /\biva\b/i,
  /impuesto\s*sobre\s*la\s*renta/i,
  /impuesto\s*sobre\s*(el\s*)?valor\s*añadido/i,
  /dgsjfp/i,
  /recurso\s*registral.{0,40}turístic/i,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateBOE(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function isRelevant(text: string, id?: string): { relevant: boolean; reason: string } {
  for (const pat of EXCLUDE_PATTERNS) {
    if (pat.test(text)) return { relevant: false, reason: `EXCLUDED by ${pat.source}` };
  }
  for (const pat of INCLUDE_PATTERNS) {
    if (pat.test(text)) return { relevant: true, reason: `INCLUDED by ${pat.source}` };
  }
  return { relevant: false, reason: "NO_MATCH" };
}

function isExcludedId(id: string): boolean {
  return id.startsWith("BOE-B-");
}

// ─── XML Parsing ─────────────────────────────────────────────────────────────

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

// ─── BOE API (XML) ──────────────────────────────────────────────────────────

interface FoundItem {
  identificador: string;
  titulo: string;
  fecha: string;
  fuente: string;
  url: string;
  seccion?: string;
  departamento?: string;
}

async function fetchSummary(dateStr: string): Promise<FoundItem[]> {
  const url = `https://www.boe.es/datosabiertos/api/boe/sumario/${dateStr}`;
  const items: FoundItem[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/xml, text/xml, */*",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    });
    if (res.status === 404) {
      console.log(`[BOE] ${dateStr}: 404, skip`);
      return items;
    }
    if (!res.ok) {
      console.warn(`[BOE] ${dateStr}: HTTP ${res.status}`);
      return items;
    }

    const xml = await res.text();
    
    // Check status code inside XML
    const statusCode = extractTag(xml, "code");
    if (statusCode && statusCode !== "200") {
      console.warn(`[BOE] ${dateStr}: XML status ${statusCode}`);
      return items;
    }

    const pubDateRaw = extractTag(xml, "fecha_publicacion") || dateStr;
    const formattedDate = pubDateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

    // Parse: <seccion> → <departamento> → <epigrafe> → <item>
    const secciones = extractAllBlocks(xml, "seccion");

    for (const secXml of secciones) {
      const secCode = extractAttr(secXml, "seccion", "codigo");
      const secName = extractAttr(secXml, "seccion", "nombre");

      const departamentos = extractAllBlocks(secXml, "departamento");
      for (const deptXml of departamentos) {
        const deptName = extractAttr(deptXml, "departamento", "nombre");

        // Items can be inside <epigrafe> or directly in <departamento>
        const itemBlocks = extractAllBlocks(deptXml, "item");

        for (const itemXml of itemBlocks) {
          const id = extractTag(itemXml, "identificador");
          const titulo = extractTag(itemXml, "titulo");

          if (!id || !titulo) continue;
          if (isExcludedId(id)) {
            console.log(`[BOE] ✗ ${id} – EXCLUDED (BOE-B- prefix)`);
            continue;
          }

          const fullText = `${titulo} ${deptName} ${secName}`;
          const { relevant, reason } = isRelevant(fullText, id);
          
          if (!relevant) {
            // Log excluded and no-match items for debugging
            if (reason.startsWith("EXCLUDED")) {
              console.log(`[BOE] ✗ ${id} – ${reason} – ${titulo.substring(0, 120)}`);
            }
            // Log ALL items from sections 1 and 2 (legislative sections) even if no match
            if (secCode === "1" || secCode === "2" || secCode === "2A" || secCode === "2B") {
              console.log(`[BOE] ? ${id} [S${secCode}] – ${reason} – ${titulo.substring(0, 150)}`);
            }
            continue;
          }

          const urlHtml = extractTag(itemXml, "url_html") || `https://www.boe.es/diario_boe/txt.php?id=${id}`;

          items.push({
            identificador: id,
            titulo,
            fecha: formattedDate,
            fuente: "boe_sumario",
            url: urlHtml,
            seccion: secCode,
            departamento: deptName,
          });

          console.log(`[BOE] ✓ ${id} [S${secCode}] – ${reason} – ${titulo.substring(0, 100)}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[BOE] Error sumario ${dateStr}:`, err);
  }

  return items;
}

// ─── State ───────────────────────────────────────────────────────────────────

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
          ${item.identificador} · Sección ${item.seccion || "?"} · ${item.departamento || ""}
        </div>
        <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#1F1D1B;margin:0 0 8px;line-height:1.4;">
          ${item.titulo}
        </h3>
        <a href="${item.url}" style="display:inline-block;background:#1F1D1B;color:#FAF8F5;padding:8px 16px;border-radius:50px;text-decoration:none;font-size:13px;">Ver en BOE</a>
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;font-family:'Inter',Arial,sans-serif;background:#F5F3F0;">
    <div style="max-width:600px;margin:0 auto;background:#FAF8F5;">
      <div style="background:#1F1D1B;padding:28px;text-align:center;">
        <h1 style="font-family:'Playfair Display',Georgia,serif;color:#FAF8F5;font-size:22px;margin:0;">ACROXIA</h1>
        <p style="color:#A8A49E;font-size:11px;margin:6px 0 0;letter-spacing:2px;">MONITOR BOE · ARRENDAMIENTOS v2</p>
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
        <p style="margin:0;font-size:11px;color:#8B8680;">Monitor automático BOE v2 · © 2026 ACROXIA</p>
      </div>
    </div>
  </body></html>`;
}

async function sendNotification(items: FoundItem[], fromDate: string, toDate: string, resendKey: string | undefined): Promise<void> {
  if (!resendKey) {
    console.warn("[NOTIFY] No RESEND_API_KEY, skipping");
    return;
  }
  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: "ACROXIA Monitor <alertas@acroxia.com>",
        to: ["nuriafrancis@gmail.com"],
        reply_to: "contacto@acroxia.com",
        subject: `🔔 BOE: ${items.length} novedad${items.length !== 1 ? "es" : ""} arrendamientos – ${toDate}`,
        html: buildEmailHtml(items, fromDate, toDate),
      }),
    });
    console.log(emailRes.ok ? "[NOTIFY] Email sent ✓" : `[NOTIFY] Email failed: ${await emailRes.text()}`);
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

  console.log(`[MONITOR v2] Started – source: ${source}`);
  const result: any = {
    ok: false, from: "", to: "", encontrados: 0, nuevos: 0,
    detalle_fuentes: { legislacion_consolidada: 0, boe_sumario: 0 },
    aviso: null,
  };

  try {
    const state = await loadState(supabase);
    const seenSet = new Set(state.seen_ids);

    const lastChecked = new Date(state.last_checked);
    const fromDate = new Date(lastChecked);
    fromDate.setDate(fromDate.getDate() - LOOKBACK_OVERLAP_DAYS);
    const toDate = new Date();

    result.from = formatDateBOE(fromDate);
    result.to = formatDateBOE(toDate);
    console.log(`[MONITOR v2] Range: ${result.from} → ${result.to}, seen: ${seenSet.size}`);

    // Fetch summaries day by day
    const allItems: FoundItem[] = [];
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dayItems = await fetchSummary(formatDateBOE(current));
      allItems.push(...dayItems);
      current.setDate(current.getDate() + 1);
    }
    result.detalle_fuentes.boe_sumario = allItems.length;
    result.encontrados = allItems.length;
    console.log(`[MONITOR v2] Found: ${allItems.length} relevant items from sumarios`);

    // Deduplicate
    const newItems: FoundItem[] = [];
    for (const item of allItems) {
      const dedupeKey = item.identificador || `${item.fuente}|${item.fecha}|${item.titulo}`;
      if (!seenSet.has(dedupeKey)) {
        seenSet.add(dedupeKey);
        newItems.push(item);
      }
    }
    result.nuevos = newItems.length;
    console.log(`[MONITOR v2] New: ${newItems.length}`);

    // Insert into boe_publications
    if (newItems.length > 0) {
      const { error: insertErr } = await supabase
        .from("boe_publications")
        .upsert(
          newItems.map(item => ({
            boe_id: item.identificador,
            title: item.titulo,
            publication_date: item.fecha,
            pdf_url: null,
            boe_url: item.url,
            section: item.seccion || null,
            department: item.departamento || null,
            summary: item.titulo.substring(0, 500),
            status: "pending_review",
          })),
          { onConflict: "boe_id" }
        );
      if (insertErr) {
        console.error("[MONITOR v2] Insert error:", insertErr);
        result.aviso = `Error al insertar: ${insertErr.message}`;
      }

      await sendNotification(newItems, formatDateISO(fromDate), formatDateISO(toDate), resendKey);
    }

    // Save state always
    state.last_checked = formatDateISO(toDate);
    state.seen_ids = Array.from(seenSet);
    await saveState(supabase, state);

    // Log
    await supabase.from("boe_monitoring_logs").insert({
      source, success: true,
      publications_found: result.encontrados,
      new_publications: result.nuevos,
      error_message: result.aviso,
    });

    result.ok = true;
    console.log(`[MONITOR v2] Done – ${JSON.stringify(result)}`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[MONITOR v2] Fatal:", err);
    result.aviso = err.message || "Unknown error";
    await supabase.from("boe_monitoring_logs").insert({
      source, success: false, publications_found: result.encontrados,
      new_publications: result.nuevos, error_message: result.aviso, retry_pending: true,
    });
    return new Response(JSON.stringify(result), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(handler);

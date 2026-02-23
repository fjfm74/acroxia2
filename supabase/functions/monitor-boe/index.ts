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

// ─── INCLUDE_STRONG: patrones de inclusión directa ───────────────────────────
const INCLUDE_STRONG: { label: string; pattern: RegExp }[] = [
  { label: "LAU_29_1994", pattern: /arrendamientos?\s+urbanos?|ley\s+29\/1994/i },
  { label: "LEY_12_2023", pattern: /ley\s+12\/2023|derecho\s+a\s+la\s+vivienda/i },
  { label: "IRAV", pattern: /\birav\b|índice\s+de\s+referencia\s+de\s+arrendamientos\s+de\s+vivienda/i },
  { label: "ZONA_TENSIONADA", pattern: /zona(?:s)?\s+de\s+mercado\s+residencial\s+tensionad/i },
  { label: "LEY_VIVIENDA_CCAA", pattern: /ley\s+\d+\/\d{4}.*\bde\s+vivienda\b/i },
  { label: "DECRETO_VIVIENDA", pattern: /decreto-ley\s+\d+\/\d{4}.*\b(vivienda|alquiler|arrendamiento)\b/i },
  { label: "DEPOSITO_FIANZA", pattern: /dep[oó]sito\s+de\s+fianza|fianzas?\s+de\s+arrendamientos/i },
  { label: "GASTOS_GESTION", pattern: /gastos\s+de\s+gesti[oó]n\s+inmobiliaria/i },
  { label: "GARANTIA_ADICIONAL", pattern: /garant[ií]a\s+adicional.{0,40}(arrend|alquiler)/i },
  { label: "ACTUALIZACION_RENTA", pattern: /actualizaci[oó]n\s+de\s+renta.{0,40}(arrend|alquiler)|subida\s+del\s+alquiler/i },
  { label: "PRORROGA", pattern: /pr[oó]rroga.{0,40}(arrend|alquiler|contrato\s+de\s+alquiler)/i },
  { label: "PREAVISO", pattern: /preaviso.{0,40}(arrend|alquiler|contrato\s+de\s+alquiler)/i },
  { label: "MERCADO_TENSIONADO", pattern: /mercado\s+residencial\s+tensionado/i },
  { label: "VIVIENDA_PROTEGIDA", pattern: /vivienda\s+(protegida|social|asequible|habitual)/i },
  { label: "ALQUILER_SOCIAL", pattern: /alquiler\s+(social|asequible|protegido)/i },
  { label: "DESAHUCIO", pattern: /desahucio/i },
  { label: "POLITICA_VIVIENDA", pattern: /\bpolítica\s+(de\s+)?vivienda\b/i },
  { label: "PARQUE_VIVIENDA", pattern: /\bparque\s+(público\s+)?de\s+vivienda/i },
  { label: "CONTRATO_ALQUILER", pattern: /contrato\s+de\s+alquiler\s+residencial/i },
  { label: "ARRENDAMIENTO_VIVIENDA", pattern: /arrendamiento\s+de\s+vivienda/i },
  { label: "RENTA_ALQUILER", pattern: /renta\s+de\s+alquiler/i },
  { label: "REGISTRO_CONTRATOS", pattern: /registro\s+de\s+contratos\s+de\s+arrendamiento/i },
  { label: "SECRETARIA_VIVIENDA", pattern: /secretaría\s+de\s+estado\s+de\s+vivienda/i },
  { label: "INQUILINO", pattern: /\binquilino/i },
  { label: "ARRENDATARIO", pattern: /\barrendatario/i },
  { label: "ARRENDADOR", pattern: /\barrendador/i },
  { label: "CLAUSULA_ABUSIVA", pattern: /cláusula.{0,20}(abusiva|nula).{0,30}(alquiler|arrendamiento|vivienda)/i },
  { label: "LANZAMIENTO_VIVIENDA", pattern: /lanzamiento.{0,30}(vivienda|arrendamiento|inquilino)/i },
  { label: "LEY_VIVIENDA_GENERIC", pattern: /\bley\b.{0,20}\bvivienda\b/i },
  { label: "VIVIENDA_DECRETO", pattern: /\bvivienda\b.{0,20}\b(ley|decreto|real\s+decreto|orden)\b/i },
];

// ─── Jurisprudencia constitucional relevante ─────────────────────────────────
function isConstitucionalRelevant(text: string): boolean {
  if (!/sentencia/i.test(text)) return false;
  if (!/recurso\s+de\s+inconstitucionalidad/i.test(text)) return false;
  return /ley\s+12\/2023|vivienda|arrendamientos?\s+urbanos?/i.test(text);
}

// ─── EXCLUDE: patrones de exclusión dura ─────────────────────────────────────
const EXCLUDE_HARD: { label: string; pattern: RegExp }[] = [
  { label: "TURISMO_CORTA", pattern: /alquiler\s+de\s+corta\s+duración/i },
  { label: "USO_TURISTICO", pattern: /uso\s+turístico/i },
  { label: "TURISTICO", pattern: /turístic[oa]/i },
  { label: "VACACIONAL", pattern: /vacacional/i },
  { label: "NUM_REGISTRO", pattern: /número\s+de\s+registro/i },
  { label: "REGISTRO_UNICO", pattern: /registro\s+único/i },
  { label: "CODIGO_ALQUILER", pattern: /código\s+de\s+alquiler/i },
  { label: "LICITACION", pattern: /anuncio\s+de\s+(licitación|formalización|adjudicación)/i },
  { label: "EXPEDIENTE", pattern: /expediente\s*:/i },
  { label: "OBJETO", pattern: /objeto\s*:/i },
  { label: "ARREND_NO_RESID", pattern: /arrendamiento\s+de\s+(vehículos?|equipos?|licencias?|maquinaria|software)/i },
  { label: "IRPF", pattern: /\birpf\b/i },
  { label: "IVA", pattern: /\biva\b/i },
  { label: "IRENTA", pattern: /impuesto\s+sobre\s+la\s+renta/i },
  { label: "IVA_LARGO", pattern: /impuesto\s+sobre\s+(el\s+)?valor\s+añadido/i },
];

// ─── DGSJFP conditional: solo excluir si contiene turístico/corta duración ───
const DGSJFP_EXCLUDE_IF: RegExp[] = [
  /turístic[oa]/i,
  /corta\s+duración/i,
  /registro\s+único/i,
  /vacacional/i,
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateBOE(d: Date): string {
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

// Audit counters
interface AuditCounters {
  evaluated: number;
  excluded: number;
  no_match: number;
  matched: number;
  inserted: number;
  duplicates: number;
  errors: number;
  excludeReasons: Record<string, number>;
  includeReasons: Record<string, number>;
  insertedIds: string[];
}

function newAudit(): AuditCounters {
  return { evaluated: 0, excluded: 0, no_match: 0, matched: 0, inserted: 0, duplicates: 0, errors: 0, excludeReasons: {}, includeReasons: {}, insertedIds: [] };
}

function isExcludedId(id: string): boolean {
  return id.startsWith("BOE-B-");
}

function classify(text: string, id: string): { action: "INCLUDE" | "EXCLUDE" | "NO_MATCH"; reason: string } {
  // 1. Hard exclude
  for (const { label, pattern } of EXCLUDE_HARD) {
    if (pattern.test(text)) {
      return { action: "EXCLUDE", reason: label };
    }
  }

  // 2. DGSJFP conditional
  if (/dgsjfp/i.test(text)) {
    for (const pat of DGSJFP_EXCLUDE_IF) {
      if (pat.test(text)) {
        return { action: "EXCLUDE", reason: "DGSJFP_TURISTICO" };
      }
    }
    // If DGSJFP but not touristic, fall through to normal evaluation
  }

  // 3. Jurisprudencia constitucional
  if (isConstitucionalRelevant(text)) {
    return { action: "INCLUDE", reason: "JURISPRUD_CONSTITUCIONAL" };
  }

  // 4. Strong include
  for (const { label, pattern } of INCLUDE_STRONG) {
    if (pattern.test(text)) {
      return { action: "INCLUDE", reason: label };
    }
  }

  return { action: "NO_MATCH", reason: "NO_MATCH" };
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

async function fetchSummary(dateStr: string, audit: AuditCounters): Promise<FoundItem[]> {
  const url = `https://www.boe.es/datosabiertos/api/boe/sumario/${dateStr}`;
  const items: FoundItem[] = [];

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
    const statusCode = extractTag(xml, "code");
    if (statusCode && statusCode !== "200") {
      console.warn(`[BOE] ${dateStr}: XML status ${statusCode}`);
      return items;
    }

    const pubDateRaw = extractTag(xml, "fecha_publicacion") || dateStr;
    const formattedDate = pubDateRaw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");

    const secciones = extractAllBlocks(xml, "seccion");

    for (const secXml of secciones) {
      const secCode = extractAttr(secXml, "seccion", "codigo");
      const secName = extractAttr(secXml, "seccion", "nombre");
      const departamentos = extractAllBlocks(secXml, "departamento");

      for (const deptXml of departamentos) {
        const deptName = extractAttr(deptXml, "departamento", "nombre");
        const itemBlocks = extractAllBlocks(deptXml, "item");

        for (const itemXml of itemBlocks) {
          const id = extractTag(itemXml, "identificador");
          const titulo = extractTag(itemXml, "titulo");
          if (!id || !titulo) continue;

          audit.evaluated++;

          if (isExcludedId(id)) {
            audit.excluded++;
            audit.excludeReasons["BOE-B-PREFIX"] = (audit.excludeReasons["BOE-B-PREFIX"] || 0) + 1;
            continue;
          }

          const fullText = `${titulo} ${deptName} ${secName}`;
          const { action, reason } = classify(fullText, id);

          if (action === "EXCLUDE") {
            audit.excluded++;
            audit.excludeReasons[reason] = (audit.excludeReasons[reason] || 0) + 1;
            console.log(`[BOE] ✗ ${id} – EXCLUDED:${reason} – ${titulo.substring(0, 120)}`);
            continue;
          }

          if (action === "NO_MATCH") {
            audit.no_match++;
            if (secCode === "1" || secCode === "2" || secCode === "2A" || secCode === "2B") {
              console.log(`[BOE] ? ${id} [S${secCode}] – NO_MATCH – ${titulo.substring(0, 150)}`);
            }
            continue;
          }

          // INCLUDE
          audit.matched++;
          audit.includeReasons[reason] = (audit.includeReasons[reason] || 0) + 1;

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

          console.log(`[BOE] ✓ ${id} [S${secCode}] – ${reason} – ${titulo.substring(0, 120)}`);
        }
      }
    }
  } catch (err) {
    console.warn(`[BOE] Error sumario ${dateStr}:`, err);
    audit.errors++;
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

// ─── Audit logging ──────────────────────────────────────────────────────────

function logAuditSummary(audit: AuditCounters, fromDate: string, toDate: string, seenCount: number): void {
  console.log(`[MONITOR v2] Summary: evaluated=${audit.evaluated} excluded=${audit.excluded} no_match=${audit.no_match} matched=${audit.matched} inserted=${audit.inserted} duplicates=${audit.duplicates} errors=${audit.errors}`);

  const topExcl = Object.entries(audit.excludeReasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(", ");
  console.log(`[MONITOR v2] TopExclusions: ${topExcl || "none"}`);

  const topIncl = Object.entries(audit.includeReasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(", ");
  console.log(`[MONITOR v2] TopIncludes: ${topIncl || "none"}`);

  console.log(`[MONITOR v2] Inserted IDs: ${audit.insertedIds.length > 0 ? audit.insertedIds.join(", ") : "none"}`);
  console.log(`[MONITOR v2] Range: ${fromDate} → ${toDate}, seen: ${seenCount}`);
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
  const audit = newAudit();

  const result: any = {
    ok: false, from: "", to: "",
    evaluated: 0, excluded: 0, no_match: 0, matched: 0,
    inserted: 0, duplicates: 0, errors: 0,
    detalle_fuentes: { legislacion_consolidada: 0, boe_sumario: 0 },
  };

  try {
    const state = await loadState(supabase);
    const seenSet = new Set(state.seen_ids);

    const lastChecked = new Date(state.last_checked);
    const fromDate = new Date(lastChecked);
    fromDate.setDate(fromDate.getDate() - LOOKBACK_OVERLAP_DAYS);
    const toDate = new Date();

    const fromStr = formatDateBOE(fromDate);
    const toStr = formatDateBOE(toDate);
    result.from = fromStr;
    result.to = toStr;
    console.log(`[MONITOR v2] Range: ${fromStr} → ${toStr}, seen: ${seenSet.size}`);

    // Fetch summaries day by day
    const allItems: FoundItem[] = [];
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dayItems = await fetchSummary(formatDateBOE(current), audit);
      allItems.push(...dayItems);
      current.setDate(current.getDate() + 1);
    }
    result.detalle_fuentes.boe_sumario = allItems.length;

    // Deduplicate
    const newItems: FoundItem[] = [];
    for (const item of allItems) {
      const dedupeKey = item.identificador || `${item.fuente}|${item.fecha}|${item.titulo}`;
      if (!seenSet.has(dedupeKey)) {
        seenSet.add(dedupeKey);
        newItems.push(item);
      } else {
        audit.duplicates++;
      }
    }

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
        audit.errors++;
      } else {
        audit.inserted = newItems.length;
        audit.insertedIds = newItems.map(i => i.identificador);
      }

      await sendNotification(newItems, formatDateISO(fromDate), formatDateISO(toDate), resendKey);
    }

    // Save state
    state.last_checked = formatDateISO(toDate);
    state.seen_ids = Array.from(seenSet);
    await saveState(supabase, state);

    // Populate result
    result.evaluated = audit.evaluated;
    result.excluded = audit.excluded;
    result.no_match = audit.no_match;
    result.matched = audit.matched;
    result.inserted = audit.inserted;
    result.duplicates = audit.duplicates;
    result.errors = audit.errors;

    // Log
    await supabase.from("boe_monitoring_logs").insert({
      source, success: true,
      publications_found: audit.matched,
      new_publications: audit.inserted,
      error_message: audit.errors > 0 ? `${audit.errors} errors during run` : null,
    });

    logAuditSummary(audit, fromStr, toStr, seenSet.size);

    result.ok = true;
    console.log(`[MONITOR v2] Done ✓`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[MONITOR v2] Fatal:", err);
    audit.errors++;
    logAuditSummary(audit, result.from, result.to, 0);

    await supabase.from("boe_monitoring_logs").insert({
      source, success: false, publications_found: audit.matched,
      new_publications: audit.inserted, error_message: err.message || "Unknown error", retry_pending: true,
    });
    return new Response(JSON.stringify({ ...result, ok: false, errors: audit.errors }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

serve(handler);

// Verificador jurídico de los posts generados automáticamente.
import { BLOG_LEGAL_FACTS } from "./blog-prompt.ts";
import { GATEWAY_URL, MODELS } from "./models.ts";

export interface BlogVerifyIssue {
  quote: string;
  problem: string;
  severity: "grave" | "leve";
}

export interface BlogVerifyResult {
  ok: boolean;
  issues: BlogVerifyIssue[];
  error?: string;
}

const VERIFY_SYSTEM_PROMPT = `Eres un revisor jurídico especializado en derecho de arrendamientos urbanos en España (LAU, Código Civil, Ley 12/2023 por el derecho a la vivienda).

HECHOS DE REFERENCIA (verdaderos y actualizados):
${BLOG_LEGAL_FACTS}

TAREA
Revisa cada afirmación legal, cifra, porcentaje, plazo y artículo citado del post que recibes.

Marca severity "grave" si el fragmento:
- contradice los hechos de referencia;
- cita un artículo que no dice lo que el post afirma;
- da una cifra o un umbral que no está en los hechos de referencia y que no conoces con certeza;
- se contradice con otra parte del propio post;
- presenta como vigente una norma derogada o transitoria.

Marca severity "leve" los problemas de estilo o las imprecisiones menores.

En "quote" copia literalmente el fragmento del post (sin parafrasear). En "problem" explica en una o dos frases qué falla.
Si no encuentras ningún problema, devuelve una lista vacía.

SALIDA
Responde únicamente con un objeto JSON: {"issues":[{"quote":"...","problem":"...","severity":"grave"|"leve"}]}`;

export async function verifyBlogPost(input: {
  title: string;
  content: string;
  audience: "inquilino" | "propietario";
}): Promise<BlogVerifyResult> {
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return { ok: false, issues: [], error: "LOVABLE_API_KEY no configurada" };

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELS.GEMINI_PRO,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: VERIFY_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Audiencia del post: ${input.audience}.\n\nTÍTULO: ${input.title}\n\nCUERPO (HTML):\n${input.content}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, issues: [], error: `Verificador: HTTP ${res.status} - ${text.slice(0, 300)}` };
    }

    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    let parsed: any;
    try {
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      return { ok: false, issues: [], error: "Verificador: JSON ilegible" };
    }
    if (!parsed || !Array.isArray(parsed.issues)) {
      return { ok: false, issues: [], error: "Verificador: falta el campo issues" };
    }

    const issues: BlogVerifyIssue[] = parsed.issues
      .filter((i: any) => i && (i.quote || i.problem))
      .map((i: any) => ({
        quote: String(i.quote ?? ""),
        problem: String(i.problem ?? ""),
        severity: i.severity === "leve" ? "leve" : "grave",
      }));

    return { ok: !issues.some((i) => i.severity === "grave"), issues };
  } catch (e) {
    return { ok: false, issues: [], error: `Verificador: ${e instanceof Error ? e.message : String(e)}` };
  }
}

const SATURATED_RE = /irav|actualizaci[oó]n (anual )?de (la )?renta|subida del alquiler/i;

/** true si el título o el slug tratan un tema saturado. */
export function isSaturatedTopic(title: string, slug: string): boolean {
  return SATURATED_RE.test(title) || SATURATED_RE.test(slug.replace(/-/g, " "));
}

/** Usa la meta del modelo si mide 140-155; si no, el excerpt cortado en el último espacio antes de 155. */
export function pickMetaDescription(meta: unknown, excerpt: string): string {
  if (typeof meta === "string") {
    const m = meta.trim();
    if (m.length >= 140 && m.length <= 155) return m;
  }
  const e = (excerpt || "").trim();
  if (e.length <= 155) return e;
  const cut = e.slice(0, 155);
  const sp = cut.lastIndexOf(" ");
  return (sp > 0 ? cut.slice(0, sp) : cut).trim();
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Bloque HTML para el email al admin cuando el post queda en borrador. */
export function renderDraftNoticeHtml(v: BlogVerifyResult, adminUrl: string): string {
  const list = v.issues.length
    ? `<ul style="padding-left:18px;margin:8px 0;">${v.issues
        .map(
          (i) =>
            `<li style="margin-bottom:10px;"><strong>[${i.severity}]</strong> «${esc(i.quote)}»<br><span style="color:#555;">${esc(i.problem)}</span></li>`,
        )
        .join("")}</ul>`
    : "";
  const err = v.error ? `<p style="margin:8px 0;"><strong>Error:</strong> ${esc(v.error)}</p>` : "";
  return `<div style="background:#FEF3C7;border:1px solid #FCD34D;padding:16px 20px;border-radius:12px;margin-bottom:24px;color:#78350F;">
  <p style="margin:0 0 8px;font-weight:600;">El post se ha quedado en BORRADOR y no se ha enviado la newsletter.</p>
  ${err}${list}
  <p style="margin:8px 0 0;">Revísalo y publícalo desde <a href="${adminUrl}">${adminUrl}</a>.</p>
</div>`;
}

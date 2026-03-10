import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { authErrorResponse, authorizeRequest } from "../_shared/auth.ts";

const VALID_RELATION_TYPES = new Set([
  "deroga",
  "modifica",
  "complementa",
  "amplia",
  "prorroga",
  "desarrolla",
  "interpreta",
]);

const normType = (v: string) => (v ?? "").trim().toLowerCase();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

function normalizeText(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function territoryKey(doc: any): string | null {
  const code = String(doc?.territorial_code ?? "")
    .trim()
    .toUpperCase();

  if (/^ES-[A-Z]{2}$/.test(code)) return code;

  const entity = normalizeText(String(doc?.territorial_entity ?? ""));
  return entity || null;
}

async function callAI(messages: any[], model = "google/gemini-2.5-flash"): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0 }),
  });

  if (!response.ok) {
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonResponse(content: string): any {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonString);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let runId: string | null = null;
  let corpusHash = "";
  let docsCount = 0;
  let aiDetected = 0;
  let inserted = 0;
  let skippedDup = 0;
  let skippedInvalid = 0;
  let supersededChunks = 0;

  try {
    const body = await req.json().catch(() => ({}) as Record<string, unknown>);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = await authorizeRequest({
      req,
      supabaseUrl,
      supabaseServiceRoleKey: supabaseServiceKey,
      body,
      allowAdminUser: true,
      allowServiceRoleToken: true,
      allowInternalKey: true,
    });
    if (!auth.ok) {
      return authErrorResponse(auth, corsHeaders);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 0) Hash de corpus para idempotencia
    const { data: hashData, error: hashError } = await supabase.rpc("compute_legal_corpus_hash");
    if (hashError) throw new Error(`Error computing corpus hash: ${hashError.message}`);
    corpusHash = String(hashData ?? "");

    // 0.1) Si el corpus no cambió, salir en modo skipped
    const { data: prevRun, error: prevErr } = await supabase
      .from("reconciliation_runs")
      .select("id")
      .eq("mode", "full")
      .eq("status", "completed")
      .eq("corpus_hash", corpusHash)
      .limit(1)
      .maybeSingle();

    if (prevErr) throw new Error(`Error checking previous run: ${prevErr.message}`);

    if (prevRun) {
      await supabase.from("reconciliation_runs").insert({
        mode: "full",
        status: "skipped",
        corpus_hash: corpusHash,
        docs_count: 0,
        ai_relations_detected: 0,
        relations_inserted: 0,
        relations_skipped_duplicate: 0,
        relations_skipped_invalid: 0,
        finished_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "corpus unchanged",
          relations_inserted: 0,
          message: "Corpus sin cambios. Reconciliación omitida.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Cargar documentos activos + completed
    const { data: docsRaw, error: docError } = await supabase
      .from("legal_documents")
      .select(
        "id, title, type, jurisdiction, territorial_entity, territorial_code, ai_summary, keywords, superseded_by_id, supersedes_ids, effective_date",
      )
      .eq("is_active", true)
      .eq("processing_status", "completed");

    if (docError) throw new Error(`Error fetching documents: ${docError.message}`);

    const documents = (docsRaw || []) as any[];
    const sortedDocuments = [...documents].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    docsCount = sortedDocuments.length;

    if (docsCount < 2) {
      await supabase.from("reconciliation_runs").insert({
        mode: "full",
        status: "skipped",
        corpus_hash: corpusHash,
        docs_count: docsCount,
        ai_relations_detected: 0,
        relations_inserted: 0,
        relations_skipped_duplicate: 0,
        relations_skipped_invalid: 0,
        finished_at: new Date().toISOString(),
        error_message: "Se necesitan al menos 2 documentos para reconciliar",
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Se necesitan al menos 2 documentos para reconciliar relaciones",
          relations_found: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1.1) Crear run running
    const { data: runRow, error: runErr } = await supabase
      .from("reconciliation_runs")
      .insert({
        mode: "full",
        status: "running",
        corpus_hash: corpusHash,
      })
      .select("id")
      .single();

    if (runErr) throw new Error(`Error creating reconciliation run: ${runErr.message}`);
    runId = runRow.id;

    console.log(`Reconciling relations between ${sortedDocuments.length} documents`);

    // 2) Cargar relaciones existentes para dedupe
    const { data: existingRelations, error: existingErr } = await supabase
      .from("document_relations")
      .select("source_document_id, target_document_id, relation_type");

    if (existingErr) throw new Error(`Error fetching existing relations: ${existingErr.message}`);

    const existingRelationKeys = new Set(
      (existingRelations || []).map(
        (r: any) => `${r.source_document_id}::${r.target_document_id}::${normType(r.relation_type)}`,
      ),
    );

    // 3) Catálogo compacto ordenado
    const catalog = sortedDocuments.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      jurisdiction: d.jurisdiction,
      territorial_entity: d.territorial_entity || "no especificada",
      territorial_code: d.territorial_code || "N/A",
      effective_date: d.effective_date || "desconocida",
      summary: d.ai_summary?.substring(0, 300) || "",
      keywords: (d.keywords || []).slice(0, 10),
    }));

    // 4) Llamada IA global
    const prompt = `Eres un experto en derecho español. Analiza esta lista de documentos legales y detecta TODAS las relaciones entre ellos.

CATÁLOGO DE DOCUMENTOS:
${catalog.map((d) => `- [${d.id}] "${d.title}" (${d.type}, ${d.jurisdiction}, territorio: ${d.territorial_entity}, code: ${d.territorial_code}, fecha entrada en vigor: ${d.effective_date}) - ${d.summary}`).join("\n")}

Para cada relación detectada, indica:
{
  "source_id": "UUID del documento MÁS RECIENTE que actúa sobre otro anterior",
  "target_id": "UUID del documento MÁS ANTIGUO que es afectado",
  "type": "deroga|modifica|complementa|amplia|prorroga|desarrolla|interpreta",
  "affected_articles": ["Art. X"] (solo para modifica/deroga parcial, vacío si no aplica),
  "temporal_note": "Si el documento antiguo sigue siendo aplicable a ciertos contratos, indicar aquí",
  "description": "Breve descripción"
}

REGLAS CRÍTICAS:
- source debe ser igual o más reciente que target para deroga/modifica.
- Una norma autonómica SOLO puede derogar o modificar normas de su MISMA CCAA.
- Si hay duda entre deroga total y vigencia parcial por fecha, usar modifica.
- No inventes relaciones si no hay evidencia clara en título/resumen/keywords.

Responde SOLO con JSON: { "relations": [ ... ] }`;

    const aiContent = await callAI([
      {
        role: "system",
        content: "Detectas relaciones entre documentos legales españoles. Responde solo con JSON válido.",
      },
      { role: "user", content: prompt },
    ]);

    let detectedRelations: any[] = [];
    try {
      const parsed = parseJsonResponse(aiContent);
      detectedRelations = parsed.relations || [];
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      console.log("Raw AI response:", aiContent.substring(0, 500));
      detectedRelations = [];
    }

    aiDetected = detectedRelations.length;
    console.log(`AI detected ${detectedRelations.length} potential relations`);

    const normalizedRelations = (detectedRelations || [])
      .map((relation: any) => ({
        ...relation,
        type: normType(relation?.type),
      }))
      .sort((a: any, b: any) =>
        `${a?.source_id || ""}::${a?.target_id || ""}::${a?.type || ""}`.localeCompare(
          `${b?.source_id || ""}::${b?.target_id || ""}::${b?.type || ""}`,
        ),
      );

    // 5) Procesar relaciones
    const docMap = new Map(sortedDocuments.map((d: any) => [d.id, d]));
    const seenInThisRun = new Set<string>();
    const supersedesBySource = new Map<string, Set<string>>();
    const changedSupersedesSources = new Set<string>();

    for (const d of sortedDocuments) {
      supersedesBySource.set(d.id, new Set<string>(Array.isArray(d.supersedes_ids) ? d.supersedes_ids : []));
    }

    for (const relation of normalizedRelations) {
      if (!relation?.source_id || !relation?.target_id || !relation?.type) {
        skippedInvalid++;
        continue;
      }

      const relType = relation.type;
      if (!VALID_RELATION_TYPES.has(relType)) {
        skippedInvalid++;
        continue;
      }

      if (!docMap.has(relation.source_id) || !docMap.has(relation.target_id)) {
        skippedInvalid++;
        continue;
      }

      if (relation.source_id === relation.target_id) {
        skippedInvalid++;
        continue;
      }

      const sourceDoc = docMap.get(relation.source_id);
      const targetDoc = docMap.get(relation.target_id);

      // Validación territorial (hard)
      if (
        (relType === "deroga" || relType === "modifica") &&
        sourceDoc?.jurisdiction === "autonomica" &&
        targetDoc?.jurisdiction === "autonomica"
      ) {
        const sourceTerritory = territoryKey(sourceDoc);
        const targetTerritory = territoryKey(targetDoc);

        if (sourceTerritory && targetTerritory && sourceTerritory !== targetTerritory) {
          console.warn(
            `REJECTED TERRITORIAL: "${sourceDoc.title}" (${sourceTerritory}) cannot ${relType} "${targetDoc.title}" (${targetTerritory})`,
          );
          skippedInvalid++;
          continue;
        }
      }

      // Validación temporal (hard)
      if ((relType === "deroga" || relType === "modifica") && sourceDoc?.effective_date && targetDoc?.effective_date) {
        if (new Date(sourceDoc.effective_date) < new Date(targetDoc.effective_date)) {
          console.warn(
            `REJECTED TEMPORAL: "${sourceDoc.title}" (${sourceDoc.effective_date}) cannot ${relType} "${targetDoc.title}" (${targetDoc.effective_date})`,
          );
          skippedInvalid++;
          continue;
        }
      }

      const key = `${relation.source_id}::${relation.target_id}::${relType}`;
      if (seenInThisRun.has(key)) {
        skippedDup++;
        continue;
      }
      seenInThisRun.add(key);

      if (existingRelationKeys.has(key)) {
        skippedDup++;
        continue;
      }

      const affectedArticles = Array.from(
        new Set(
          (relation.affected_articles || [])
            .map((a: any) => String(a || "").trim())
            .filter((a: string) => a.length > 0),
        ),
      );

      const { error: insertError } = await supabase.from("document_relations").insert({
        source_document_id: relation.source_id,
        target_document_id: relation.target_id,
        relation_type: relType,
        affected_articles: affectedArticles,
        description: relation.temporal_note
          ? `${relation.description || ""}. Nota temporal: ${relation.temporal_note}`
          : relation.description || null,
        detected_by: "ai_reconcile",
        reconciliation_run_id: runId,
      });

      if (insertError) {
        if ((insertError as any).code === "23505") {
          skippedDup++;
          existingRelationKeys.add(key);
          continue;
        }

        console.error("Error inserting relation:", insertError);
        skippedInvalid++;
        continue;
      }

      inserted++;
      existingRelationKeys.add(key);

      console.log(`New relation: "${sourceDoc?.title}" --${relType}--> "${targetDoc?.title}"`);

      // Efectos
      if (relType === "deroga") {
        if (relation.temporal_note) {
          console.log(
            `Deroga with temporal applicability: "${targetDoc?.title}" stays active. Note: ${relation.temporal_note}`,
          );
        } else {
          const { data: oldChunks } = await supabase
            .from("legal_chunks")
            .select("id")
            .eq("document_id", relation.target_id)
            .or("is_superseded.is.null,is_superseded.eq.false");

          if (oldChunks && oldChunks.length > 0) {
            await supabase
              .from("legal_chunks")
              .update({ is_superseded: true, superseded_at: new Date().toISOString() })
              .in(
                "id",
                oldChunks.map((c: any) => c.id),
              );

            supersededChunks += oldChunks.length;

            await supabase
              .from("legal_documents")
              .update({ superseded_by_id: relation.source_id, is_active: false })
              .eq("id", relation.target_id);

            console.log(`Deroga: marked ${oldChunks.length} chunks as superseded`);
          }
        }
      } else if (relType === "modifica") {
        for (const articleRef of affectedArticles) {
          const { data: oldChunks } = await supabase
            .from("legal_chunks")
            .select("id")
            .eq("document_id", relation.target_id)
            .eq("article_reference", articleRef)
            .or("is_superseded.is.null,is_superseded.eq.false");

          if (oldChunks && oldChunks.length > 0) {
            await supabase
              .from("legal_chunks")
              .update({ is_superseded: true, superseded_at: new Date().toISOString() })
              .in(
                "id",
                oldChunks.map((c: any) => c.id),
              );

            supersededChunks += oldChunks.length;
            console.log(`Modifica: marked ${oldChunks.length} chunks of "${articleRef}" as superseded`);
          }
        }
        const sourceSet = supersedesBySource.get(relation.source_id) || new Set<string>();
        const previousSize = sourceSet.size;
        sourceSet.add(relation.target_id);
        supersedesBySource.set(relation.source_id, sourceSet);
        if (sourceSet.size !== previousSize) {
          changedSupersedesSources.add(relation.source_id);
        }
      }
    }

    for (const sourceId of changedSupersedesSources) {
      const ids = Array.from(supersedesBySource.get(sourceId) || []);
      await supabase.from("legal_documents").update({ supersedes_ids: ids }).eq("id", sourceId);
    }

    const { count: totalRelations } = await supabase
      .from("document_relations")
      .select("id", { count: "exact", head: true });

    if (runId) {
      await supabase
        .from("reconciliation_runs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          docs_count: docsCount,
          ai_relations_detected: aiDetected,
          relations_inserted: inserted,
          relations_skipped_duplicate: skippedDup,
          relations_skipped_invalid: skippedInvalid,
        })
        .eq("id", runId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        documents_analyzed: docsCount,
        new_relations_found: inserted,
        total_relations: totalRelations || 0,
        chunks_marked_superseded: supersededChunks,
        skipped_duplicates: skippedDup,
        skipped_invalid: skippedInvalid,
        message:
          inserted > 0
            ? `Se detectaron ${inserted} nuevas relaciones entre documentos. ${supersededChunks} chunks marcados como obsoletos.`
            : "No se encontraron nuevas relaciones. Todo está al día.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in reconcile-relations:", error);

    try {
      if (runId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from("reconciliation_runs")
          .update({
            status: "failed",
            finished_at: new Date().toISOString(),
            error_message: error instanceof Error ? error.message : String(error),
            docs_count: docsCount,
            ai_relations_detected: aiDetected,
            relations_inserted: inserted,
            relations_skipped_duplicate: skippedDup,
            relations_skipped_invalid: skippedInvalid,
          })
          .eq("id", runId);
      }
    } catch (runErr) {
      console.error("Error updating failed run:", runErr);
    }

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

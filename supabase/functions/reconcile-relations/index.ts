import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const VALID_RELATION_TYPES = [
  "deroga", "modifica", "complementa", "amplia", "prorroga", "desarrolla", "interpreta"
];

async function callAI(messages: any[], model = "google/gemini-2.5-flash"): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.1 }),
  });
  if (!response.ok) throw new Error(`AI call failed: ${response.status}`);
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all active documents with their chunks summary
    const { data: documents, error: docError } = await supabase
      .from("legal_documents")
      .select("id, title, type, jurisdiction, territorial_entity, ai_summary, keywords, superseded_by_id, supersedes_ids, effective_date")
      .eq("is_active", true)
      .eq("processing_status", "completed");

    if (docError) throw new Error(`Error fetching documents: ${docError.message}`);
    if (!documents || documents.length < 2) {
      return new Response(
        JSON.stringify({ success: true, message: "Se necesitan al menos 2 documentos para reconciliar relaciones", relations_found: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Reconciling relations between ${documents.length} documents`);

    // 2. Get existing relations to avoid re-analyzing known pairs
    const { data: existingRelations } = await supabase
      .from("document_relations")
      .select("source_document_id, target_document_id, relation_type");

    const existingRelationKeys = new Set(
      (existingRelations || []).map(r => `${r.source_document_id}::${r.target_document_id}::${r.relation_type}`)
    );

    // 3. Build a compact catalog of all documents for the AI (include effective_date + territorial info)
    const catalog = documents.map(d => ({
      id: d.id,
      title: d.title,
      type: d.type,
      jurisdiction: d.jurisdiction,
      territorial_entity: d.territorial_entity || "no especificada",
      effective_date: d.effective_date || "desconocida",
      summary: d.ai_summary?.substring(0, 300) || "",
      keywords: (d.keywords || []).slice(0, 10),
    }));

    // 4. Ask AI to detect relations between all documents in ONE call
    const prompt = `Eres un experto en derecho español. Analiza esta lista de documentos legales y detecta TODAS las relaciones entre ellos.

CATÁLOGO DE DOCUMENTOS:
${catalog.map(d => `- [${d.id}] "${d.title}" (${d.type}, ${d.jurisdiction}, territorio: ${d.territorial_entity}, fecha entrada en vigor: ${d.effective_date}) - ${d.summary}`).join("\n")}

Para cada relación detectada, indica:
{
  "source_id": "UUID del documento MÁS RECIENTE que actúa sobre otro anterior",
  "target_id": "UUID del documento MÁS ANTIGUO que es afectado",
  "type": "deroga|modifica|complementa|amplia|prorroga|desarrolla|interpreta",
  "affected_articles": ["Art. X"] (solo para modifica/deroga parcial, vacío si no aplica),
  "temporal_note": "Si el documento antiguo sigue siendo aplicable a ciertos contratos, indicar aquí (ej: 'vigente para contratos anteriores a 1995')",
  "description": "Breve descripción"
}

TIPOS:
- deroga: Reemplaza COMPLETAMENTE otro documento sin excepciones temporales. NO usar si el documento antiguo sigue vigente para ciertos contratos.
- modifica: Cambia artículos específicos de otro. Usar cuando una ley nueva modifica parcialmente una anterior.
- complementa: Añade información nueva sin invalidar
- amplia: Extiende el alcance de otro
- prorroga: Extiende la vigencia temporal
- desarrolla: Reglamento que desarrolla una ley
- interpreta: Jurisprudencia que interpreta

REGLAS CRÍTICAS DE DIRECCIÓN TEMPORAL:
- El source SIEMPRE es el documento MÁS RECIENTE (fecha posterior). El target es el documento MÁS ANTIGUO (fecha anterior).
- Una ley nueva NUNCA puede ser derogada por una ley más antigua. Si un decreto de 1964 es mencionado como "derogado por la Ley 29/1994", la relación es: source=Ley 29/1994 --modifica/deroga--> target=Decreto 1964. NUNCA al revés.
- Si un documento antiguo sigue vigente para contratos anteriores a cierta fecha, usa "modifica" en vez de "deroga", porque no es una derogación total.
- Ejemplo: La Ley 29/1994 derogó parcialmente el Decreto 4104/1964 (LAU 1964), pero este sigue vigente para contratos anteriores al 9 de mayo de 1985. Relación correcta: source=Ley 29/1994 --modifica--> target=Decreto 4104/1964, con temporal_note="El Decreto sigue vigente para contratos anteriores al 9/5/1985".
- La Ley 12/2023 (Ley de Vivienda) modifica la LAU (Ley 29/1994) y el RD-Ley 7/2019.
- Los decretos autonómicos que declaran zonas tensionadas desarrollan la Ley 12/2023.

REGLAS CRÍTICAS DE INCOMPATIBILIDAD TERRITORIAL:
- Una ley autonómica SOLO puede derogar o modificar leyes de la MISMA comunidad autónoma. NUNCA puede derogar o modificar leyes de OTRA comunidad autónoma.
- Ejemplo INCORRECTO: Ley 5/2025 de Andalucía --deroga--> Ley 13/1996 de Cataluña. Esto es IMPOSIBLE porque son comunidades autónomas distintas.
- Una ley estatal SÍ puede modificar o derogar leyes autonómicas o estatales.
- Leyes autonómicas de distintas CCAA que regulan la misma materia son "complementa" entre sí, NUNCA "deroga" ni "modifica".
- Usa el campo "territorio" de cada documento para verificar la compatibilidad territorial ANTES de asignar relaciones de tipo deroga o modifica.

Responde SOLO con JSON: { "relations": [ ... ] }`;

    const aiContent = await callAI([
      { role: "system", content: "Detectas relaciones entre documentos legales españoles. Responde solo con JSON válido." },
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

    console.log(`AI detected ${detectedRelations.length} potential relations`);

    // 5. Process each relation
    let newRelations = 0;
    let supersededChunks = 0;
    const docMap = new Map(documents.map(d => [d.id, d]));

    for (const relation of detectedRelations) {
      if (!relation.source_id || !relation.target_id || !relation.type) continue;
      const relType = relation.type.toLowerCase();
      if (!VALID_RELATION_TYPES.includes(relType)) continue;
      if (!docMap.has(relation.source_id) || !docMap.has(relation.target_id)) continue;

      // TERRITORIAL VALIDATION: autonomic laws from different CCAA cannot deroga/modifica each other
      const sourceDoc = docMap.get(relation.source_id);
      const targetDoc = docMap.get(relation.target_id);
      
      if ((relType === "deroga" || relType === "modifica") && 
          sourceDoc?.jurisdiction === "autonomica" && targetDoc?.jurisdiction === "autonomica" &&
          sourceDoc?.territorial_entity && targetDoc?.territorial_entity &&
          sourceDoc.territorial_entity !== targetDoc.territorial_entity) {
        console.warn(`REJECTED TERRITORIAL: "${sourceDoc.title}" (${sourceDoc.territorial_entity}) cannot ${relType} "${targetDoc.title}" (${targetDoc.territorial_entity}) - different autonomous communities. Skipping.`);
        continue;
      }

      // TEMPORAL VALIDATION: source must be newer than target for deroga/modifica
      if ((relType === "deroga" || relType === "modifica") && sourceDoc?.effective_date && targetDoc?.effective_date) {
        if (new Date(sourceDoc.effective_date) < new Date(targetDoc.effective_date)) {
          console.warn(`REJECTED TEMPORAL: "${sourceDoc.title}" (${sourceDoc.effective_date}) cannot ${relType} "${targetDoc.title}" (${targetDoc.effective_date}) - source is OLDER than target. Skipping.`);
          continue;
        }
      }

      // Skip if already exists
      const key = `${relation.source_id}::${relation.target_id}::${relType}`;
      if (existingRelationKeys.has(key)) {
        console.log(`Relation already exists: ${key}`);
        continue;
      }

      // Insert relation
      const { error: insertError } = await supabase.from("document_relations").insert({
        source_document_id: relation.source_id,
        target_document_id: relation.target_id,
        relation_type: relType,
        affected_articles: relation.affected_articles || [],
        description: relation.temporal_note
          ? `${relation.description || ''}. Nota temporal: ${relation.temporal_note}`
          : (relation.description || null),
        detected_by: "ai_reconcile",
      });

      if (insertError) {
        console.error(`Error inserting relation:`, insertError);
        continue;
      }

      newRelations++;
      existingRelationKeys.add(key);

      console.log(`New relation: "${sourceDoc?.title}" --${relType}--> "${targetDoc?.title}"`);

      // Apply effects based on type
      if (relType === "deroga") {
        // If there's a temporal_note, the old doc still applies to some contracts - DON'T deactivate
        if (relation.temporal_note) {
          console.log(`Deroga with temporal applicability: "${targetDoc?.title}" stays active. Note: ${relation.temporal_note}`);
          // Just record the relation, don't deactivate chunks or document
        } else {
          // Full supersede - only when truly fully derogated
          const { data: oldChunks } = await supabase
            .from("legal_chunks")
            .select("id")
            .eq("document_id", relation.target_id)
            .or("is_superseded.is.null,is_superseded.eq.false");

          if (oldChunks && oldChunks.length > 0) {
            await supabase
              .from("legal_chunks")
              .update({ is_superseded: true, superseded_at: new Date().toISOString() })
              .in("id", oldChunks.map((c: any) => c.id));
            supersededChunks += oldChunks.length;

            await supabase
              .from("legal_documents")
              .update({ superseded_by_id: relation.source_id, is_active: false })
              .eq("id", relation.target_id);

            console.log(`Deroga: marked ${oldChunks.length} chunks as superseded`);
          }
        }
      } else if (relType === "modifica") {
        // Partial supersede by article
        const affectedArticles = relation.affected_articles || [];
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
              .in("id", oldChunks.map((c: any) => c.id));
            supersededChunks += oldChunks.length;
            console.log(`Modifica: marked ${oldChunks.length} chunks of "${articleRef}" as superseded`);
          }
        }

        // Update supersedes_ids
        const sourceDoc = docMap.get(relation.source_id);
        const currentSupersedes = sourceDoc?.supersedes_ids || [];
        if (!currentSupersedes.includes(relation.target_id)) {
          await supabase
            .from("legal_documents")
            .update({ supersedes_ids: [...currentSupersedes, relation.target_id] })
            .eq("id", relation.source_id);
        }
      }
      // complementa, amplia, prorroga, desarrolla, interpreta: just the relation record
    }

    // 6. Get final stats
    const { count: totalRelations } = await supabase
      .from("document_relations")
      .select("id", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        success: true,
        documents_analyzed: documents.length,
        new_relations_found: newRelations,
        total_relations: totalRelations || 0,
        chunks_marked_superseded: supersededChunks,
        message: newRelations > 0
          ? `Se detectaron ${newRelations} nuevas relaciones entre documentos. ${supersededChunks} chunks marcados como obsoletos.`
          : "No se encontraron nuevas relaciones. Todo está al día.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in reconcile-relations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

// Convert ArrayBuffer to base64 without using spread/apply (avoids stack overflow)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return base64Encode(buffer);
}

// Normalize text for comparison (remove accents, lowercase)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// List of Spanish provinces for detection
const SPANISH_PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", 
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", 
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", 
  "Huesca", "Illes Balears", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", 
  "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", 
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", 
  "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];

// Semantic categories for legal content
const VALID_SEMANTIC_CATEGORIES = [
  "definicion",           // Define un concepto legal
  "obligacion",           // Establece una obligación
  "prohibicion",          // Prohíbe algo
  "limite_precio",        // Límites de renta/precio
  "plazo",                // Plazos y duraciones
  "sancion",              // Sanciones por incumplimiento
  "excepcion",            // Excepciones a reglas
  "procedimiento",        // Procedimientos a seguir
  "lista_entidades",      // Lista de municipios, zonas, etc.
  "requisito",            // Requisitos para algo
  "derecho",              // Derechos del inquilino/propietario
  "actualizacion",        // Reglas de actualización de renta
  "garantia",             // Fianzas y garantías
  "otro"                  // Otros
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let documentId: string | null = null;
  try {
    const body = await req.json();
    documentId = body.documentId;
    const filePath = body.filePath;

    if (!documentId || !filePath) {
      throw new Error("documentId and filePath are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Set processing status to 'processing'
    await supabase
      .from("legal_documents")
      .update({
        processing_status: "processing",
        processing_started_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", documentId);

    // Download the PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("legal-docs")
      .download(filePath);

    if (downloadError) {
      throw new Error(`Error downloading file: ${downloadError.message}`);
    }

    // Get document info
    const { data: docInfo, error: docError } = await supabase
      .from("legal_documents")
      .select("title, type, jurisdiction, territorial_entity")
      .eq("id", documentId)
      .single();

    if (docError) {
      throw new Error(`Error getting document info: ${docError.message}`);
    }

    // Convert PDF to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    // Build intelligent system prompt with semantic understanding
    const systemPrompt = `Eres un asistente legal experto en análisis de normativa española.
Tu tarea es procesar documentos legales y extraer información estructurada de forma inteligente.

## FASE 1 - ANÁLISIS GLOBAL DEL DOCUMENTO

Antes de extraer fragmentos, analiza el documento completo y extrae:

1. **RESUMEN** (ai_summary): 2-3 frases explicando qué regula este documento.

2. **PALABRAS CLAVE** (keywords): Lista de términos legales relevantes.
   Ejemplos: ["fianza", "zona tensionada", "renta máxima", "gran tenedor", "IPC", "duración mínima"]

3. **DOCUMENTOS DEROGADOS/MODIFICADOS** (supersedes):
   Si el documento menciona que DEROGA, MODIFICA, SUSTITUYE o DEJA SIN EFECTO normativa anterior,
   extrae los títulos/referencias de esa normativa.
   Ejemplos:
   - "Deja sin efecto la Resolución TER/2940/2023" → ["Resolución TER/2940/2023"]
   - "Modifica la Ley 29/1994" → ["Ley 29/1994"]
   - Si no menciona ninguna → []

4. **FECHA DE CADUCIDAD** (expiration_date):
   Si el documento tiene vigencia limitada o menciona "hasta el día X" → "YYYY-MM-DD"
   Si es vigencia indefinida → null

## FASE 2 - EXTRACCIÓN DE FRAGMENTOS

Para CADA fragmento relevante del documento, extrae:

{
  "content": "Texto del fragmento (máx 1500 caracteres)",
  "article_reference": "Artículo X" o null,
  "section_title": "Título de la sección" o null,
  
  // ===== CATEGORÍA SEMÁNTICA =====
  "semantic_category": "Tipo de información. Valores posibles:
    - definicion: Define un concepto legal
    - obligacion: Establece una obligación para alguna parte
    - prohibicion: Prohíbe algo expresamente
    - limite_precio: Límites de renta, actualización de precios
    - plazo: Plazos y duraciones legales
    - sancion: Sanciones por incumplimiento
    - excepcion: Excepciones a reglas generales
    - procedimiento: Procedimientos a seguir
    - lista_entidades: Lista de municipios, zonas tensionadas, etc.
    - requisito: Requisitos legales para algo
    - derecho: Derechos del inquilino o propietario
    - actualizacion: Reglas de actualización de renta
    - garantia: Fianzas y garantías adicionales
    - otro: No encaja en las anteriores",
  
  // ===== ENTIDADES CLAVE =====
  "key_entities": ["Lista de conceptos legales mencionados en este fragmento"],
  // Ejemplos: ["fianza", "renta", "gran tenedor", "zona tensionada", "IPC", "arrendador", "preaviso"]
  
  // ===== CONDICIONES DE APLICACIÓN =====
  "applies_when": {
    "tipo_inmueble": "vivienda habitual|local comercial|null",
    "zona": "tensionada|no tensionada|null",
    "tipo_arrendador": "gran tenedor|pequeño propietario|null",
    "duracion_contrato": "especificar si hay requisito de duración",
    "condicion_especial": "cualquier otra condición específica"
  },
  
  // ===== TERRITORIAL (como antes) =====
  "territorial_scope": "municipal|provincial|autonomica|estatal",
  "affected_municipalities": ["Lista de municipios si aplica"],
  "affected_provinces": ["Lista de provincias si aplica"]
}

## INSTRUCCIONES CRÍTICAS

1. **LISTAS DE MUNICIPIOS**: Si el documento lista municipios (ej: zonas tensionadas), 
   extrae TODOS los nombres en "affected_municipalities". Esto es CRÍTICO.

2. **CATEGORÍA SEMÁNTICA**: Elige la categoría que mejor describa el contenido.
   Un fragmento sobre "la renta no podrá superar X" es "limite_precio".
   Un fragmento que lista municipios es "lista_entidades".

3. **ENTIDADES CLAVE**: Extrae los conceptos legales mencionados. 
   Si habla de fianza, IPC y renta, key_entities = ["fianza", "IPC", "renta"].

4. **APPLIES_WHEN**: Si el fragmento dice "en caso de gran tenedor...", 
   pon tipo_arrendador: "gran tenedor".

5. **DEROGACIONES**: Es MUY IMPORTANTE detectar si este documento deja sin efecto otros.
   Busca expresiones como: "deroga", "modifica", "sustituye", "deja sin efecto", 
   "queda anulado", "pierde vigencia".

## FORMATO DE RESPUESTA

Responde SOLO con un JSON válido:
{
  "document_analysis": {
    "ai_summary": "Resumen del documento...",
    "keywords": ["palabra1", "palabra2"],
    "supersedes": ["Documento derogado 1", "Documento derogado 2"] o [],
    "expiration_date": "YYYY-MM-DD" o null
  },
  "chunks": [
    { chunk1 },
    { chunk2 },
    ...
  ]
}

Máximo 50 fragmentos. Prioriza los más relevantes para análisis de contratos de alquiler.
Información del documento: Título="${docInfo.title}", Tipo="${docInfo.type}", Jurisdicción="${docInfo.jurisdiction}", Entidad territorial="${docInfo.territorial_entity || 'No especificada'}"`;

    // Use AI to extract and structure the text
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Procesa este documento legal: "${docInfo.title}". 
                
IMPORTANTE:
1. Primero analiza el documento completo (resumen, palabras clave, derogaciones).
2. Luego extrae los fragmentos con su categoría semántica y entidades clave.
3. Si hay listas de municipios, extrae TODOS los nombres.
4. Detecta si este documento deroga o modifica otros anteriores.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      // If multimodal fails, create a placeholder chunk
      console.log("Multimodal processing failed, using fallback...");

      const { error: insertError } = await supabase.from("legal_chunks").insert({
        document_id: documentId,
        content: `Documento: ${docInfo.title}. Este documento ha sido subido y está pendiente de procesamiento manual.`,
        article_reference: null,
        section_title: docInfo.title,
        chunk_index: 0,
        territorial_scope: docInfo.jurisdiction === 'estatal' ? 'estatal' : 'autonomica',
        affected_municipalities: [],
        affected_provinces: [],
        semantic_category: 'otro',
        key_entities: [],
        applies_when: {},
      });

      if (insertError) {
        throw new Error(`Error inserting chunk: ${insertError.message}`);
      }

      // Mark as completed even with fallback
      await supabase
        .from("legal_documents")
        .update({
          processing_status: "completed",
          processing_completed_at: new Date().toISOString(),
          processing_error: "Procesamiento con IA falló. Se creó un fragmento placeholder.",
        })
        .eq("id", documentId);

      return new Response(
        JSON.stringify({
          success: true,
          chunks_created: 1,
          message: "Documento registrado. Procesamiento completo pendiente.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error("No content returned from AI");
    }

    // Parse the complete response
    let parsedResponse;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : aiContent.trim();
      parsedResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Error parsing response from AI");
    }

    // Extract document analysis and chunks
    const documentAnalysis = parsedResponse.document_analysis || {};
    const chunks = parsedResponse.chunks || parsedResponse; // Fallback if old format

    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("No valid chunks extracted from document");
    }

    // Update document with analysis metadata
    const updateData: any = {};
    
    if (documentAnalysis.ai_summary) {
      updateData.ai_summary = documentAnalysis.ai_summary;
    }
    
    if (documentAnalysis.keywords && Array.isArray(documentAnalysis.keywords)) {
      updateData.keywords = documentAnalysis.keywords;
    }
    
    if (documentAnalysis.expiration_date) {
      updateData.expiration_date = documentAnalysis.expiration_date;
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("legal_documents")
        .update(updateData)
        .eq("id", documentId);

      if (updateError) {
        console.error("Error updating document metadata:", updateError);
      }
    }

    // Handle superseded chunks (obsolescencia a nivel de artículo, NO documento completo)
    // Esto permite que una ley modifique solo artículos específicos sin desactivar todo el documento anterior
    const supersededDocs = documentAnalysis.supersedes || [];
    let supersededChunksCount = 0;

    // Extraer las referencias de artículos del nuevo documento
    const newArticleRefs = chunks
      .filter((c: any) => c.article_reference)
      .map((c: any) => ({
        ref: c.article_reference as string,
        content: c.content as string,
      }));

    if (supersededDocs.length > 0 && newArticleRefs.length > 0) {
      console.log(`Document mentions superseding: ${supersededDocs.join(', ')}`);
      console.log(`New document has ${newArticleRefs.length} article references`);
      
      // Buscar documentos que coinciden con los títulos derogados
      for (const supersededTitle of supersededDocs) {
        const { data: matchingDocs, error: searchError } = await supabase
          .from("legal_documents")
          .select("id, title")
          .neq("id", documentId)
          .eq("is_active", true)
          .ilike("title", `%${supersededTitle.substring(0, 30)}%`);

        if (!searchError && matchingDocs && matchingDocs.length > 0) {
          for (const matchedDoc of matchingDocs) {
            // En vez de marcar el documento completo como obsoleto,
            // buscar los chunks con article_reference coincidente
            for (const newArticle of newArticleRefs) {
              // Buscar chunks del documento antiguo que tengan el mismo artículo
              const { data: oldChunks, error: chunkSearchError } = await supabase
                .from("legal_chunks")
                .select("id")
                .eq("document_id", matchedDoc.id)
                .eq("article_reference", newArticle.ref)
                .or("is_superseded.is.null,is_superseded.eq.false");

              if (!chunkSearchError && oldChunks && oldChunks.length > 0) {
                // Marcar los chunks antiguos como obsoletos
                const { error: markChunkError } = await supabase
                  .from("legal_chunks")
                  .update({
                    is_superseded: true,
                    superseded_at: new Date().toISOString(),
                  })
                  .in("id", oldChunks.map(c => c.id));

                if (!markChunkError) {
                  supersededChunksCount += oldChunks.length;
                  console.log(`Marked ${oldChunks.length} chunks of article "${newArticle.ref}" from "${matchedDoc.title}" as superseded`);
                }
              }
            }
          }
        }
      }

      // Guardar referencia a qué documentos afecta (sin desactivarlos)
      if (supersededDocs.length > 0) {
        const { data: affectedDocs } = await supabase
          .from("legal_documents")
          .select("id")
          .or(supersededDocs.map((t: string) => `title.ilike.%${t.substring(0, 30)}%`).join(','));

        if (affectedDocs && affectedDocs.length > 0) {
          await supabase
            .from("legal_documents")
            .update({ supersedes_ids: affectedDocs.map(d => d.id) })
            .eq("id", documentId);
        }
      }
    }

    // Process and validate each chunk
    const chunksToInsert = chunks.map((chunk: any, index: number) => {
      // Normalize municipality names
      const normalizedMunicipalities = (chunk.affected_municipalities || [])
        .map((m: string) => {
          if (typeof m !== 'string') return null;
          return m.trim()
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        })
        .filter((m: string | null) => m !== null && m.length > 1);

      // Normalize province names
      const normalizedProvinces = (chunk.affected_provinces || [])
        .map((p: string) => {
          if (typeof p !== 'string') return null;
          const normalized = p.trim()
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          const isValid = SPANISH_PROVINCES.some(
            prov => normalizeText(prov) === normalizeText(normalized)
          );
          return isValid ? normalized : null;
        })
        .filter((p: string | null) => p !== null);

      // Validate territorial_scope
      const validScopes = ['estatal', 'autonomica', 'provincial', 'municipal'];
      const scope = validScopes.includes(chunk.territorial_scope) 
        ? chunk.territorial_scope 
        : (normalizedMunicipalities.length > 0 ? 'municipal' : 
           normalizedProvinces.length > 0 ? 'provincial' : 
           docInfo.jurisdiction === 'estatal' ? 'estatal' : 'autonomica');

      // Validate semantic category
      const semanticCategory = VALID_SEMANTIC_CATEGORIES.includes(chunk.semantic_category)
        ? chunk.semantic_category
        : 'otro';

      // Normalize key entities
      const keyEntities = (chunk.key_entities || [])
        .filter((e: any) => typeof e === 'string' && e.length > 0)
        .map((e: string) => e.toLowerCase().trim());

      // Validate applies_when
      const appliesWhen = typeof chunk.applies_when === 'object' && chunk.applies_when !== null
        ? chunk.applies_when
        : {};

      return {
        document_id: documentId,
        content: chunk.content,
        article_reference: chunk.article_reference || null,
        section_title: chunk.section_title || null,
        chunk_index: index,
        territorial_scope: scope,
        affected_municipalities: normalizedMunicipalities,
        affected_provinces: normalizedProvinces,
        semantic_category: semanticCategory,
        key_entities: keyEntities,
        applies_when: appliesWhen,
      };
    });

    const { error: insertError } = await supabase.from("legal_chunks").insert(chunksToInsert);

    if (insertError) {
      throw new Error(`Error inserting chunks: ${insertError.message}`);
    }

    // Count statistics
    const totalMunicipalities = chunksToInsert.reduce(
      (acc: number, chunk: any) => acc + (chunk.affected_municipalities?.length || 0), 
      0
    );
    const totalProvinces = chunksToInsert.reduce(
      (acc: number, chunk: any) => acc + (chunk.affected_provinces?.length || 0), 
      0
    );

    // Count semantic categories
    const categoryCounts: Record<string, number> = {};
    chunksToInsert.forEach((chunk: any) => {
      const cat = chunk.semantic_category || 'otro';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    // Count unique key entities
    const allEntities = new Set<string>();
    chunksToInsert.forEach((chunk: any) => {
      (chunk.key_entities || []).forEach((e: string) => allEntities.add(e));
    });

    // Mark processing as completed
    await supabase
      .from("legal_documents")
      .update({
        processing_status: "completed",
        processing_completed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({
        success: true,
        chunks_created: chunks.length,
        municipalities_extracted: totalMunicipalities,
        provinces_extracted: totalProvinces,
        semantic_categories: categoryCounts,
        key_entities_count: allEntities.size,
        superseded_chunks: supersededChunksCount,
        document_summary: documentAnalysis.ai_summary || null,
        document_keywords: documentAnalysis.keywords || [],
        message: `Documento procesado inteligentemente: ${chunks.length} fragmentos indexados. ` +
          `${totalMunicipalities} municipios, ${totalProvinces} provincias, ` +
          `${allEntities.size} entidades clave. ` +
          (supersededChunksCount > 0 ? `${supersededChunksCount} artículo(s) marcado(s) como obsoleto(s).` : ''),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing document:", error);

    // Try to mark document as error in DB
    if (documentId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const errorClient = createClient(supabaseUrl, supabaseServiceKey);
        await errorClient
          .from("legal_documents")
          .update({
            processing_status: "error",
            processing_error: error instanceof Error ? error.message : "Error desconocido",
            processing_completed_at: new Date().toISOString(),
          })
          .eq("id", documentId);
      } catch (updateError) {
        console.error("Failed to update error status:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

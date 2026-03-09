import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { authErrorResponse, authorizeRequest } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return base64Encode(buffer);
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const SPANISH_PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva",
  "Huesca", "Illes Balears", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León",
  "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia",
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
  "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];

const VALID_SEMANTIC_CATEGORIES = [
  "definicion", "obligacion", "prohibicion", "limite_precio", "plazo",
  "sancion", "excepcion", "procedimiento", "lista_entidades", "requisito",
  "derecho", "actualizacion", "garantia", "otro"
];

const VALID_RELATION_TYPES = [
  "deroga", "modifica", "complementa", "amplia", "prorroga", "desarrolla", "interpreta"
];

// ============ TEXT EXTRACTION HELPERS ============

async function extractTextFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
  });
  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
  const html = await response.text();

  // BOE-specific: extract the main legal text container
  let text = html;
  
  // Try BOE-specific extraction using start/end markers (greedy, captures full content)
  const boeStartIdx = text.indexOf('id="textoxslt"');
  let boeExtracted = false;
  
  if (boeStartIdx !== -1) {
    // Find the opening tag start
    let tagStart = text.lastIndexOf('<div', boeStartIdx);
    if (tagStart !== -1) {
      // Find the content after the opening tag
      const afterTag = text.indexOf('>', boeStartIdx);
      if (afterTag !== -1) {
        // Find closing: look for the pattern where the textoxslt div ends
        // We count nested divs to find the correct closing tag
        let depth = 1;
        let pos = afterTag + 1;
        while (pos < text.length && depth > 0) {
          const nextOpen = text.indexOf('<div', pos);
          const nextClose = text.indexOf('</div>', pos);
          if (nextClose === -1) break;
          if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            pos = nextOpen + 4;
          } else {
            depth--;
            if (depth === 0) {
              text = text.substring(afterTag + 1, nextClose);
              boeExtracted = true;
              console.log(`BOE content container found, extracted ${text.length} chars`);
            }
            pos = nextClose + 6;
          }
        }
      }
    }
  }
  
  if (!boeExtracted) {
    // Generic: remove noise
    text = text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");

    // Extract text from article/main if available
    const articleMatch = text.match(/<article[\s\S]*?<\/article>/i) ||
                         text.match(/<main[\s\S]*?<\/main>/i);
    if (articleMatch) text = articleMatch[0];
  }

  // Remove all HTML tags, decode entities
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&ordm;/gi, "º")
    .replace(/&ordf;/gi, "ª")
    .replace(/&laquo;/gi, "«")
    .replace(/&raquo;/gi, "»")
    .replace(/&#\d+;/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text;
}

async function extractTextFromEpub(arrayBuffer: ArrayBuffer): Promise<string> {
  // EPUB is a ZIP. We use a simple approach: find HTML/XHTML files inside
  const bytes = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder();
  const allText: string[] = [];

  // Simple ZIP parsing - find local file headers (PK\x03\x04)
  let offset = 0;
  while (offset < bytes.length - 4) {
    if (bytes[offset] === 0x50 && bytes[offset + 1] === 0x4B &&
        bytes[offset + 2] === 0x03 && bytes[offset + 3] === 0x04) {
      // Local file header
      const fnameLen = bytes[offset + 26] | (bytes[offset + 27] << 8);
      const extraLen = bytes[offset + 28] | (bytes[offset + 29] << 8);
      const compSize = bytes[offset + 18] | (bytes[offset + 19] << 8) |
                       (bytes[offset + 20] << 16) | (bytes[offset + 21] << 24);
      const uncompSize = bytes[offset + 22] | (bytes[offset + 23] << 8) |
                         (bytes[offset + 24] << 16) | (bytes[offset + 25] << 24);
      const compressionMethod = bytes[offset + 8] | (bytes[offset + 9] << 8);

      const fnameStart = offset + 30;
      const fname = decoder.decode(bytes.slice(fnameStart, fnameStart + fnameLen));
      const dataStart = fnameStart + fnameLen + extraLen;

      if ((fname.endsWith(".html") || fname.endsWith(".xhtml") || fname.endsWith(".htm")) &&
          !fname.includes("toc") && !fname.includes("nav")) {
        if (compressionMethod === 0 && uncompSize > 0) {
          // Stored (not compressed)
          const content = decoder.decode(bytes.slice(dataStart, dataStart + uncompSize));
          const text = content
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/\s+/g, " ")
            .trim();
          if (text.length > 50) allText.push(text);
        }
      }
      offset = dataStart + (compSize > 0 ? compSize : uncompSize);
    } else {
      offset++;
    }
  }

  if (allText.length === 0) {
    throw new Error("No se pudo extraer texto del EPUB. El archivo puede estar comprimido con DEFLATE.");
  }

  return allText.join("\n\n");
}

// ============ TEXT SPLITTING ============

function splitTextIntoBlocks(text: string, maxChars: number = 80000): string[] {
  if (text.length <= maxChars) return [text];

  const blocks: string[] = [];
  const lines = text.split("\n");
  let currentBlock = "";

  for (const line of lines) {
    // Try to split at major section boundaries (TÍTULO, LIBRO, CAPÍTULO)
    const isMajorBoundary = /^(TÍTULO|LIBRO|CAPÍTULO|Disposición|DISPOSICIÓN)/i.test(line.trim());
    const isArticleBoundary = /^(Art[íi]culo\s+\d|Sección)/i.test(line.trim());

    if (isMajorBoundary && currentBlock.length > maxChars * 0.3) {
      blocks.push(currentBlock.trim());
      currentBlock = line + "\n";
    } else if (isArticleBoundary && currentBlock.length > maxChars * 0.7) {
      blocks.push(currentBlock.trim());
      currentBlock = line + "\n";
    } else if (currentBlock.length + line.length > maxChars) {
      blocks.push(currentBlock.trim());
      currentBlock = line + "\n";
    } else {
      currentBlock += line + "\n";
    }
  }

  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }

  return blocks;
}

// ============ AI CALL HELPER ============

async function callAI(messages: any[], model: string = "google/gemini-2.5-pro"): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature: 0.1 }),
  });

  if (!response.ok) {
    // Fallback to flash if pro fails
    if (model === "google/gemini-2.5-pro") {
      console.log("Pro model failed, falling back to flash...");
      return callAI(messages, "google/gemini-2.5-flash");
    }
    throw new Error(`AI call failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJsonResponse(content: string): any {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonString);
}

// ============ CHUNK PROCESSING PROMPT ============

function buildChunkExtractionPrompt(docTitle: string, docType: string, docJurisdiction: string, docEntity: string): string {
  return `Eres un asistente legal experto en normativa española especializado en derecho inmobiliario y arrendamientos.

CONTEXTO: Estás procesando el documento "${docTitle}" (Tipo="${docType}", Jurisdicción="${docJurisdiction}", Entidad="${docEntity || 'No especificada'}").
Este documento se usa en un sistema RAG para analizar contratos de alquiler de vivienda.

CRITERIO DE EXTRACCIÓN:
- Extrae fragmentos que puedan ser ÚTILES para un análisis legal de contratos de alquiler. Esto incluye normativa directa (LAU, fianzas, plazos) Y normativa INDIRECTA aplicable: procedimientos judiciales (desahucios, reclamaciones, ejecuciones), plazos procesales, competencia territorial, costas, medidas cautelares sobre inmuebles, embargos de rentas, juicio verbal, monitorio, obligaciones contractuales, resolución de contratos, etc.
- Para leyes procesales (LEC, etc.): extrae los procedimientos aplicables a conflictos arrendaticios y de vivienda.
- Si un bloque NO tiene NADA remotamente aplicable, responde con {"chunks": []}

Para CADA fragmento relevante, extrae:
{
  "content": "Texto literal del fragmento (máx 2000 caracteres)",
  "article_reference": "Artículo X" o null,
  "section_title": "Título de la sección" o null,
  "semantic_category": uno de: definicion, obligacion, prohibicion, limite_precio, plazo, sancion, excepcion, procedimiento, lista_entidades, requisito, derecho, actualizacion, garantia, otro,
  "key_entities": ["concepto1", "concepto2"],
  "applies_when": {
    "tipo_inmueble": "vivienda habitual|local comercial|null",
    "zona": "tensionada|no tensionada|null",
    "tipo_arrendador": "gran tenedor|pequeño propietario|null",
    "duracion_contrato": "especificar si hay requisito",
    "condicion_especial": "otra condición"
  },
  "territorial_scope": "municipal|provincial|autonomica|estatal",
  "affected_municipalities": ["municipio1"],
  "affected_provinces": ["provincia1"]
}

INSTRUCCIONES:
- Si hay listas de municipios, extrae TODOS los nombres.
- Máximo 50 fragmentos por bloque.
- Si el bloque no tiene contenido relevante para alquiler/vivienda, devuelve {"chunks": []}

Responde SOLO con JSON válido: { "chunks": [ ... ] }`;}


function buildAnalysisPrompt(docTitle: string, allChunksSummary: string, effectiveDate?: string | null): string {
  return `Eres un asistente legal experto en normativa española.
Analiza globalmente el documento "${docTitle}" (fecha de entrada en vigor: ${effectiveDate || 'desconocida'}) basándote en los fragmentos extraídos.

Fragmentos del documento:
${allChunksSummary}

Genera un análisis global con:

1. **ai_summary**: 2-3 frases explicando qué regula. Si el documento ha sido parcialmente derogado o modificado por leyes posteriores, menciónalo indicando para qué contratos sigue vigente.
2. **keywords**: Términos legales relevantes.
3. **relations**: Array de relaciones CON OTROS documentos legales que ESTE DOCUMENTO modifique, derogue, complemente, etc. Para CADA uno:
   {
     "type": "deroga|modifica|complementa|amplia|prorroga|desarrolla|interpreta",
     "target_title": "Nombre exacto del documento afectado (ej: Ley 29/1994)",
     "affected_articles": ["Art. X", "Art. Y"] (solo para modifica/deroga parcial),
     "temporal_note": "Si el documento antiguo sigue vigente para ciertos contratos, indicar aquí",
     "description": "Breve descripción de la relación"
   }
   
   Tipos:
   - deroga: Reemplaza COMPLETAMENTE otro documento sin excepciones temporales
   - modifica: Cambia artículos específicos de otro. Usar también cuando la derogación es parcial (el documento antiguo sigue vigente para ciertos contratos)
   - complementa: Añade información nueva sin invalidar
   - amplia: Extiende el alcance de otro
   - prorroga: Extiende la vigencia temporal de otro
   - desarrolla: Reglamento que desarrolla una ley
   - interpreta: Jurisprudencia que interpreta

   REGLAS CRÍTICAS DE DIRECCIÓN:
   - Este documento ("${docTitle}") es SIEMPRE el source. Solo incluye relaciones donde ESTE documento actúe sobre otros MÁS ANTIGUOS.
   - Si este documento es más antiguo que otro y fue derogado por él, NO incluyas esa relación aquí.
   - Si este documento sigue siendo aplicable a contratos antiguos aunque haya sido parcialmente derogado, NO te relaciones a ti mismo como derogado.

4. **expiration_date**: "YYYY-MM-DD" si tiene vigencia limitada, o null.

IMPORTANTE: Busca expresiones como "deroga", "modifica", "sustituye", "deja sin efecto", "complementa", "en desarrollo de", "prorroga", "amplía".

Responde SOLO con JSON válido:
{
  "document_analysis": {
    "ai_summary": "...",
    "keywords": [],
    "relations": [],
    "expiration_date": null
  }
}`;
}

// ============ CHUNK VALIDATION ============

function validateAndNormalizeChunk(chunk: any, index: number, documentId: string, docJurisdiction: string) {
  const normalizedMunicipalities = (chunk.affected_municipalities || [])
    .map((m: string) => {
      if (typeof m !== 'string') return null;
      return m.trim().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    })
    .filter((m: string | null) => m !== null && m.length > 1);

  const normalizedProvinces = (chunk.affected_provinces || [])
    .map((p: string) => {
      if (typeof p !== 'string') return null;
      const normalized = p.trim().split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      return SPANISH_PROVINCES.some(prov => normalizeText(prov) === normalizeText(normalized)) ? normalized : null;
    })
    .filter((p: string | null) => p !== null);

  const validScopes = ['estatal', 'autonomica', 'provincial', 'municipal'];
  const scope = validScopes.includes(chunk.territorial_scope)
    ? chunk.territorial_scope
    : (normalizedMunicipalities.length > 0 ? 'municipal' :
       normalizedProvinces.length > 0 ? 'provincial' :
       docJurisdiction === 'estatal' ? 'estatal' : 'autonomica');

  const semanticCategory = VALID_SEMANTIC_CATEGORIES.includes(chunk.semantic_category) ? chunk.semantic_category : 'otro';

  const keyEntities = (chunk.key_entities || [])
    .filter((e: any) => typeof e === 'string' && e.length > 0)
    .map((e: string) => e.toLowerCase().trim());

  const appliesWhen = typeof chunk.applies_when === 'object' && chunk.applies_when !== null ? chunk.applies_when : {};

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
}

// ============ RELATION PROCESSING ============

async function processRelations(
  supabase: any,
  documentId: string,
  relations: any[],
  allChunks: any[]
) {
  let supersededChunksCount = 0;
  const newArticleRefs = allChunks
    .filter((c: any) => c.article_reference)
    .map((c: any) => c.article_reference as string);

  for (const relation of relations) {
    if (!relation.type || !relation.target_title) continue;
    const relType = relation.type.toLowerCase();
    if (!VALID_RELATION_TYPES.includes(relType)) continue;

    // Find matching target document
    const searchTerm = relation.target_title.substring(0, 40);
    const { data: matchingDocs } = await supabase
      .from("legal_documents")
      .select("id, title")
      .neq("id", documentId)
      .ilike("title", `%${searchTerm}%`);

    if (!matchingDocs || matchingDocs.length === 0) {
      console.log(`No matching document found for relation: ${relation.target_title}`);
      continue;
    }

    const targetDoc = matchingDocs[0];

    // Insert relation record (include temporal_note in description)
    await supabase.from("document_relations").upsert({
      source_document_id: documentId,
      target_document_id: targetDoc.id,
      relation_type: relType,
      affected_articles: relation.affected_articles || [],
      description: relation.temporal_note
        ? `${relation.description || ''}. Nota temporal: ${relation.temporal_note}`
        : (relation.description || null),
      detected_by: 'ai',
    }, { onConflict: 'source_document_id,target_document_id,relation_type' });

    // Process effects based on relation type
    if (relType === "deroga") {
      // If there's a temporal_note, the old doc still applies to some contracts - DON'T deactivate
      if (relation.temporal_note) {
        console.log(`Deroga with temporal applicability: "${targetDoc.title}" stays active. Note: ${relation.temporal_note}`);
      } else {
        // Full supersede - mark all chunks as superseded
        const { data: oldChunks } = await supabase
          .from("legal_chunks")
          .select("id")
          .eq("document_id", targetDoc.id)
          .or("is_superseded.is.null,is_superseded.eq.false");

        if (oldChunks && oldChunks.length > 0) {
          await supabase
            .from("legal_chunks")
            .update({ is_superseded: true, superseded_at: new Date().toISOString() })
            .in("id", oldChunks.map((c: any) => c.id));
          supersededChunksCount += oldChunks.length;

          // Mark document as superseded
          await supabase
            .from("legal_documents")
            .update({ superseded_by_id: documentId, is_active: false })
            .eq("id", targetDoc.id);

          console.log(`Deroga: marked ${oldChunks.length} chunks and document "${targetDoc.title}" as superseded`);
        }
      }
    } else if (relType === "modifica") {
      // Partial supersede - only matching articles
      const affectedArticles = relation.affected_articles || [];
      // Also use article refs from new chunks
      const articlesToCheck = affectedArticles.length > 0 ? affectedArticles : newArticleRefs;

      for (const articleRef of articlesToCheck) {
        const { data: oldChunks } = await supabase
          .from("legal_chunks")
          .select("id")
          .eq("document_id", targetDoc.id)
          .eq("article_reference", articleRef)
          .or("is_superseded.is.null,is_superseded.eq.false");

        if (oldChunks && oldChunks.length > 0) {
          await supabase
            .from("legal_chunks")
            .update({ is_superseded: true, superseded_at: new Date().toISOString() })
            .in("id", oldChunks.map((c: any) => c.id));
          supersededChunksCount += oldChunks.length;
          console.log(`Modifica: marked ${oldChunks.length} chunks of "${articleRef}" from "${targetDoc.title}" as superseded`);
        }
      }

      // Save supersedes_ids reference
      await supabase
        .from("legal_documents")
        .update({ supersedes_ids: [targetDoc.id] })
        .eq("id", documentId);
    } else if (relType === "prorroga") {
      // Update expiration date
      if (relation.new_expiration_date) {
        await supabase
          .from("legal_documents")
          .update({ expiration_date: relation.new_expiration_date })
          .eq("id", targetDoc.id);
      }
      console.log(`Prorroga: extended expiration for "${targetDoc.title}"`);
    }
    // complementa, amplia, desarrolla, interpreta: just the relation record is enough
    console.log(`Relation created: ${documentId} --${relType}--> ${targetDoc.title}`);
  }

  return supersededChunksCount;
}

// ============ MAIN HANDLER ============

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FUNCTION_START_TIME = Date.now();
  const MAX_EXECUTION_MS = 120_000; // 120s - leave 30s margin before Deno kills us at ~150s

  let documentId: string | null = null;
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      throw new Error("Invalid JSON body");
    }

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

    documentId = body.documentId;
    const filePath = body.filePath;
    const sourceType = body.sourceType || "pdf"; // "pdf" | "epub" | "url"
    const sourceUrl = body.sourceUrl || null;

    if (!documentId) throw new Error("documentId is required");
    if (sourceType !== "url" && !filePath) throw new Error("filePath is required for file uploads");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read resume info BEFORE clearing it
    const { data: resumeInfo } = await supabase
      .from("legal_documents")
      .select("processing_error")
      .eq("id", documentId)
      .single();
    const savedResumeBlock = resumeInfo?.processing_error?.match(/bloque (\d+)\/(\d+)/);

    // Set processing status
    await supabase
      .from("legal_documents")
      .update({
        processing_status: "processing",
        processing_started_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", documentId);

    // Get document info
    const { data: docInfo, error: docError } = await supabase
      .from("legal_documents")
      .select("title, type, jurisdiction, territorial_entity, effective_date")
      .eq("id", documentId)
      .single();
    if (docError) throw new Error(`Error getting document info: ${docError.message}`);

    // ============ PHASE 1: TEXT EXTRACTION ============
    let extractedText: string | null = null;
    let usePdfVision = false;

    if (sourceType === "url") {
      if (!sourceUrl) throw new Error("sourceUrl is required for URL source type");
      console.log(`Extracting text from URL: ${sourceUrl}`);
      extractedText = await extractTextFromUrl(sourceUrl);
      console.log(`Extracted ${extractedText.length} characters from URL`);
    } else if (sourceType === "epub") {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("legal-docs")
        .download(filePath);
      if (downloadError) throw new Error(`Error downloading EPUB: ${downloadError.message}`);
      const arrayBuffer = await fileData.arrayBuffer();
      console.log(`Extracting text from EPUB...`);
      extractedText = await extractTextFromEpub(arrayBuffer);
      console.log(`Extracted ${extractedText.length} characters from EPUB`);
    } else {
      // PDF - download and check size
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("legal-docs")
        .download(filePath);
      if (downloadError) throw new Error(`Error downloading PDF: ${downloadError.message}`);
      const arrayBuffer = await fileData.arrayBuffer();
      const fileSizeMB = arrayBuffer.byteLength / (1024 * 1024);

      // For small PDFs (<5MB), use vision directly; for large ones, use text blocks
      if (fileSizeMB < 5) {
        usePdfVision = true;
        console.log(`Small PDF (${fileSizeMB.toFixed(1)}MB), using vision mode`);
      } else {
        // For large PDFs, send to AI to extract text first via vision in smaller segments
        // But since we can't split a PDF binary, we use vision on the full file
        // and hope the model handles it. If it fails, we fallback.
        usePdfVision = true;
        console.log(`Large PDF (${fileSizeMB.toFixed(1)}MB), attempting vision mode with pro model`);
      }
    }

    // ============ PHASE 2: CHUNK EXTRACTION ============
    let allChunks: any[] = [];
    let chunksInsertedInThisRun = 0;

    // Check for existing chunks from a previous partial run (resume support)
    const { data: existingChunks } = await supabase
      .from("legal_chunks")
      .select("id, chunk_index")
      .eq("document_id", documentId);
    
    const existingChunkCount = existingChunks?.length || 0;
    const isResume = existingChunkCount > 0;
    if (isResume) {
      console.log(`Resuming: found ${existingChunkCount} existing chunks from previous run`);
    }

    if (usePdfVision) {
      // Only process if no existing chunks (PDF vision is all-or-nothing)
      if (!isResume) {
        const { data: fileData } = await supabase.storage.from("legal-docs").download(filePath);
        const arrayBuffer = await fileData!.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        const systemPrompt = buildChunkExtractionPrompt(docInfo.title, docInfo.type, docInfo.jurisdiction, docInfo.territorial_entity);

        await supabase.from("legal_documents")
          .update({ processing_status: "processing (extrayendo texto del PDF...)" })
          .eq("id", documentId);

        try {
          const aiContent = await callAI([
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: `Procesa este documento legal: "${docInfo.title}". Extrae los fragmentos relevantes.` },
                { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
              ],
            },
          ]);

          const parsed = parseJsonResponse(aiContent);
          allChunks = parsed.chunks || parsed || [];
        } catch (visionError) {
          console.error("PDF vision failed:", visionError);
          allChunks = [{
            content: `Documento: ${docInfo.title}. Pendiente de procesamiento manual. Error: ${visionError instanceof Error ? visionError.message : 'unknown'}`,
            article_reference: null,
            section_title: docInfo.title,
            semantic_category: "otro",
            key_entities: [],
            applies_when: {},
            territorial_scope: docInfo.jurisdiction === 'estatal' ? 'estatal' : 'autonomica',
            affected_municipalities: [],
            affected_provinces: [],
          }];
        }

        // Insert chunks immediately for PDF vision
        const chunksToInsert = allChunks.map((chunk: any, index: number) =>
          validateAndNormalizeChunk(chunk, index, documentId!, docInfo.jurisdiction)
        );
        const { error: insertError } = await supabase.from("legal_chunks").insert(chunksToInsert);
        if (insertError) throw new Error(`Error inserting chunks: ${insertError.message}`);
        chunksInsertedInThisRun = chunksToInsert.length;
      }
    } else if (extractedText) {
      // Text mode - split into blocks and process each WITH INCREMENTAL SAVES
      const blocks = splitTextIntoBlocks(extractedText, 80000);
      console.log(`Split text into ${blocks.length} blocks (from ${extractedText.length} chars)`);

      const systemPrompt = buildChunkExtractionPrompt(docInfo.title, docInfo.type, docInfo.jurisdiction, docInfo.territorial_entity);
      const EXTRACTION_MODEL = "google/gemini-2.5-flash";

      // Determine which block to start from based on existing chunks
      // We track progress via processing_status which contains "bloque X/Y"
      let startBlock = 0;
      if (isResume && savedResumeBlock) {
        startBlock = parseInt(savedResumeBlock[1]) - 1; // Convert 1-indexed to 0-indexed
        console.log(`Resuming from block ${startBlock + 1}/${blocks.length} (had ${existingChunkCount} existing chunks)`);
      }

      let globalChunkIndex = existingChunkCount; // Continue indexing from existing chunks

      let stoppedEarly = false;

      for (let i = startBlock; i < blocks.length; i++) {
        // CHECK TIME LIMIT before starting a new block
        const elapsedMs = Date.now() - FUNCTION_START_TIME;
        if (elapsedMs > MAX_EXECUTION_MS) {
          console.log(`Time limit reached (${Math.round(elapsedMs / 1000)}s). Stopping before block ${i + 1}/${blocks.length} to allow resume.`);
          await supabase.from("legal_documents")
            .update({
              processing_status: "error",
              processing_error: `Tiempo límite alcanzado en bloque ${i + 1}/${blocks.length}. Pulsa "Reprocesar" para continuar desde aquí.`,
            })
            .eq("id", documentId);
          stoppedEarly = true;
          break;
        }

        await supabase.from("legal_documents")
          .update({ processing_status: `processing (bloque ${i + 1}/${blocks.length})` })
          .eq("id", documentId);

        console.log(`Processing block ${i + 1}/${blocks.length} (${blocks[i].length} chars) with flash [${Math.round(elapsedMs / 1000)}s elapsed]`);

        try {
          const aiContent = await callAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: `Procesa este bloque (${i + 1} de ${blocks.length}) del documento "${docInfo.title}":\n\n${blocks[i]}` },
          ], EXTRACTION_MODEL);

          const parsed = parseJsonResponse(aiContent);
          const blockChunks = parsed.chunks || parsed || [];
          if (Array.isArray(blockChunks) && blockChunks.length > 0) {
            const chunksToInsert = blockChunks.map((chunk: any, index: number) =>
              validateAndNormalizeChunk(chunk, globalChunkIndex + index, documentId!, docInfo.jurisdiction)
            );
            const { error: insertError } = await supabase.from("legal_chunks").insert(chunksToInsert);
            if (insertError) {
              console.error(`Error inserting chunks for block ${i + 1}:`, insertError);
            } else {
              globalChunkIndex += blockChunks.length;
              chunksInsertedInThisRun += blockChunks.length;
              console.log(`Block ${i + 1}: saved ${blockChunks.length} chunks (total: ${globalChunkIndex})`);
            }
            allChunks.push(...blockChunks);
          } else {
            console.log(`Block ${i + 1}: no relevant chunks`);
          }
        } catch (blockError) {
          console.error(`Error processing block ${i + 1}:`, blockError);
          await supabase.from("legal_documents")
            .update({
              processing_status: "error",
              processing_error: `Error en bloque ${i + 1}/${blocks.length}. Pulsa "Reprocesar" para continuar.`,
            })
            .eq("id", documentId);
          stoppedEarly = true;
          break;
        }
      }

      // If stopped early, return partial result without proceeding to analysis phase
      if (stoppedEarly) {
        const totalChunks = existingChunkCount + chunksInsertedInThisRun;
        return new Response(
          JSON.stringify({
            success: false,
            partial: true,
            chunks_saved_so_far: totalChunks,
            message: "Procesamiento parcial. Reprocesar para continuar.",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const totalChunks = existingChunkCount + chunksInsertedInThisRun;
    if (totalChunks === 0 && allChunks.length === 0) {
      throw new Error("No se pudieron extraer fragmentos del documento");
    }

    // Statistics
    const allEntities = new Set<string>();
    allChunks.forEach((c: any) => (c.key_entities || []).forEach((e: string) => allEntities.add(e)));

    // ============ PHASE 3: GLOBAL ANALYSIS (ai_summary, keywords, relations) ============
    let documentSummary: string | null = null;
    let documentKeywords: string[] = [];
    let relationsDetected = 0;
    let supersededChunks = 0;

    try {
      await supabase.from("legal_documents")
        .update({ processing_status: "processing (análisis global...)" })
        .eq("id", documentId);

      // Build a summary of chunks for the global analysis
      const chunksSummary = allChunks.slice(0, 40).map((c: any, i: number) =>
        `[${i + 1}] ${c.article_reference || ''} ${c.section_title || ''}: ${(c.content || '').substring(0, 300)}...`
      ).join("\n");

      const analysisPrompt = buildAnalysisPrompt(docInfo.title, chunksSummary, docInfo.effective_date);
      const analysisContent = await callAI([
        { role: "user", content: analysisPrompt },
      ], "google/gemini-2.5-flash");

      const analysisResult = parseJsonResponse(analysisContent);
      const docAnalysis = analysisResult.document_analysis || analysisResult;

      documentSummary = docAnalysis.ai_summary || null;
      documentKeywords = docAnalysis.keywords || [];

      // Save ai_summary and keywords
      const updateData: any = {};
      if (documentSummary) updateData.ai_summary = documentSummary;
      if (documentKeywords.length > 0) updateData.keywords = documentKeywords;
      if (docAnalysis.expiration_date) updateData.expiration_date = docAnalysis.expiration_date;

      if (Object.keys(updateData).length > 0) {
        await supabase.from("legal_documents").update(updateData).eq("id", documentId);
        console.log(`Global analysis saved: summary=${!!documentSummary}, keywords=${documentKeywords.length}, expiration=${docAnalysis.expiration_date || 'none'}`);
      }

      // Process detected relations
      const detectedRelations = docAnalysis.relations || [];
      if (detectedRelations.length > 0) {
        console.log(`Global analysis detected ${detectedRelations.length} relations`);
        supersededChunks = await processRelations(supabase, documentId!, detectedRelations, allChunks);
        relationsDetected = detectedRelations.length;
      }
    } catch (analysisError) {
      console.error("Global analysis failed (non-fatal):", analysisError);
      // Non-fatal: chunks are already saved, just skip the global analysis
    }

    // Mark as completed
    await supabase.from("legal_documents")
      .update({
        processing_status: "completed",
        processing_completed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", documentId);

    return new Response(
      JSON.stringify({
        success: true,
        chunks_created: totalChunks,
        chunks_new_in_this_run: chunksInsertedInThisRun,
        chunks_from_previous_run: existingChunkCount,
        key_entities_count: allEntities.size,
        superseded_chunks: supersededChunks,
        relations_detected: relationsDetected,
        document_summary: documentSummary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing document:", error);

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

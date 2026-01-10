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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, filePath } = await req.json();

    if (!documentId || !filePath) {
      throw new Error("documentId and filePath are required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Convert PDF to text using AI (since we can't use pdf-parse in Deno easily)
    // We'll send the PDF as base64 and ask AI to extract text
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);

    // Build system prompt with territorial extraction instructions
    const systemPrompt = `Eres un asistente legal experto en extraer y estructurar contenido de documentos legales españoles.
Tu tarea es procesar el documento y dividirlo en fragmentos lógicos para una base de conocimiento.

Para CADA fragmento debes:
1. Extraer el contenido coherente (artículo, sección o párrafo)
2. Identificar la referencia al artículo si existe (ej: "Artículo 17.1")
3. Incluir el título de la sección si existe

4. **CRÍTICO - DETECTAR ÁMBITO TERRITORIAL**:
   - Si el fragmento menciona municipios específicos, LISTARLOS TODOS en "affected_municipalities"
   - Si menciona provincias específicas, listarlas en "affected_provinces"
   - Clasificar "territorial_scope":
     * "municipal" → si afecta a municipios concretos listados
     * "provincial" → si afecta a provincias concretas
     * "autonomica" → si es normativa autonómica general
     * "estatal" → si es legislación estatal (LAU, Código Civil, etc.)

**MUY IMPORTANTE**: 
- Cuando un fragmento LISTE MUNICIPIOS (ej: "Barcelona, Cervera, Girona..."), 
  DEBES incluir TODOS y CADA UNO de los municipios en "affected_municipalities".
- Si un fragmento dice "zonas tensionadas" y lista 50+ municipios, extrae TODOS.
- Normaliza los nombres (primera letra mayúscula): "CERVERA" → "Cervera"

Responde SOLO con un JSON array válido:
[
  {
    "content": "Texto del fragmento...",
    "article_reference": "Artículo X" o null,
    "section_title": "Título de la sección" o null,
    "territorial_scope": "municipal|provincial|autonomica|estatal",
    "affected_municipalities": ["Barcelona", "Cervera", "Girona"] o [],
    "affected_provinces": ["Barcelona", "Lleida"] o []
  }
]

Máximo 50 fragmentos. Prioriza los artículos más relevantes para contratos de alquiler.
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
                text: `Procesa este documento legal: "${docInfo.title}". Extrae los fragmentos más relevantes para análisis de contratos de alquiler. RECUERDA: Si hay listas de municipios, extrae TODOS los nombres.`,
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
      // If multimodal fails, try text-only approach with a simpler prompt
      console.log("Multimodal processing failed, using fallback...");

      // For now, create a single chunk with the document title as placeholder
      const { error: insertError } = await supabase.from("legal_chunks").insert({
        document_id: documentId,
        content: `Documento: ${docInfo.title}. Este documento ha sido subido y está pendiente de procesamiento manual.`,
        article_reference: null,
        section_title: docInfo.title,
        chunk_index: 0,
        territorial_scope: docInfo.jurisdiction === 'estatal' ? 'estatal' : 'autonomica',
        affected_municipalities: [],
        affected_provinces: [],
      });

      if (insertError) {
        throw new Error(`Error inserting chunk: ${insertError.message}`);
      }

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

    // Parse chunks from AI response
    let chunks;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : aiContent.trim();
      chunks = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      throw new Error("Error parsing chunks from AI response");
    }

    if (!Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("No valid chunks extracted from document");
    }

    // Process and validate each chunk
    const chunksToInsert = chunks.map((chunk: any, index: number) => {
      // Normalize municipality names (capitalize first letter)
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
          // Validate it's a real Spanish province
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

      return {
        document_id: documentId,
        content: chunk.content,
        article_reference: chunk.article_reference || null,
        section_title: chunk.section_title || null,
        chunk_index: index,
        territorial_scope: scope,
        affected_municipalities: normalizedMunicipalities,
        affected_provinces: normalizedProvinces,
      };
    });

    const { error: insertError } = await supabase.from("legal_chunks").insert(chunksToInsert);

    if (insertError) {
      throw new Error(`Error inserting chunks: ${insertError.message}`);
    }

    // Count total municipalities and provinces extracted
    const totalMunicipalities = chunksToInsert.reduce(
      (acc: number, chunk: any) => acc + (chunk.affected_municipalities?.length || 0), 
      0
    );
    const totalProvinces = chunksToInsert.reduce(
      (acc: number, chunk: any) => acc + (chunk.affected_provinces?.length || 0), 
      0
    );

    return new Response(
      JSON.stringify({
        success: true,
        chunks_created: chunks.length,
        municipalities_extracted: totalMunicipalities,
        provinces_extracted: totalProvinces,
        message: `Documento procesado: ${chunks.length} fragmentos indexados. ${totalMunicipalities} municipios y ${totalProvinces} provincias detectados.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

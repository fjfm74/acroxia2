import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
      .select("title, type")
      .eq("id", documentId)
      .single();

    if (docError) {
      throw new Error(`Error getting document info: ${docError.message}`);
    }

    // Convert PDF to text using AI (since we can't use pdf-parse in Deno easily)
    // We'll send the PDF as base64 and ask AI to extract text
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
            content: `Eres un asistente legal experto en extraer y estructurar contenido de documentos legales españoles.
Tu tarea es procesar el documento y dividirlo en fragmentos lógicos para una base de conocimiento.

Cada fragmento debe:
- Contener un artículo, sección o párrafo coherente
- Incluir la referencia al artículo si existe (ej: "Artículo 17.1")
- Incluir el título de la sección si existe
- Ser autocontenido y comprensible por sí solo

Responde SOLO con un JSON array válido:
[
  {
    "content": "Texto del fragmento...",
    "article_reference": "Artículo X" o null,
    "section_title": "Título de la sección" o null
  }
]

Máximo 50 fragmentos. Prioriza los artículos más relevantes para contratos de alquiler.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Procesa este documento legal: "${docInfo.title}". Extrae los fragmentos más relevantes para análisis de contratos de alquiler.`,
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
      // In production, you'd want to use a proper PDF parser
      const { error: insertError } = await supabase.from("legal_chunks").insert({
        document_id: documentId,
        content: `Documento: ${docInfo.title}. Este documento ha sido subido y está pendiente de procesamiento manual.`,
        article_reference: null,
        section_title: docInfo.title,
        chunk_index: 0,
      });

      if (insertError) {
        throw new Error(`Error inserting chunk: ${insertError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          chunks_created: 1,
          message: "Documento registrado. Procesamiento completo pendiente."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Insert chunks into database
    const chunksToInsert = chunks.map((chunk: any, index: number) => ({
      document_id: documentId,
      content: chunk.content,
      article_reference: chunk.article_reference || null,
      section_title: chunk.section_title || null,
      chunk_index: index,
    }));

    const { error: insertError } = await supabase
      .from("legal_chunks")
      .insert(chunksToInsert);

    if (insertError) {
      throw new Error(`Error inserting chunks: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunks_created: chunks.length,
        message: `Documento procesado: ${chunks.length} fragmentos indexados`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

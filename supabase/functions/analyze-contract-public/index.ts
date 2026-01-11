import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getFileType(filePath: string, mimeType?: string): "pdf" | "docx" | "image" {
  if (mimeType?.includes("pdf") || filePath.toLowerCase().endsWith(".pdf")) return "pdf";
  if (mimeType?.includes("wordprocessingml") || filePath.toLowerCase().endsWith(".docx") || filePath.toLowerCase().endsWith(".doc")) return "docx";
  return "image";
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawText = decoder.decode(uint8Array);
  
  const textSegments = rawText.match(/[\x20-\x7E\xC0-\xFF\n\r\t]+/g) || [];
  return textSegments
    .filter(segment => segment.length > 10)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function extractImageText(buffer: ArrayBuffer, mimeType: string, apiKey: string): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Transcribe TODO el texto visible en esta imagen de un contrato de alquiler español. Extrae el texto completo manteniendo la estructura del documento. Devuelve SOLO el texto transcrito sin comentarios adicionales." 
          },
          { 
            type: "image_url", 
            image_url: { url: `data:${mimeType};base64,${base64}` } 
          }
        ]
      }]
    }),
  });

  if (!response.ok) {
    throw new Error("Error al procesar la imagen con OCR");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Simplified system prompt for public analysis
function buildSystemPrompt(): string {
  return `Eres un experto en derecho inmobiliario español especializado en contratos de alquiler de vivienda habitual.

Tu tarea es analizar el contrato proporcionado e identificar cláusulas que puedan ser:
- ILEGALES: Contravienen directamente la LAU u otra normativa aplicable
- SOSPECHOSAS: Podrían ser abusivas o perjudiciales para el inquilino
- LEGALES: Conformes a la normativa vigente

MARCO LEGAL DE REFERENCIA:
- Ley 29/1994 de Arrendamientos Urbanos (LAU)
- Ley 12/2023 por el derecho a la vivienda
- Real Decreto-ley 7/2019

PUNTOS CRÍTICOS A REVISAR:
1. Fianza: Máximo 1 mensualidad + 2 de garantías adicionales
2. Duración: Mínimo 5 años (persona física) o 7 años (jurídica)
3. Honorarios inmobiliaria: A cargo del arrendador si es empresa
4. Actualización renta: Índice oficial, no IPC libre
5. Obras y reparaciones: Conservación a cargo del propietario
6. Penalizaciones: Máximo 1 mes por año restante de contrato

FORMATO DE RESPUESTA (JSON estricto):
{
  "total_clauses": número,
  "valid_clauses": número,
  "suspicious_clauses": número,
  "illegal_clauses": número,
  "recommendation": "firmar" | "negociar" | "no_firmar",
  "clauses": [
    {
      "category": "FIANZA Y GARANTÍAS" | "DURACIÓN Y PRÓRROGAS" | "RENTA Y ACTUALIZACIONES" | "GASTOS E IMPUESTOS" | "OBRAS Y REPARACIONES" | "PENALIZACIONES" | "HONORARIOS" | "OTRAS",
      "type": "legal" | "suspicious" | "illegal",
      "original_text": "texto exacto del contrato",
      "explanation": "breve explicación del problema",
      "legal_reference": "artículo aplicable"
    }
  ]
}

Analiza de forma rigurosa pero concisa. Prioriza las cláusulas más problemáticas.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisId, filePath, fileType, sessionId } = await req.json();
    
    if (!analysisId || !filePath) {
      throw new Error("Faltan parámetros requeridos");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing public analysis: ${analysisId}, file: ${filePath}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("contracts")
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Error descargando archivo: ${downloadError?.message}`);
    }

    // Extract text based on file type
    const detectedFileType = getFileType(filePath, fileType);
    const buffer = await fileData.arrayBuffer();
    let contractText = "";

    console.log(`Extracting text from ${detectedFileType} file`);

    switch (detectedFileType) {
      case "pdf":
        contractText = await extractPdfText(buffer);
        break;
      case "docx":
        contractText = await extractDocxText(buffer);
        break;
      case "image":
        contractText = await extractImageText(buffer, fileType || "image/jpeg", apiKey);
        break;
    }

    if (!contractText || contractText.length < 100) {
      throw new Error("No se pudo extraer suficiente texto del documento");
    }

    console.log(`Extracted ${contractText.length} characters`);

    // Call AI for analysis
    const systemPrompt = buildSystemPrompt();
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analiza el siguiente contrato de alquiler:\n\n${contractText.substring(0, 15000)}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Error al procesar el contrato con IA");
    }

    const aiData = await aiResponse.json();
    let analysisContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON response
    const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Respuesta de IA no válida");
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    
    console.log(`Analysis complete: ${analysisResult.total_clauses} clauses, ${analysisResult.illegal_clauses} illegal`);

    // Update anonymous_analyses with result
    const { error: updateError } = await supabase
      .from("anonymous_analyses")
      .update({ analysis_result: analysisResult })
      .eq("id", analysisId);

    if (updateError) {
      console.error("Error updating analysis:", updateError);
      throw new Error("Error guardando resultados");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysisId,
        preview: {
          total_clauses: analysisResult.total_clauses,
          valid_clauses: analysisResult.valid_clauses,
          suspicious_clauses: analysisResult.suspicious_clauses,
          illegal_clauses: analysisResult.illegal_clauses,
          recommendation: analysisResult.recommendation,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Public analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error procesando el análisis" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

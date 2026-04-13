import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SupportedLanguage = "es" | "ca" | "mixed_es_ca" | "unsupported";
type LanguageDetectionResult = {
  detectedLanguage: SupportedLanguage;
  supported: boolean;
  esScore: number;
  caScore: number;
};

const ES_LANGUAGE_PATTERNS: RegExp[] = [
  /\barrendador(?:a)?\b/gi,
  /\barrendatari[oa]\b/gi,
  /\balquiler\b/gi,
  /\bvivienda\b/gi,
  /\bfianza\b/gi,
  /\bcl[áa]usula\b/gi,
  /\bpr[óo]rroga\b/gi,
  /\bdesistimiento\b/gi,
  /\bcertificado de eficiencia energ[ée]tica\b/gi,
  /\bc[ée]dula de habitabilidad\b/gi,
  /\brenta\b/gi,
  /\bgastos\b/gi,
];

const CA_LANGUAGE_PATTERNS: RegExp[] = [
  /\barrendament\b/gi,
  /\barrendatari[ae]\b/gi,
  /\blloguer\b/gi,
  /\bhabitatge\b/gi,
  /\bfian[cç]a\b/gi,
  /\bcl[àa]usula\b/gi,
  /\bpr[òo]rroga\b/gi,
  /\bdesistiment\b/gi,
  /\bcertificat d['’]efici[èe]ncia energ[èe]tica\b/gi,
  /\bc[èe]dula d['’]habitabilitat\b/gi,
  /\brenda\b/gi,
  /\bdespeses\b/gi,
];

function countLanguageMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, pattern) => acc + (text.match(pattern)?.length || 0), 0);
}

function detectSupportedLanguage(text: string): LanguageDetectionResult {
  const sample = text.toLowerCase().slice(0, 50000);
  const esScore = countLanguageMatches(sample, ES_LANGUAGE_PATTERNS);
  const caScore = countLanguageMatches(sample, CA_LANGUAGE_PATTERNS);
  const total = esScore + caScore;

  if (total < 3) {
    return { detectedLanguage: "unsupported", supported: false, esScore, caScore };
  }

  if (esScore >= 3 && esScore >= caScore * 1.6) {
    return { detectedLanguage: "es", supported: true, esScore, caScore };
  }

  if (caScore >= 3 && caScore >= esScore * 1.6) {
    return { detectedLanguage: "ca", supported: true, esScore, caScore };
  }

  if (esScore >= 2 && caScore >= 2) {
    return { detectedLanguage: "mixed_es_ca", supported: true, esScore, caScore };
  }

  if (esScore >= 3) {
    return { detectedLanguage: "es", supported: true, esScore, caScore };
  }

  if (caScore >= 3) {
    return { detectedLanguage: "ca", supported: true, esScore, caScore };
  }

  return { detectedLanguage: "unsupported", supported: false, esScore, caScore };
}

function getFileType(filePath: string, mimeType?: string): "pdf" | "docx" | "image" {
  if (mimeType?.includes("pdf") || filePath.toLowerCase().endsWith(".pdf")) return "pdf";
  if (
    mimeType?.includes("wordprocessingml") ||
    filePath.toLowerCase().endsWith(".docx") ||
    filePath.toLowerCase().endsWith(".doc")
  )
    return "docx";
  return "image";
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawText = decoder.decode(uint8Array);

  const textSegments = rawText.match(/[\x20-\x7E\xC0-\xFF\n\r\t]+/g) || [];
  return textSegments
    .filter((segment) => segment.length > 10)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);
  const result = await mammoth.extractRawText({ buffer: uint8 });
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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe TODO el texto visible en esta imagen de un contrato de alquiler español. Extrae el texto completo manteniendo la estructura del documento. Devuelve SOLO el texto transcrito sin comentarios adicionales.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Error al procesar la imagen con OCR");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractPdfTextWithVision(buffer: ArrayBuffer, apiKey: string): Promise<string> {
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
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe TODO el texto legible de este PDF de alquiler en España. Mantén estructura por secciones cuando sea posible. Devuelve SOLO texto plano transcrito, sin comentarios.",
            },
            {
              type: "image_url",
              image_url: { url: `data:application/pdf;base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error OCR PDF (vision): ${response.status} ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function looksLikeLowQualityPdfExtraction(text: string): boolean {
  if (!text || text.length < 1200) return true;
  const lower = text.toLowerCase();
  const legalSignals = ["arrend", "claus", "renta", "fianza", "vivienda", "arrendador", "arrendatario"];
  const hits = legalSignals.filter((s) => lower.includes(s)).length;
  if (hits < 2) return true;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount < 200;
}

function splitContractCoreAndAnnexes(text: string): { coreText: string; annexText: string; splitApplied: boolean } {
  const markers = [
    /\banexo(?:s)?\b/i,
    /\bannex(?:os)?\b/i,
    /c[ée]dula\s+de\s+habitabilidad/i,
    /c[èe]dula\s+d['’]habitabilitat/i,
    /licencia\s+de\s+(?:primera|segunda)\s+ocupaci[oó]n/i,
    /llic[eè]ncia\s+de\s+(?:primera|segona)\s+ocupaci[oó]/i,
    /certificado\s+de\s+eficiencia\s+energ[ée]tica/i,
    /certificat\s+d['’]efici[èe]ncia\s+energ[èe]tica/i,
    /etiqueta\s+energ[ée]tica/i,
    /etiqueta\s+energ[èe]tica/i,
  ];

  let splitIndex = -1;
  for (const marker of markers) {
    const match = marker.exec(text);
    if (match && match.index >= 0 && (splitIndex === -1 || match.index < splitIndex)) {
      splitIndex = match.index;
    }
  }

  if (splitIndex > 5000) {
    return {
      coreText: text.slice(0, splitIndex).trim(),
      annexText: text.slice(splitIndex).trim(),
      splitApplied: true,
    };
  }

  return {
    coreText: text,
    annexText: "",
    splitApplied: false,
  };
}

// Simplified system prompt for public analysis
function buildSystemPrompt(): string {
  return `Eres un experto en derecho inmobiliario español especializado en contratos de alquiler de vivienda habitual.
El contrato puede estar en español o catalán. Debes interpretar equivalencias legales entre ambos idiomas.

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
    const { analysisId, filePath, fileType, sessionId, fileName } = await req.json();

    if (!filePath) {
      throw new Error("Faltan parámetros requeridos");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create anonymous analysis record if not provided
    let effectiveAnalysisId = analysisId;
    if (!effectiveAnalysisId) {
      const { data: newAnalysis, error: insertError } = await supabase
        .from("anonymous_analyses")
        .insert({
          session_id: sessionId || "unknown",
          file_name: fileName || "unknown",
          file_path: filePath,
        })
        .select("id")
        .single();

      if (insertError) throw new Error(`Error creating analysis record: ${insertError.message}`);
      effectiveAnalysisId = newAnalysis.id;
    }

    console.log(`Processing public analysis: ${effectiveAnalysisId}, file: ${filePath}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage.from("contracts").download(filePath);

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
        if (looksLikeLowQualityPdfExtraction(contractText)) {
          console.log("Low-quality PDF text extraction detected in public analyzer, retrying with vision OCR...");
          try {
            const visionText = await extractPdfTextWithVision(buffer, apiKey);
            if (visionText.length > contractText.length) {
              contractText = visionText;
            }
          } catch (visionError) {
            console.warn("Public analyzer vision OCR fallback failed:", visionError);
          }
        }
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

    const languageDetection = detectSupportedLanguage(contractText);
    console.log(
      `Language detection: ${languageDetection.detectedLanguage} (es=${languageDetection.esScore}, ca=${languageDetection.caScore})`,
    );
    if (!languageDetection.supported) {
      await supabase
        .from("anonymous_analyses")
        .update({
          analysis_result: {
            error:
              "No se puede validar el contrato: idioma no soportado. Actualmente solo se admiten español y catalán.",
            code: "UNSUPPORTED_LANGUAGE",
            detected_language: languageDetection.detectedLanguage,
            language_scores: { es: languageDetection.esScore, ca: languageDetection.caScore },
          },
        })
        .eq("id", analysisId);

      return new Response(
        JSON.stringify({
          error: "No se puede validar el contrato: idioma no soportado. Actualmente solo se admiten español y catalán.",
          code: "UNSUPPORTED_LANGUAGE",
          detected_language: languageDetection.detectedLanguage,
          language_scores: { es: languageDetection.esScore, ca: languageDetection.caScore },
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Call AI for analysis
    const systemPrompt = buildSystemPrompt();

    const { coreText, annexText } = splitContractCoreAndAnnexes(contractText);
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
          {
            role: "user",
            content: `Analiza el siguiente contrato de alquiler:\n\nCONTRATO BASE:\n${coreText.substring(0, 13000)}\n\nANEXOS:\n${annexText.substring(0, 3000)}\n\nTEXTO COMPLETO DE RESPALDO:\n${contractText.substring(0, 2000)}`,
          },
        ],
        temperature: 0,
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
    analysisResult.contract_metadata = {
      ...(analysisResult.contract_metadata || {}),
      detected_language: languageDetection.detectedLanguage,
      language_scores: { es: languageDetection.esScore, ca: languageDetection.caScore },
    };

    console.log(
      `Analysis complete: ${analysisResult.total_clauses} clauses, ${analysisResult.illegal_clauses} illegal`,
    );

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
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Public analysis error:", error);
    return new Response(JSON.stringify({ error: error.message || "Error procesando el análisis" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

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
            text: "Transcribe TODO el texto visible en esta imagen de un contrato de alquiler español. Extrae el texto completo manteniendo la estructura del documento. Si hay varias páginas o secciones, transcríbelas todas. Devuelve SOLO el texto transcrito sin comentarios adicionales." 
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, filePath, fileType: mimeType } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("contracts")
      .download(filePath);

    if (downloadError) throw downloadError;

    // Determine file type and extract text
    const detectedType = getFileType(filePath, mimeType);
    const buffer = await fileData.arrayBuffer();
    let contractText = "";

    console.log(`Processing file as: ${detectedType}`);

    switch (detectedType) {
      case "pdf":
        contractText = await extractPdfText(buffer);
        // Fallback if extraction was poor
        if (contractText.length < 500) {
          const fallbackText = await fileData.text();
          if (fallbackText.length > contractText.length) {
            contractText = fallbackText;
          }
        }
        break;
      case "docx":
        contractText = await extractDocxText(buffer);
        break;
      case "image":
        contractText = await extractImageText(buffer, mimeType || "image/jpeg", lovableApiKey);
        break;
    }

    console.log(`Extracted ${contractText.length} characters from ${detectedType}`);

    // Search legal knowledge base
    const { data: legalChunks } = await supabase.rpc("search_legal_chunks", {
      search_query: "alquiler arrendamiento fianza clausula abusiva ilegal",
      match_count: 15,
    });

    const legalContext = legalChunks?.map((chunk: any) => 
      `[${chunk.document_title} - ${chunk.article_reference || ""}]\n${chunk.content}`
    ).join("\n\n") || "";

    // Call Lovable AI for contract analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un experto en derecho inmobiliario español, especializado en la Ley de Arrendamientos Urbanos (LAU) y protección del inquilino.

CONTEXTO LEGAL:
${legalContext}

Analiza contratos de alquiler y detecta cláusulas ilegales, abusivas o sospechosas. Para cada cláusula problemática, cita el artículo de ley específico.

IMPORTANTE: Identifica al menos las siguientes cláusulas típicas de un contrato de alquiler:
- Duración del contrato y prórrogas
- Renta mensual y actualizaciones
- Fianza y garantías adicionales
- Gastos y suministros
- Obras y reformas
- Subarriendo
- Causas de resolución
- Penalizaciones

Responde SIEMPRE en formato JSON válido con esta estructura:
{
  "clauses": [
    {
      "text": "título o resumen corto de la cláusula (máx 50 caracteres)",
      "type": "valid|suspicious|illegal",
      "explanation": "explicación detallada de por qué es válida, sospechosa o ilegal",
      "legalReference": "artículo de ley específico si aplica (ej: Art. 36.1 LAU)",
      "recommendation": "recomendación para el inquilino si la cláusula es problemática"
    }
  ],
  "overall_assessment": "evaluación general del contrato y nivel de riesgo",
  "summary": "resumen ejecutivo de 2-3 líneas para el inquilino"
}`
          },
          {
            role: "user",
            content: `Analiza el siguiente contrato de alquiler. Si el texto parece corrupto o ilegible, intenta identificar las cláusulas que puedas reconocer:\n\n${contractText.substring(0, 20000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Servicio temporalmente no disponible. Por favor, intenta de nuevo en unos minutos." 
        }), { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      throw new Error("Error en el análisis de IA");
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "{}";
    
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch {
      console.error("Failed to parse AI response:", analysisText);
      analysis = { clauses: [], overall_assessment: analysisText, summary: "" };
    }

    const clauses = analysis.clauses || [];
    const validCount = clauses.filter((c: any) => c.type === "valid").length;
    const suspiciousCount = clauses.filter((c: any) => c.type === "suspicious").length;
    const illegalCount = clauses.filter((c: any) => c.type === "illegal").length;

    // If there are illegal clauses, generate a claim letter
    if (illegalCount > 0) {
      const illegalClauses = clauses.filter((c: any) => c.type === "illegal");
      
      const letterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Eres un abogado experto en derecho inmobiliario español. Genera cartas de reclamación formales y profesionales para inquilinos que han encontrado cláusulas ilegales en sus contratos de alquiler.

La carta debe:
1. Ser formal y respetuosa pero firme
2. Identificar claramente cada cláusula ilegal
3. Citar los artículos de ley que la hacen ilegal
4. Solicitar la modificación o eliminación de dichas cláusulas
5. Indicar que el inquilino se reserva el derecho de acudir a las autoridades competentes

Formato: Carta formal en español, con fecha, destinatario (propietario/arrendador), cuerpo y firma.`
            },
            {
              role: "user",
              content: `Genera una carta de reclamación formal basada en estas cláusulas ilegales encontradas en un contrato de alquiler:\n\n${JSON.stringify(illegalClauses, null, 2)}`
            }
          ],
        }),
      });

      if (letterResponse.ok) {
        const letterData = await letterResponse.json();
        analysis.generated_letter = letterData.choices?.[0]?.message?.content || null;
      }
    }

    // Save results
    await supabase.from("analysis_results").insert({
      contract_id: contractId,
      total_clauses: clauses.length,
      valid_clauses: validCount,
      suspicious_clauses: suspiciousCount,
      illegal_clauses: illegalCount,
      full_report: analysis,
      summary: analysis.summary || analysis.overall_assessment,
    });

    // Update contract status
    await supabase.from("contracts").update({ status: "completed" }).eq("id", contractId);

    // Deduct credit - skip for admin users
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc("is_admin", { check_user_id: user.id });
        
        if (isAdmin) {
          console.log(`Admin user ${user.id} - no credit deducted`);
        } else {
          await supabase.rpc("decrement_credit", { user_id: user.id });
          console.log(`Credit deducted for user ${user.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, filePath } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("contracts")
      .download(filePath);

    if (downloadError) throw downloadError;

    const pdfText = await fileData.text();

    // Search legal knowledge base
    const { data: legalChunks } = await supabase.rpc("search_legal_chunks", {
      search_query: "alquiler arrendamiento fianza clausula",
      match_count: 10,
    });

    const legalContext = legalChunks?.map((chunk: any) => 
      `[${chunk.document_title} - ${chunk.article_reference || ""}]\n${chunk.content}`
    ).join("\n\n") || "";

    // Call Lovable AI
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

Responde SIEMPRE en formato JSON válido con esta estructura:
{
  "clauses": [
    {
      "text": "texto de la cláusula",
      "type": "valid|suspicious|illegal",
      "explanation": "explicación detallada",
      "legalReference": "artículo de ley si aplica",
      "recommendation": "recomendación si aplica"
    }
  ],
  "overall_assessment": "evaluación general del contrato",
  "summary": "resumen breve de 2-3 líneas"
}`
          },
          {
            role: "user",
            content: `Analiza el siguiente contrato de alquiler:\n\n${pdfText.substring(0, 15000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      throw new Error("Error en el análisis de IA");
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "{}";
    
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch {
      analysis = { clauses: [], overall_assessment: analysisText, summary: "" };
    }

    const clauses = analysis.clauses || [];
    const validCount = clauses.filter((c: any) => c.type === "valid").length;
    const suspiciousCount = clauses.filter((c: any) => c.type === "suspicious").length;
    const illegalCount = clauses.filter((c: any) => c.type === "illegal").length;

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

    // Deduct credit
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        await supabase.from("profiles").update({ credits: supabase.rpc("decrement_credits") }).eq("id", user.id);
        await supabase.rpc("decrement_credit", { user_id: user.id });
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

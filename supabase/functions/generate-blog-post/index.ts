import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { mode, prompt } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = `Eres un experto redactor de contenido legal inmobiliario en España. 
Tu tarea es escribir artículos de blog profesionales, informativos y útiles para inquilinos.

El artículo debe:
- Estar escrito en español de España
- Ser informativo y práctico
- Citar legislación relevante cuando sea apropiado (LAU, Código Civil, etc.)
- Tener un tono profesional pero accesible
- Incluir consejos prácticos

REGLAS DE LENGUAJE LEGAL (OBLIGATORIO):
- NUNCA uses afirmaciones absolutas como "es ilegal", "es nulo", "está prohibido"
- USA lenguaje matizado: "según la LAU", "se considera", "podría ser", "generalmente"
- SIEMPRE cita la fuente legal cuando menciones derechos u obligaciones
- NO actúes como asesor legal - el contenido es informativo, no constituye asesoramiento
- Evita imperativos como "debes" o "tienes que" - usa "es recomendable", "se aconseja"

Ejemplos de transformación:
- MAL: "Es ilegal cobrar más de 3 meses de fianza"
- BIEN: "Según el artículo 36 de la LAU, se considera contrario a la ley exigir más de 3 mensualidades en total"
- MAL: "Esa cláusula es nula"
- BIEN: "Esa cláusula podría considerarse nula según la LAU"
- MAL: "El casero no puede subir la renta"
- BIEN: "De acuerdo con la normativa vigente, las actualizaciones de renta estarían limitadas al índice IRAV"

Formato de respuesta OBLIGATORIO (JSON válido):
{
  "title": "Título del artículo (máximo 60 caracteres)",
  "excerpt": "Resumen corto del artículo en 2-3 frases (máximo 160 caracteres)",
  "content": "Contenido completo en formato Markdown. Usa ## para subtítulos, listas con -, y **negrita** para énfasis. Mínimo 800 palabras.",
  "category": "Una de: Cláusulas, Fianzas, Derechos, Subidas de renta, Legislación, Consejos",
  "read_time": "X min (estimación de lectura)",
  "meta_description": "Descripción SEO del artículo (máximo 160 caracteres)",
  "keywords": ["array", "de", "palabras", "clave", "SEO"]
}`;

    let userPrompt: string;

    if (mode === "auto") {
      userPrompt = `Escribe un artículo sobre un tema actual y relevante del sector inmobiliario español de alquiler. 
Elige un tema que sea de interés para inquilinos, como:
- Cambios recientes en la legislación de alquiler
- Derechos poco conocidos de los inquilinos
- Cómo reclamar ante problemas con el casero
- Cláusulas abusivas comunes en contratos
- El nuevo índice de referencia de alquileres
- Consejos para negociar el contrato

Elige el tema que consideres más útil y actual para los lectores en enero de 2026.`;
    } else {
      userPrompt = `Escribe un artículo de blog sobre el siguiente tema:

${prompt}

Asegúrate de que el artículo sea completo, informativo y útil para inquilinos en España.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de peticiones excedido. Inténtalo de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Añade créditos a tu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content returned from AI");
    }

    // Parse JSON from the response
    let blogPost;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      blogPost = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Error parsing blog post from AI response");
    }

    // Return the blog post without a hardcoded image
    // The admin can use the "Buscar otra imagen" button to generate one
    blogPost.image = "";

    return new Response(JSON.stringify(blogPost), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating blog post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

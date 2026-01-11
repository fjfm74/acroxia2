import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const ALL_CATEGORIES = [
  "Cláusulas",
  "Fianzas", 
  "Derechos",
  "Subidas de renta",
  "Legislación",
  "Consejos",
];

const TITLE_FORMATS = [
  "X errores que cometen los inquilinos al...",
  "Qué hacer si el casero...",
  "Por qué no deberías firmar/aceptar...",
  "Lo que nadie te cuenta sobre...",
  "Cómo reclamar...",
  "X cosas que tu casero no puede hacer legalmente",
  "El truco legal para...",
  "X señales de que tu contrato tiene cláusulas abusivas",
  "La verdad sobre...",
  "Tus derechos cuando...",
  "Cómo defenderte ante...",
  "X mitos sobre el alquiler que debes ignorar",
];

interface ExistingPost {
  title: string;
  category: string;
}

function getLeastUsedCategories(existingPosts: ExistingPost[]): string[] {
  const categoryCount = ALL_CATEGORIES.map(cat => ({
    category: cat,
    count: existingPosts.filter(p => p.category === cat).length
  }));
  
  categoryCount.sort((a, b) => a.count - b.count);
  
  // Return the 2-3 least used categories
  return categoryCount.slice(0, 3).map(c => c.category);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, prompt, existingPosts = [] } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const leastUsedCategories = getLeastUsedCategories(existingPosts);
    
    // Build context about existing posts
    const existingPostsContext = existingPosts.length > 0
      ? `\n\nPOSTS YA PUBLICADOS (NO repitas estos temas ni títulos similares):
${existingPosts.map((p: ExistingPost) => `- "${p.title}" (${p.category})`).join('\n')}

IMPORTANTE: 
- El título y el enfoque DEBEN ser completamente diferentes a los posts listados arriba
- NO uses palabras clave similares a títulos existentes
- Busca ángulos nuevos y originales`
      : "";

    const categoryGuidance = `\n\nCATEGORÍA PRIORITARIA:
Las siguientes categorías tienen menos contenido y deberían priorizarse:
${leastUsedCategories.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Genera el post preferiblemente en una de estas categorías.`;

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

VARIEDAD EN TÍTULOS (OBLIGATORIO):
NO uses siempre "Guía sobre..." o "Guía completa de...". Alterna entre estos formatos:
${TITLE_FORMATS.map(f => `- ${f}`).join('\n')}

Ejemplos de buenos títulos:
- "5 errores que cometen los inquilinos al reclamar la fianza"
- "Qué hacer si el casero te sube el alquiler en 2026"
- "Lo que nadie te cuenta sobre las cláusulas de permanencia"
- "Tus derechos cuando el casero quiere entrar en tu piso"
- "7 señales de que tu contrato tiene cláusulas abusivas"
${existingPostsContext}
${categoryGuidance}

Formato de respuesta OBLIGATORIO (JSON válido):
{
  "title": "Título creativo y variado (NO empieces con 'Guía', máximo 60 caracteres)",
  "excerpt": "Resumen corto del artículo en 2-3 frases (máximo 160 caracteres)",
  "content": "Contenido completo en formato Markdown. Usa ## para subtítulos, listas con -, y **negrita** para énfasis. Mínimo 800 palabras.",
  "category": "Una de: ${ALL_CATEGORIES.join(', ')}",
  "read_time": "X min (estimación de lectura)",
  "meta_description": "Descripción SEO del artículo (máximo 160 caracteres)",
  "keywords": ["array", "de", "palabras", "clave", "SEO"]
}`;

    let userPrompt: string;

    if (mode === "auto") {
      userPrompt = `Escribe un artículo ORIGINAL sobre un tema actual y relevante del sector inmobiliario español de alquiler. 

REQUISITOS CLAVE:
1. El tema debe ser DIFERENTE a cualquier post ya publicado
2. Usa un formato de título CREATIVO (no "Guía sobre...")
3. Prioriza las categorías con menos contenido: ${leastUsedCategories.join(', ')}

Temas sugeridos (elige uno que NO esté ya cubierto):
- Cambios recientes en la legislación de alquiler 2026
- Derechos poco conocidos de los inquilinos
- Cómo reclamar ante problemas específicos con el casero
- Cláusulas abusivas comunes que pasan desapercibidas
- El nuevo índice de referencia de alquileres IRAV
- Consejos para negociar renovación del contrato
- Problemas de convivencia y comunidad
- Obras y reformas: derechos y obligaciones
- Suministros y gastos de comunidad
- Fin de contrato y prórrogas

Elige el tema que consideres más útil, actual y DIFERENTE a lo ya publicado.`;
    } else {
      userPrompt = `Escribe un artículo de blog sobre el siguiente tema:

${prompt}

IMPORTANTE:
- Usa un título CREATIVO (no "Guía sobre...")
- El enfoque debe ser original y diferente a posts existentes
- Asegúrate de que el artículo sea completo, informativo y útil para inquilinos en España.`;
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
        temperature: 0.8, // Slightly higher for more creativity
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

    // Validate category is one of the allowed ones
    if (!ALL_CATEGORIES.includes(blogPost.category)) {
      // Try to match to closest category
      const lowerCategory = blogPost.category.toLowerCase();
      const matchedCategory = ALL_CATEGORIES.find(c => 
        lowerCategory.includes(c.toLowerCase()) || c.toLowerCase().includes(lowerCategory)
      );
      blogPost.category = matchedCategory || leastUsedCategories[0];
    }

    // Return the blog post without a hardcoded image
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

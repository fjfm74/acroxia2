import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SlideContent {
  slide_number: number;
  type: "cover" | "content" | "cta";
  headline: string;
  body?: string;
  visual_suggestion: string;
}

interface SocialContentResponse {
  caption: string;
  slides: SlideContent[];
  hashtags: string[];
  best_posting_time: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, blog_post, custom_topic, platform, content_type } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the context based on mode
    let contentContext = "";
    if (mode === "from_blog" && blog_post) {
      contentContext = `
CONTENIDO DEL BLOG:
Título: ${blog_post.title}
Categoría: ${blog_post.category}
Extracto: ${blog_post.excerpt}
Contenido completo:
${blog_post.content}
`;
    } else if (mode === "from_topic" && custom_topic) {
      contentContext = `
TEMA A DESARROLLAR:
${custom_topic}

Contexto: ACROXIA es una plataforma de análisis de contratos de alquiler con IA que ayuda a inquilinos a detectar cláusulas abusivas. Nuestro público objetivo son inquilinos en España preocupados por sus derechos.
`;
    } else {
      throw new Error("Debe proporcionar un blog_post o custom_topic");
    }

    // Platform-specific instructions
    const platformInstructions: Record<string, string> = {
      instagram: `
- Límite de caption: 2,200 caracteres
- Máximo 30 hashtags (usa 15-20 relevantes)
- Usa emojis estratégicamente
- Incluye CTA claro (link en bio, guarda, comparte)
- Formato vertical 4:5 para imágenes`,
      tiktok: `
- Límite de caption: 4,000 caracteres
- Hashtags ilimitados pero usa 5-10 estratégicos
- Tono informal, cercano, trending
- Si es reel_script, escribe guión con timestamps`,
      facebook: `
- Límite de caption: 63,206 caracteres (usa 100-300 palabras)
- 10-15 hashtags máximo
- Tono más formal que Instagram
- Puede incluir enlaces directos`,
      linkedin: `
- Límite de caption: 3,000 caracteres
- 3-5 hashtags máximo
- Tono profesional y educativo
- Enfoque en valor y expertise
- Formato de lista funciona bien`,
      twitter: `
- Límite: 280 caracteres por tweet
- 2-3 hashtags máximo
- Si es thread, divide en tweets numerados
- Tono directo y conciso`,
    };

    // Content type specific instructions
    const contentTypeInstructions: Record<string, string> = {
      post: "Genera un único post con imagen destacada. Visual_suggestion debe describir UNA imagen impactante.",
      carousel: `Genera un carrusel de 5-7 slides:
- Slide 1: Cover llamativo con pregunta o statement impactante
- Slides 2-5: Contenido educativo, un punto por slide
- Slide final: CTA claro para seguir o visitar ACROXIA
Cada slide debe tener headline corto (máx 10 palabras) y body opcional (máx 25 palabras)`,
      story: "Genera contenido para 3-5 stories consecutivas. Cada una muy breve y visual.",
      reel_script: `Genera un guión de video de 30-60 segundos:
- Hook inicial (3 segundos)
- Desarrollo (20-40 segundos)
- CTA final (5 segundos)
Incluye indicaciones de texto en pantalla y transiciones.`,
      thread: "Genera un hilo de 5-8 tweets conectados. Primer tweet debe enganchar, último debe tener CTA.",
    };

    const systemPrompt = `Eres un experto en marketing de contenidos para redes sociales especializado en el sector legal/inmobiliario español. 

Tu tarea es crear contenido viral y educativo para ACROXIA, una plataforma que analiza contratos de alquiler con IA.

REGLAS GENERALES:
- Tono: Cercano, empático con inquilinos, profesional pero accesible
- Siempre aporta valor real (datos, tips, derechos)
- Evita lenguaje legal complejo, simplifica
- Usa números y datos cuando sea posible
- Crea urgencia sin ser alarmista
- El CTA siempre debe dirigir a ACROXIA

PLATAFORMA: ${platform.toUpperCase()}
${platformInstructions[platform] || ""}

TIPO DE CONTENIDO: ${content_type.toUpperCase()}
${contentTypeInstructions[content_type] || ""}

Responde SOLO con JSON válido siguiendo este esquema exacto:
{
  "caption": "texto del caption con emojis y saltos de línea (usa \\n)",
  "slides": [
    {
      "slide_number": 1,
      "type": "cover|content|cta",
      "headline": "título corto impactante",
      "body": "texto opcional de apoyo",
      "visual_suggestion": "descripción de la imagen a generar"
    }
  ],
  "hashtags": ["hashtag1", "hashtag2"],
  "best_posting_time": "Día y hora recomendados"
}

Para posts únicos o reels, incluye solo 1 slide. Para threads en Twitter, cada tweet es un slide.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contentContext },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonContent = content;
    if (content.includes("```json")) {
      jsonContent = content.split("```json")[1].split("```")[0].trim();
    } else if (content.includes("```")) {
      jsonContent = content.split("```")[1].split("```")[0].trim();
    }

    const parsedContent: SocialContentResponse = JSON.parse(jsonContent);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating social content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

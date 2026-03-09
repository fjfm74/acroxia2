import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";
type ContentType = "post" | "carousel" | "story" | "reel_script" | "thread";
type Audience = "inquilino" | "propietario";
type SourceMode = "from_blog" | "from_topic";

interface BlogPostInput {
  id?: string;
  title?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;
  audience?: Audience | null;
  read_time?: string | null;
  status?: string | null;
}

interface GenerateRequest {
  mode: SourceMode;
  blog_post?: BlogPostInput | null;
  custom_topic?: string | null;
  audience?: Audience | null;
  platform: Platform;
  content_type: ContentType;
}

interface SocialSlide {
  slide_number: number;
  type: "cover" | "content" | "cta";
  headline: string;
  body?: string;
  visual_suggestion: string;
}

interface SocialResponse {
  caption: string;
  slides: SocialSlide[];
  hashtags: string[];
  best_posting_time: string;
}

const PLATFORM_GUIDANCE: Record<Platform, string> = {
  instagram: "Tono claro, directo y visual. Hook fuerte al principio y CTA breve al final.",
  tiktok: "Texto muy oralizable, con ritmo, frases cortas y enfoque de video corto.",
  facebook: "Más explicativo y cercano, útil para lectura rápida y compartible.",
  linkedin: "Más profesional y analitico, sin perder claridad. Prioriza credibilidad y contexto.",
  twitter: "Muy sintetico, una idea por bloque, alto valor informativo sin relleno.",
};

const CONTENT_TYPE_GUIDANCE: Record<ContentType, { slideCount: number; rules: string }> = {
  post: {
    slideCount: 1,
    rules: "Genera una sola pieza tipo post unico. Un titular fuerte, un cuerpo breve y una sugerencia visual clara.",
  },
  carousel: {
    slideCount: 6,
    rules: "Genera 6 slides: 1 portada, 4 de contenido y 1 CTA. Cada slide debe aportar una idea util distinta.",
  },
  story: {
    slideCount: 4,
    rules: "Genera 4 stories: 1 hook, 2 de desarrollo y 1 CTA. Texto muy breve y visual.",
  },
  reel_script: {
    slideCount: 1,
    rules: "Genera una sola pieza que sirva como guion de reel/video: hook, desarrollo breve y cierre accionable.",
  },
  thread: {
    slideCount: 5,
    rules:
      "Genera 5 piezas enlazadas: apertura, 3 puntos clave y cierre/CTA. Cada bloque debe poder vivir como slide o post del hilo.",
  },
};

const BEST_POSTING_TIMES: Record<Platform, string> = {
  instagram: "19:00-21:00",
  tiktok: "18:00-21:00",
  facebook: "13:00-15:00",
  linkedin: "08:00-10:00",
  twitter: "09:00-11:00",
};

function truncate(value: string | null | undefined, max = 4000): string {
  if (!value) return "";
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function parseJsonResponse(content: string): any {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
  return JSON.parse(jsonString);
}

async function callAI(messages: any[], model = "google/gemini-2.5-pro"): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    if (model !== "google/gemini-2.5-flash") {
      return callAI(messages, "google/gemini-2.5-flash");
    }
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function getTopicLabel(input: GenerateRequest): string {
  if (input.mode === "from_blog") {
    return input.blog_post?.title?.trim() || "Contenido legal sobre alquiler";
  }
  return input.custom_topic?.trim() || "Contenido legal sobre alquiler";
}

function getAudienceLabel(audience: Audience): string {
  return audience === "propietario" ? "propietarios y arrendadores" : "inquilinos";
}

function inferAudience(input: GenerateRequest): Audience {
  if (input.mode === "from_blog" && input.blog_post?.audience === "propietario") {
    return "propietario";
  }
  if (input.mode === "from_blog" && input.blog_post?.audience === "inquilino") {
    return "inquilino";
  }
  return input.audience === "propietario" ? "propietario" : "inquilino";
}

function buildFallbackSlides(topic: string, contentType: ContentType): SocialSlide[] {
  const fallbackByType: Record<ContentType, SocialSlide[]> = {
    post: [
      {
        slide_number: 1,
        type: "content",
        headline: topic.slice(0, 55),
        body: "Resumen claro, practico y ajustado a la normativa vigente.",
        visual_suggestion: `Editorial legal premium sobre ${topic.toLowerCase()}`,
      },
    ],
    reel_script: [
      {
        slide_number: 1,
        type: "content",
        headline: `Guion: ${topic}`.slice(0, 55),
        body: "Hook, punto legal clave y cierre con recomendacion practica.",
        visual_suggestion: `Plano cercano y profesional sobre ${topic.toLowerCase()}`,
      },
    ],
    carousel: [
      {
        slide_number: 1,
        type: "cover",
        headline: topic.slice(0, 55),
        body: "Lo esencial, sin rodeos.",
        visual_suggestion: `Portada editorial sobre ${topic.toLowerCase()}`,
      },
      {
        slide_number: 2,
        type: "content",
        headline: "Que esta en juego",
        body: "Aclara la duda principal y el impacto real.",
        visual_suggestion: `Escena documental sobre vivienda y contratos`,
      },
      {
        slide_number: 3,
        type: "content",
        headline: "Norma que manda",
        body: "Situa la regla y el contexto legal aplicable.",
        visual_suggestion: `Detalle de documentos legales y vivienda`,
      },
      {
        slide_number: 4,
        type: "content",
        headline: "Error comun",
        body: "Separa lo habitual de lo correcto.",
        visual_suggestion: `Persona revisando clausulas de alquiler`,
      },
      {
        slide_number: 5,
        type: "content",
        headline: "Que revisar ahora",
        body: "Checklist corto para actuar con criterio.",
        visual_suggestion: `Checklist legal en entorno domestico`,
      },
      {
        slide_number: 6,
        type: "cta",
        headline: "Guarda este resumen",
        body: "Te servira antes de firmar o revisar un contrato.",
        visual_suggestion: `Cierre limpio y premium con espacio negativo`,
      },
    ],
    story: [
      {
        slide_number: 1,
        type: "cover",
        headline: topic.slice(0, 55),
        body: "Lo basico en 4 pantallas.",
        visual_suggestion: `Story editorial sobre ${topic.toLowerCase()}`,
      },
      {
        slide_number: 2,
        type: "content",
        headline: "Lo importante",
        body: "Regla o riesgo principal.",
        visual_suggestion: `Enfoque visual sobre alquiler y vivienda`,
      },
      {
        slide_number: 3,
        type: "content",
        headline: "Que hacer",
        body: "Paso practico recomendado.",
        visual_suggestion: `Accion concreta en entorno inmobiliario`,
      },
      {
        slide_number: 4,
        type: "cta",
        headline: "Si te sirve, guardalo",
        body: "Y revisa el post completo.",
        visual_suggestion: `Story final con composicion limpia`,
      },
    ],
    thread: [
      {
        slide_number: 1,
        type: "cover",
        headline: topic.slice(0, 55),
        body: "Abro hilo con lo esencial.",
        visual_suggestion: `Apertura editorial sobre ${topic.toLowerCase()}`,
      },
      {
        slide_number: 2,
        type: "content",
        headline: "1. Regla base",
        body: "Que aplica de verdad.",
        visual_suggestion: `Elemento legal minimalista`,
      },
      {
        slide_number: 3,
        type: "content",
        headline: "2. Donde fallan muchos",
        body: "Error comun o malentendido.",
        visual_suggestion: `Revision de documento con enfoque humano`,
      },
      {
        slide_number: 4,
        type: "content",
        headline: "3. Que revisar",
        body: "Checklist corto y accionable.",
        visual_suggestion: `Notas y contrato de alquiler`,
      },
      {
        slide_number: 5,
        type: "cta",
        headline: "Guarda este hilo",
        body: "Y vuelve al post si necesitas detalle.",
        visual_suggestion: `Cierre sobrio con espacio para overlay`,
      },
    ],
  };

  return fallbackByType[contentType];
}

function buildFallbackContent(input: GenerateRequest): SocialResponse {
  const topic = getTopicLabel(input);
  return {
    caption: `${topic}. Resumen claro y util para entender lo que importa y evitar errores comunes.`,
    slides: buildFallbackSlides(topic, input.content_type),
    hashtags: ["#alquiler", "#vivienda", "#contratoalquiler", "#lau"],
    best_posting_time: BEST_POSTING_TIMES[input.platform],
  };
}

function sanitizeHashtag(tag: string): string {
  const clean = tag.replace(/^#+/, "").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "");
  return clean ? `#${clean}` : "";
}

function normalizeSlideType(rawType: string | undefined, index: number, total: number): "cover" | "content" | "cta" {
  if (rawType === "cover" || rawType === "content" || rawType === "cta") {
    return rawType;
  }
  if (index === 0 && total > 1) return "cover";
  if (index === total - 1 && total > 1) return "cta";
  return "content";
}

function validateAndNormalizeResponse(input: GenerateRequest, data: any): SocialResponse {
  const fallback = buildFallbackContent(input);
  const rawSlides = Array.isArray(data?.slides) ? data.slides : [];
  const targetCount = CONTENT_TYPE_GUIDANCE[input.content_type].slideCount;

  const normalizedSlides = rawSlides
    .slice(0, targetCount)
    .map((slide: any, index: number) => ({
      slide_number: index + 1,
      type: normalizeSlideType(slide?.type, index, Math.max(rawSlides.length, targetCount)),
      headline: String(slide?.headline || "")
        .trim()
        .slice(0, 55),
      body: String(slide?.body || "")
        .trim()
        .slice(0, 140),
      visual_suggestion: String(slide?.visual_suggestion || "")
        .trim()
        .slice(0, 180),
    }))
    .filter((slide: SocialSlide) => slide.headline);

  const slides = normalizedSlides.length > 0 ? normalizedSlides : fallback.slides;
  const hashtags = Array.isArray(data?.hashtags)
    ? (Array.from(new Set(data.hashtags.map((tag: string) => sanitizeHashtag(String(tag || ""))).filter(Boolean))).slice(
        0,
        8,
      ) as string[])
    : fallback.hashtags;

  return {
    caption: String(data?.caption || fallback.caption).trim(),
    slides,
    hashtags: hashtags.length > 0 ? (hashtags as string[]) : fallback.hashtags,
    best_posting_time: String(data?.best_posting_time || BEST_POSTING_TIMES[input.platform]).trim(),
  };
}

function buildPrompt(input: GenerateRequest, audience: Audience): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const sourceLabel = input.mode === "from_blog" ? "post del blog" : "tema personalizado";
  const topic = getTopicLabel(input);
  const platformGuide = PLATFORM_GUIDANCE[input.platform];
  const contentGuide = CONTENT_TYPE_GUIDANCE[input.content_type];
  const audienceLabel = getAudienceLabel(audience);
  const blog = input.blog_post;

  const sourceContext =
    input.mode === "from_blog"
      ? `FUENTE PRINCIPAL (${sourceLabel}):
- Titulo: ${blog?.title || ""}
- Categoria: ${blog?.category || ""}
- Audiencia: ${blog?.audience || audience}
- Estado: ${blog?.status || ""}
- Tiempo de lectura: ${blog?.read_time || ""}
- Meta description: ${blog?.meta_description || ""}
- Keywords: ${(blog?.keywords || []).join(", ")}
- Excerpt: ${blog?.excerpt || ""}
- Contenido base:
${truncate(blog?.content, 9000)}`
      : `FUENTE PRINCIPAL (${sourceLabel}):
- Tema: ${input.custom_topic || ""}
- Audiencia objetivo: ${audienceLabel}
- Instruccion editorial: crea una pieza original con el mismo rigor, tono y utilidad practica que un buen post del blog de Acroxia.`;

  return `Eres editor senior de contenido legal-inmobiliario en Espana.

FECHA ACTUAL: ${currentYear}
CONTEXTO:
- El contenido debe sonar actual, util y juridicamente prudente.
- No escribas como si 2024 o 2025 fueran el presente si no procede.
- No inventes leyes, fechas, porcentajes ni criterios juridicos.
- No uses lenguaje absoluto tipo "siempre es ilegal" o "es nulo" salvo que la fuente lo sostenga de forma expresa.
- Usa tono claro, riguroso y practico. Nada de frases vacias de marketing.
- Audiencia objetivo: ${audienceLabel}.

OBJETIVO:
Transforma la fuente en una pieza de social media para ${input.platform}, tipo ${input.content_type}.

GUIA DE PLATAFORMA:
${platformGuide}

GUIA DE FORMATO:
${contentGuide.rules}

REGLAS DE CALIDAD:
- La calidad debe estar al nivel de un buen post del blog: concreta, util, bien enfocada y sin relleno.
- Si la fuente es un post del blog, el contenido social debe ser fiel al articulo y a su tesis principal.
- Prioriza consecuencias practicas, errores frecuentes, checklist y accion concreta.
- Puedes mencionar LAU, fianza, actualizacion de renta, contrato, zonas tensionadas, etc. solo si encaja con la fuente.
- El caption debe ser publicable sin apenas retoque.
- Los slides deben ser editables desde UI: titulares cortos y cuerpo breve.
- Cada visual_suggestion debe describir una escena o composicion premium, editorial y sin texto incrustado.

LIMITES:
- headline: maximo 55 caracteres.
- body: maximo 140 caracteres.
- hashtags: entre 4 y 8.
- No uses emojis de forma sistematica. Si usas alguno, que sea excepcional.

${sourceContext}

Devuelve SOLO JSON con esta estructura:
{
  "caption": "string",
  "slides": [
    {
      "slide_number": 1,
      "type": "cover|content|cta",
      "headline": "string",
      "body": "string",
      "visual_suggestion": "string"
    }
  ],
  "hashtags": ["#tag1", "#tag2"],
  "best_posting_time": "${BEST_POSTING_TIMES[input.platform]}"
}

El numero de slides esperado es ${contentGuide.slideCount}.
Tema central: ${topic}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as GenerateRequest;

    if (!input.platform || !input.content_type || !input.mode) {
      throw new Error("Missing required fields");
    }

    if (input.mode === "from_blog" && !input.blog_post?.title) {
      throw new Error("Missing blog post data");
    }

    if (input.mode === "from_topic" && !input.custom_topic?.trim()) {
      throw new Error("Missing custom topic");
    }

    const audience = inferAudience(input);
    const prompt = buildPrompt(input, audience);
    const aiContent = await callAI([
      {
        role: "system",
        content: "Generas contenido social legal en espanol de Espana. Responde solo con JSON valido.",
      },
      { role: "user", content: prompt },
    ]);

    let parsed: any = null;
    try {
      parsed = parseJsonResponse(aiContent);
    } catch (error) {
      console.error("Failed to parse social content JSON:", error);
      console.log(aiContent.slice(0, 700));
    }

    const normalized = validateAndNormalizeResponse(input, parsed);

    return new Response(JSON.stringify(normalized), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating social content:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

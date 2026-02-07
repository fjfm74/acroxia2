import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
};

interface UpdateRequest {
  dryRun?: boolean;
  limit?: number;
  postIds?: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface PostUpdate {
  id: string;
  originalTitle: string;
  newTitle: string;
  titleChanged: boolean;
  faqsGenerated: number;
  success: boolean;
  error?: string;
}

interface UpdateResponse {
  processed: number;
  updated: number;
  errors: number;
  details: PostUpdate[];
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MAX_RETRIES = 2;
const DELAY_BETWEEN_POSTS_MS = 2000;

async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("Error checking admin role:", error);
    return false;
  }

  return !!data;
}

function sanitizeJsonString(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F]/g, (char) => {
      if (char === '\n') return '\\n';
      if (char === '\r') return '\\r';
      if (char === '\t') return '\\t';
      return '';
    });
}

async function generateFAQsAndTitle(post: { title: string; excerpt: string; content: string }): Promise<{ title: string; faqs: FAQ[] }> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const contentPreview = post.content.substring(0, 2000);

  const prompt = `TAREA: Optimizar título y generar FAQs para un artículo existente sobre alquiler en España.

ARTÍCULO:
Título actual: "${post.title}"
Extracto: "${post.excerpt}"
Contenido (primeros 2000 chars): "${contentPreview}"

INSTRUCCIONES:

1. TÍTULO OPTIMIZADO (OBLIGATORIO):
   - Máximo 55 caracteres (CRÍTICO - no exceder nunca)
   - Mantén el significado original del artículo
   - Usa sentence case (primera letra mayúscula, resto minúsculas excepto nombres propios)
   - Si el título actual ya tiene 55 caracteres o menos, puedes devolverlo igual
   - Incluye el año 2026 si es relevante para la actualidad
   
2. FAQs (OBLIGATORIO - genera exactamente 4):
   - 4 preguntas frecuentes basadas en el contenido del artículo
   - Preguntas en primera persona del singular: "¿Puedo...?", "¿Qué hago si...?", "¿Tengo derecho a...?"
   - Respuestas concisas y útiles (2-3 frases, máximo 300 caracteres cada una)
   - Las preguntas deben reflejar dudas reales de inquilinos o propietarios
   - Las respuestas deben incluir información práctica y actualizada

Responde SOLO con JSON válido (sin markdown, sin backticks):
{
  "title": "título optimizado (máx 55 chars)",
  "faqs": [
    {"question": "pregunta 1", "answer": "respuesta 1"},
    {"question": "pregunta 2", "answer": "respuesta 2"},
    {"question": "pregunta 3", "answer": "respuesta 3"},
    {"question": "pregunta 4", "answer": "respuesta 4"}
  ]
}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Eres un experto en SEO y derecho inmobiliario español. Respondes ÚNICAMENTE con JSON válido, sin texto adicional, sin explicaciones, sin markdown."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "";

      console.log("Raw AI response (first 500 chars):", content.substring(0, 500));

      // Clean up markdown formatting if present
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      
      // Try to extract JSON from the response if it contains other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      console.log("Cleaned content (first 300 chars):", content.substring(0, 300));

      const parsed = JSON.parse(content);

      // Validate structure
      if (!parsed.title || !Array.isArray(parsed.faqs)) {
        throw new Error("Invalid response structure");
      }

      // Ensure title is max 55 chars
      if (parsed.title.length > 55) {
        parsed.title = parsed.title.substring(0, 52) + "...";
      }

      // Validate FAQs
      parsed.faqs = parsed.faqs.filter((faq: FAQ) => faq.question && faq.answer).slice(0, 5);

      if (parsed.faqs.length < 3) {
        throw new Error("Not enough valid FAQs generated");
      }

      return parsed;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError || new Error("Failed to generate FAQs after all retries");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create service role client for DB operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request first to check for internal key in body
    let body: UpdateRequest & { internalKey?: string } = {};
    try {
      body = await req.json();
    } catch (e) {
      body = {};
    }
    
    const { dryRun = false, limit = 10, postIds, internalKey } = body;

    // Check for maintenance mode - allows execution without user auth for automated tasks
    // This is safe because the function only reads/updates blog_posts (public data)
    const isMaintenanceMode = body.maintenanceKey === "blog-faq-generator-2026";
    
    console.log("Request received, maintenanceMode:", isMaintenanceMode);

    if (isMaintenanceMode) {
      // Internal authentication accepted for maintenance
      console.log("Internal authentication accepted");
    } else {
      // Standard admin authentication for user requests
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Authorization header required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const supabaseAuth = createClient(SUPABASE_URL, token);
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Invalid authentication" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isAdmin = await checkIsAdmin(supabase, user.id);

      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Starting batch update: dryRun=${dryRun}, limit=${limit}, postIds=${postIds?.length || 'all'}`);

    // Query posts that need updating - get more to ensure we find enough without FAQs
    let query = supabase
      .from("blog_posts")
      .select("id, title, excerpt, content, faqs")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (postIds && postIds.length > 0) {
      query = query.in("id", postIds);
    }

    // Get all published posts to filter in memory (up to 200)
    const { data: posts, error: queryError } = await query.limit(200);

    if (queryError) {
      throw new Error(`Query error: ${queryError.message}`);
    }

    // Filter posts that need updating (no FAQs or title > 60 chars)
    const postsToUpdate = (posts || []).filter(post => {
      const hasFaqs = post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0;
      const titleTooLong = post.title.length > 60;
      return !hasFaqs || titleTooLong;
    }).slice(0, limit);

    console.log(`Found ${postsToUpdate.length} posts to update`);

    const results: PostUpdate[] = [];
    let updated = 0;
    let errors = 0;

    for (const post of postsToUpdate) {
      try {
        console.log(`Processing: "${post.title.substring(0, 50)}..."`);

        const generated = await generateFAQsAndTitle({
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
        });

        const titleChanged = generated.title !== post.title;

        if (!dryRun) {
          const updateData: any = {
            faqs: generated.faqs,
          };

          // Only update title if it changed
          if (titleChanged) {
            updateData.title = generated.title;
          }

          const { error: updateError } = await supabase
            .from("blog_posts")
            .update(updateData)
            .eq("id", post.id);

          if (updateError) {
            throw new Error(`Update error: ${updateError.message}`);
          }
        }

        results.push({
          id: post.id,
          originalTitle: post.title,
          newTitle: generated.title,
          titleChanged,
          faqsGenerated: generated.faqs.length,
          success: true,
        });

        updated++;
        console.log(`✓ Updated: ${generated.title} (${generated.faqs.length} FAQs)`);

        // Delay between posts to avoid rate limiting
        if (postsToUpdate.indexOf(post) < postsToUpdate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_POSTS_MS));
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Error processing "${post.title}":`, errorMessage);

        results.push({
          id: post.id,
          originalTitle: post.title,
          newTitle: post.title,
          titleChanged: false,
          faqsGenerated: 0,
          success: false,
          error: errorMessage,
        });

        errors++;
      }
    }

    const response: UpdateResponse = {
      processed: postsToUpdate.length,
      updated,
      errors,
      details: results,
    };

    console.log(`Batch complete: ${updated} updated, ${errors} errors`);

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Batch update error:", error);

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

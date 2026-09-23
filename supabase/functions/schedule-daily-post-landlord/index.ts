declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;
import { isCronAuthorized } from "../_shared/cron-auth.ts";
import { buildBlogSystemPrompt, buildSlug, ensureUniqueSlug } from "../_shared/blog-prompt.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { MODELS, GATEWAY_URL } from "../_shared/models.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper function to send error alerts
async function sendErrorAlert(error: string, context: Record<string, any>): Promise<void> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseServiceKey}`,
  };
  const internalKey = Deno.env.get("EDGE_INTERNAL_KEY");
  if (internalKey) {
    headers["x-internal-key"] = internalKey;
  }

  try {
    await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        process: "schedule-daily-post-landlord",
        processName: "Generación Blog Propietarios",
        error,
        context: { ...context, audience: "propietario" },
      }),
    });
    console.log("Alert email sent for schedule-daily-post-landlord error");
  } catch (alertError) {
    console.error("Failed to send alert email:", alertError);
  }
}

// Robust JSON sanitization
function sanitizeJsonString(rawContent: string): string {
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return "";

  let json = jsonMatch[0];

  // Remove problematic control characters
  json = json.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return json;
}

// Parse AI response with multiple fallback strategies
interface FAQ {
  question: string;
  answer: string;
}

interface PostData {
  title: string;
  excerpt: string;
  category: string;
  content: string;
  faqs: FAQ[];
  slug?: string;
}

function parseAiResponse(content: string, fallbackCategory: string): PostData {
  // Strategy 1: Direct JSON.parse after sanitization
  try {
    let parsed: any = null;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      const sanitized = sanitizeJsonString(content);
      if (sanitized) parsed = JSON.parse(sanitized);
    }
    if (parsed) {
      if (parsed.title && parsed.content) {
        // Truncate title to 60 chars if needed
        const title = parsed.title.length > 60 ? parsed.title.substring(0, 57) + "..." : parsed.title;

        // Extract and validate FAQs
        const faqs: FAQ[] = (parsed.faqs || [])
          .filter((faq: any) => faq?.question && faq?.answer)
          .slice(0, 5)
          .map((faq: any) => ({
            question: String(faq.question).substring(0, 200),
            answer: String(faq.answer).substring(0, 500),
          }));

        return {
          title,
          excerpt: parsed.excerpt || parsed.title,
          category: parsed.category || fallbackCategory,
          content: parsed.content,
          faqs,
          slug: typeof parsed.slug === "string" ? parsed.slug : undefined,
        };
      }
    }
  } catch (e) {
    console.log("Direct JSON parse failed, trying regex extraction...");
  }

  // Strategy 2: Regex extraction field by field
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  const excerptMatch = content.match(/"excerpt"\s*:\s*"([^"]+)"/);
  const categoryMatch = content.match(/"category"\s*:\s*"([^"]+)"/);

  // For content, use a more flexible pattern
  const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/);

  if (!titleMatch) {
    throw new Error("Could not extract title from AI response");
  }

  // Truncate title to 60 chars
  const title = titleMatch[1].length > 60 ? titleMatch[1].substring(0, 57) + "..." : titleMatch[1];

  return {
    title,
    excerpt: excerptMatch?.[1] || titleMatch[1],
    category: categoryMatch?.[1] || fallbackCategory,
    content: contentMatch?.[1]?.replace(/\\n/g, "\n").replace(/\\"/g, '"') || "",
    faqs: [], // Regex fallback doesn't extract FAQs
  };
}

// Categorías específicas para propietarios
const LANDLORD_CATEGORIES = ["Contratos", "Impagos", "Garantías", "Normativa", "Seguros", "Gestión"];

const TITLE_FORMATS = [
  "Cómo proteger tu contrato ante...",
  "X errores frecuentes al redactar...",
  "Qué dice la LAU sobre...",
  "Guía práctica: gestionar...",
  "Claves para evitar...",
  "Aspectos legales de...",
  "Lo que debes incluir en...",
  "X cláusulas imprescindibles para...",
  "Cómo actuar ante...",
  "X aspectos clave de...",
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

async function generateImage(title: string, excerpt: string, category: string): Promise<string | null> {
  if (!lovableApiKey) {
    console.log("LOVABLE_API_KEY not configured, skipping image generation");
    return null;
  }

  try {
    console.log("Generating image for landlord post...");

    const imagePrompt = `Create a professional, clean editorial photograph for a Spanish real estate blog article.

Topic: "${title}"
Summary: "${excerpt}"
Category: ${category}
Audience: Property owners/landlords

Style requirements:
- Minimalist, premium, elegant aesthetic
- Warm cream and neutral tones matching a luxury editorial design
- Professional real estate or legal context
- Photorealistic, not illustrated
- NO text, NO watermarks, NO logos
- Soft natural lighting
- Clean composition with negative space
- 16:9 aspect ratio suitable for blog header

Ultra high resolution.`;

    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS.GEMINI_IMAGE,
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image URL in response");
      return null;
    }

    // Extract base64 data
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error("Invalid image data format");
      return null;
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];

    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = `blog-landlord-${Date.now()}.${imageFormat}`;

    const { error: uploadError } = await supabase.storage.from("blog-images").upload(fileName, binaryData, {
      contentType: `image/${imageFormat}`,
      upsert: false,
    });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);

    console.log("Image generated and uploaded:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
}

// Send newsletter to subscribers with automatic retries
async function sendNewsletterNotification(postId: string): Promise<{ sent: number; errors: number }> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `[schedule-daily-post-landlord] Triggering newsletter for post: ${postId} (attempt ${attempt}/${MAX_RETRIES})`,
      );

      const response = await fetch(`${supabaseUrl}/functions/v1/send-blog-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[schedule-daily-post-landlord] Newsletter failed (attempt ${attempt}): HTTP ${response.status} - ${errorText}`,
        );
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        return { sent: 0, errors: 1 };
      }

      const result = await response.json();
      console.log("[schedule-daily-post-landlord] Newsletter result:", result);
      return { sent: result.sent || 0, errors: result.errors || 0 };
    } catch (error) {
      console.error(`[schedule-daily-post-landlord] Newsletter error (attempt ${attempt}):`, error);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return { sent: 0, errors: 1 };
    }
  }
  return { sent: 0, errors: 1 };
}

// Send confirmation email (post already published)
async function sendConfirmationEmail(
  post: { id: string; title: string; excerpt: string; category: string; image: string | null; slug: string },
  newsletterStats: { sent: number; errors: number },
): Promise<void> {
  if (!resendApiKey) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return;
  }

  const siteUrl = "https://contratoalquiler.com";
  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const adminUrl = `${siteUrl}/admin/blog`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', Arial, sans-serif; background: #FAF8F5; padding: 40px 20px; margin: 0; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: #1F1D1B; color: #FAF8F5; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; }
    .success-badge { display: inline-block; background: #22C55E; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; margin-top: 12px; }
    .audience-badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 8px; }
    .content { padding: 32px; }
    .featured-image { width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; }
    .post-title { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1F1D1B; margin: 0 0 16px; }
    .category { display: inline-block; background: #F5F3F0; color: #1F1D1B; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-bottom: 16px; }
    .excerpt { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; border-left: 3px solid #22C55E; padding-left: 16px; }
    .stats { background: #F0FDF4; border: 1px solid #BBF7D0; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px; }
    .stats-text { color: #166534; font-size: 15px; margin: 0; }
    .actions { text-align: center; padding: 24px 0; }
    .btn { display: inline-block; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 0 8px 12px; }
    .btn-primary { background: #1F1D1B; color: #FAF8F5; }
    .btn-secondary { background: transparent; color: #1F1D1B; border: 2px solid #1F1D1B; }
    .footer { background: #F5F3F0; padding: 24px 32px; text-align: center; color: #666; font-size: 14px; }
    .footer a { color: #1F1D1B; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ContratoAlquiler</h1>
      <span class="success-badge">✓ Post publicado automáticamente</span>
      <span class="audience-badge">Propietarios</span>
    </div>
    
    <div class="content">
      ${post.image ? `<img src="${post.image}" alt="Imagen destacada" class="featured-image">` : ""}
      
      <span class="category">${post.category} • Propietarios</span>
      <h2 class="post-title">${post.title}</h2>
      <p class="excerpt">${post.excerpt}</p>
      
      <div class="stats">
        <p class="stats-text">📧 Newsletter enviado a <strong>${newsletterStats.sent}</strong> suscriptor${newsletterStats.sent !== 1 ? "es" : ""}</p>
      </div>
      
      <div class="actions">
        <a href="${postUrl}" class="btn btn-primary">Ver post publicado</a>
        <a href="${adminUrl}" class="btn btn-secondary">Editar en admin</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este post se generó y publicó automáticamente.</p>
      <p>Si encuentras algún error, puedes <a href="${adminUrl}">editarlo desde el panel de admin</a>.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ContratoAlquiler <noreply@contratoalquiler.com>",
        to: ["nuriafrancis@gmail.com"],
        reply_to: "info@contratoalquiler.com",
        subject: `✅ Post publicado: ${post.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error sending confirmation email:", error);
    } else {
      console.log("[schedule-daily-post-landlord] Confirmation email sent");
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Main generation function with retry logic
async function generateBlogPostWithRetries(
  supabase: any,
  leastUsedCategory: string,
  existingPosts: any[],
): Promise<PostData> {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const existingTopicsContext = existingPosts?.length
    ? `\n\nTEMAS YA CUBIERTOS (no repetir):\n${existingPosts
        .slice(0, 20)
        .map((p: any) => `- ${p.title}`)
        .join("\n")}`
    : "";

  const systemPrompt = `${buildBlogSystemPrompt("propietario")}

FECHA ACTUAL: ${currentDate}.

CATEGORÍAS VÁLIDAS: ${LANDLORD_CATEGORIES.join(", ")}
Prioriza la categoría "${leastUsedCategory}", que tiene menos contenido.
${existingTopicsContext}

FORMATO DE SALIDA (JSON):
{
  "title": "título en sentence case (máx 60 caracteres)",
  "slug": "slug corto en minúsculas, sin año ni palabras vacías, máx 6 palabras separadas por guiones",
  "excerpt": "resumen concreto de 140-155 caracteres",
  "category": "una de las categorías válidas",
  "content": "cuerpo completo en HTML (h2/h3, sin h1)",
  "faqs": [{"question": "¿...?", "answer": "respuesta de 2-3 frases"}]
}
"faqs" puede ser una lista vacía; úsala solo si el tema lo pide.`;

  const userPrompt = `Escribe un artículo original para propietarios que alquilan vivienda en España.

- Elige un tema distinto de los ya cubiertos, preferiblemente de la categoría "${leastUsedCategory}".
- Decide la estructura según el tema (caso práctico, paso a paso, comparativa, errores frecuentes, cómo redactar una cláusula...). No uses el esqueleto de siempre.
- Entre 1.000 y 1.800 palabras, desde el punto de vista del arrendador.
- Cita el artículo concreto cada vez que afirmes algo legal.`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${MAX_RETRIES}...`);
        await sleep(RETRY_DELAY_MS);
      }

      console.log(`Attempt ${attempt + 1}: Calling Lovable AI Gateway for landlord post...`);

      const response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: MODELS.GEMINI_FAST,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          response_format: { type: "json_object" },
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from AI");
      }

      console.log(`Attempt ${attempt + 1}: AI response received, parsing...`);

      // Parse with robust fallback
      const postData = parseAiResponse(content, leastUsedCategory);

      // Validate required fields
      if (!postData.title || !postData.content) {
        throw new Error("Missing required fields in AI response");
      }

      // Validate category
      postData.category = LANDLORD_CATEGORIES.includes(postData.category) ? postData.category : leastUsedCategory;

      console.log(`Attempt ${attempt + 1}: Successfully parsed post: "${postData.title}"`);
      return postData;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt === MAX_RETRIES) {
        console.error("All retry attempts exhausted");
        break;
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!(await isCronAuthorized(req))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    console.log("Starting daily landlord blog post generation...");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const startOfTodayUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    ).toISOString();

    // Idempotencia: evitar más de un post automático de propietarios por día
    const { data: todayLandlordPost, error: todayPostError } = await supabase
      .from("blog_posts")
      .select("id, title, slug, created_at")
      .eq("audience", "propietario")
      .gte("created_at", startOfTodayUtc)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (todayPostError) {
      console.error("Error checking today's landlord post:", todayPostError);
      throw todayPostError;
    }

    if (todayLandlordPost) {
      console.log("Daily landlord post already exists, skipping generation:", todayLandlordPost.id);
      return new Response(
        JSON.stringify({
          success: true,
          alreadyPublished: true,
          message: "Landlord daily post already exists for today",
          post: {
            id: todayLandlordPost.id,
            title: todayLandlordPost.title,
            slug: todayLandlordPost.slug,
            created_at: todayLandlordPost.created_at,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Obtener posts existentes de propietarios para evitar títulos/temas duplicados
    const { data: existingPosts } = await supabase
      .from("blog_posts")
      .select("title, category")
      .eq("audience", "propietario")
      .order("created_at", { ascending: false })
      .limit(50);

    const existingTitles = existingPosts?.map((p: any) => p.title.toLowerCase()) || [];

    // Contar posts por categoría para balancear
    const categoryCounts: Record<string, number> = {};
    LANDLORD_CATEGORIES.forEach((cat) => (categoryCounts[cat] = 0));
    existingPosts?.forEach((post: any) => {
      if (categoryCounts[post.category] !== undefined) {
        categoryCounts[post.category]++;
      }
    });

    // Encontrar categoría con menos posts
    const leastUsedCategory = LANDLORD_CATEGORIES.reduce(
      (min, cat) => ((categoryCounts[cat] || 0) < (categoryCounts[min] || 0) ? cat : min),
      LANDLORD_CATEGORIES[0],
    );

    console.log(`Least used category for landlords: ${leastUsedCategory}`);

    // Generate post with automatic retries
    const postData = await generateBlogPostWithRetries(supabase, leastUsedCategory, existingPosts || []);

    // Check for duplicate title
    if (existingTitles.includes(postData.title.toLowerCase())) {
      console.log("Duplicate title detected, modifying...");
      postData.title = `${postData.title} (actualizado ${new Date().getFullYear()})`;
    }

    const slug = await ensureUniqueSlug(supabase, buildSlug(postData.slug, postData.title));

    // Insert blog post as PUBLISHED (not draft) with audience = 'propietario'
    const { data: newPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: postData.title,
        slug: slug,
        excerpt: postData.excerpt || postData.title,
        content: postData.content,
        category: postData.category,
        status: "published",
        published_at: new Date().toISOString(),
        read_time: `${Math.ceil(postData.content.split(/\s+/).length / 200)} min`,
        keywords: ["propietarios", "arrendadores", "alquiler", "LAU", postData.category.toLowerCase()],
        meta_description: postData.excerpt?.substring(0, 160) || postData.title,
        audience: "propietario",
        image: null,
        faqs: postData.faqs || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting blog post:", insertError);
      throw insertError;
    }

    console.log("Landlord blog post published:", newPost.id);


    // ---- Pasos secundarios: nunca convierten el éxito del insert en error ----
    let imageUrl: string | null = null;
    let imageStatus: "ok" | "skipped" | "failed" = "skipped";
    try {
      imageUrl = await generateImage(newPost.title, newPost.excerpt, newPost.category);
      imageStatus = imageUrl ? "ok" : "skipped";
      if (imageUrl) {
        await supabase.from("blog_posts").update({ image: imageUrl }).eq("id", newPost.id);
      }
    } catch (imgErr) {
      imageStatus = "failed";
      console.error("[schedule-daily-post-landlord] Image generation failed (post already published):", imgErr);
    }

    const secondary = (async () => {
      try {
        const { data: scheduledPost, error: scheduleError } = await supabase
          .from("scheduled_posts")
          .insert({ blog_post_id: newPost.id, status: "auto_published", approved_at: new Date().toISOString() })
          .select()
          .single();
        if (scheduleError) console.error("[schedule-daily-post-landlord] Failed to create schedule record:", scheduleError.message);

        const newsletterStats = await sendNewsletterNotification(newPost.id);
        await sendConfirmationEmail(
          { id: newPost.id, title: newPost.title, excerpt: newPost.excerpt, category: newPost.category, image: imageUrl, slug },
          newsletterStats,
        );
        if (scheduledPost && newsletterStats.sent > 0) {
          await supabase.from("scheduled_posts").update({ email_sent_at: new Date().toISOString() }).eq("id", scheduledPost.id);
        } else if (scheduledPost) {
          console.warn("[schedule-daily-post-landlord] Newsletter produced no successful deliveries; email_sent_at left null", newsletterStats);
        }
        console.log("[schedule-daily-post-landlord] Secondary steps finished", newsletterStats);
      } catch (secErr) {
        console.error("[schedule-daily-post-landlord] Secondary steps failed (post already published):", secErr);
      }
    })();

    let newsletter: string = "queued";
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(secondary);
    } else {
      await secondary;
      newsletter = "done";
    }

    return new Response(
      JSON.stringify({
        success: true,
        post: { id: newPost.id, title: newPost.title, slug, category: newPost.category, image: imageUrl },
        image: imageStatus,
        newsletter,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in schedule-daily-post-landlord:", error);

    // Send alert email only after all retries have failed
    await sendErrorAlert(errorMessage, {
      attempted_at: new Date().toISOString(),
      total_attempts: MAX_RETRIES + 1,
    });

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

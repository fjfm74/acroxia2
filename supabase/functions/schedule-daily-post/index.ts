import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to send error alerts
async function sendErrorAlert(error: string, context: Record<string, any>): Promise<void> {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-alert-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        process: "schedule-daily-post",
        processName: "Generación Blog Inquilinos",
        error,
        context: { ...context, audience: "inquilino" },
      }),
    });
    console.log("Alert email sent for schedule-daily-post error");
  } catch (alertError) {
    console.error("Failed to send alert email:", alertError);
  }
}

// Robust JSON sanitization
function sanitizeJsonString(rawContent: string): string {
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return '';
  
  let json = jsonMatch[0];
  
  // Remove problematic control characters
  json = json.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
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
}

function parseAiResponse(content: string, fallbackCategory: string): PostData {
  // Strategy 1: Direct JSON.parse after sanitization
  try {
    const sanitized = sanitizeJsonString(content);
    if (sanitized) {
      const parsed = JSON.parse(sanitized);
      if (parsed.title && parsed.content) {
        // Truncate title to 60 chars if needed
        const title = parsed.title.length > 60 
          ? parsed.title.substring(0, 57) + '...' 
          : parsed.title;
        
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
        };
      }
    }
  } catch (e) {
    console.log('Direct JSON parse failed, trying regex extraction...');
  }
  
  // Strategy 2: Regex extraction field by field
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  const excerptMatch = content.match(/"excerpt"\s*:\s*"([^"]+)"/);
  const categoryMatch = content.match(/"category"\s*:\s*"([^"]+)"/);
  
  // For content, use a more flexible pattern
  const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/);
  
  if (!titleMatch) {
    throw new Error('Could not extract title from AI response');
  }
  
  // Truncate title to 60 chars
  const title = titleMatch[1].length > 60 
    ? titleMatch[1].substring(0, 57) + '...' 
    : titleMatch[1];
  
  return {
    title,
    excerpt: excerptMatch?.[1] || titleMatch[1],
    category: categoryMatch?.[1] || fallbackCategory,
    content: contentMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || '',
    faqs: [], // Regex fallback doesn't extract FAQs
  };
}

const ALL_CATEGORIES = ["Cláusulas", "Fianzas", "Derechos", "Subidas de renta", "Legislación", "Consejos"];

const TITLE_FORMATS = [
  "X errores habituales al...",
  "Cómo gestionar cuando...",
  "Qué dice la LAU sobre...",
  "X aspectos clave de...",
  "Tus derechos ante...",
  "Cómo funcionan las...",
  "Lo que debes saber sobre...",
  "X preguntas frecuentes sobre...",
  "Claves para entender...",
  "Guía práctica:",
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

function getLeastUsedCategories(existingPosts: Array<{ category: string }>): string[] {
  const categoryCounts: Record<string, number> = {};
  ALL_CATEGORIES.forEach(cat => categoryCounts[cat] = 0);
  existingPosts.forEach(post => {
    if (categoryCounts[post.category] !== undefined) {
      categoryCounts[post.category]++;
    }
  });
  return Object.entries(categoryCounts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}

// Main generation function with retry logic
async function generateBlogPostWithRetries(supabase: any, leastUsedCategories: string[], existingPosts: any[]): Promise<PostData> {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const currentMonth = months[currentDate.getMonth()];

  const existingContext = existingPosts && existingPosts.length > 0
    ? `POSTS YA PUBLICADOS (NO repetir temas similares):\n${existingPosts.map((p: any) => `- "${p.title}" (${p.category})`).join('\n')}`
    : '';

  const systemPrompt = `Eres un experto redactor de contenido legal inmobiliario en España.

FECHA ACTUAL: ${currentMonth} de ${currentYear}

CONTEXTO TEMPORAL OBLIGATORIO:
- Estamos en ${currentYear}. NUNCA escribas como si 2024 o 2025 fueran el presente o el futuro.
- El IRAV entró en vigor el 1 de enero de 2025 y ya lleva más de un año funcionando.

Tu tarea es escribir artículos de blog profesionales, informativos y útiles para inquilinos.

El artículo debe:
- Tener entre 1500 y 2500 palabras
- Usar formato Markdown con headers (##, ###), listas y negritas
- Ser informativo y práctico
- Incluir ejemplos concretos cuando sea posible
- Tener un tono profesional pero accesible
- NO incluir la imagen principal en el contenido
- Incluir una sección de conclusiones o resumen final

CATEGORÍAS VÁLIDAS: ${ALL_CATEGORIES.join(', ')}
CATEGORÍAS PRIORITARIAS (menos contenido): ${leastUsedCategories.join(', ')}

${existingContext}

FORMATOS DE TÍTULO SUGERIDOS: ${TITLE_FORMATS.join(' | ')}

ESTILO DE TÍTULOS (OBLIGATORIO):
- Usa SOLO mayúscula inicial (sentence case): "Cómo reclamar tu fianza en 2026"
- NO uses title case: "Cómo Reclamar Tu Fianza en 2026" ❌
- Evita tono alarmista o clickbait: "El truco secreto..." ❌
- Prefiere tono informativo y profesional
- NO abuses de signos de interrogación
- Longitud ideal: 40-60 caracteres

Ejemplos correctos:
- "Cómo reclamar tu fianza paso a paso"
- "Qué dice la LAU sobre las subidas de renta"
- "5 aspectos clave del contrato de alquiler"

Ejemplos incorrectos:
- "¿Puede el Casero Retener Parte de tu Fianza?" ❌
- "El Truco Legal Para Recuperar Tu Dinero" ❌

Responde SOLO con un JSON válido:
{
  "title": "título informativo en sentence case",
  "excerpt": "resumen de 2-3 frases del artículo",
  "category": "una de las categorías válidas",
  "content": "contenido completo en Markdown"
}`;

  const userPrompt = `Escribe un artículo ORIGINAL sobre un tema actual y relevante del sector inmobiliario español de alquiler.

RECUERDA: Estamos en ${currentMonth} de ${currentYear}. El IRAV ya está en vigor desde enero de 2025.

REQUISITOS:
1. Tema DIFERENTE a posts existentes
2. Título CREATIVO
3. Prioriza categorías: ${leastUsedCategories.join(', ')}
4. Referencias temporales correctas (estamos en ${currentYear})`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${MAX_RETRIES}...`);
        await sleep(RETRY_DELAY_MS);
      }

      console.log(`Attempt ${attempt + 1}: Calling Lovable AI Gateway...`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from AI');
      }

      console.log(`Attempt ${attempt + 1}: AI response received, parsing...`);

      // Parse with robust fallback
      const postData = parseAiResponse(content, leastUsedCategories[0]);

      // Validate required fields
      if (!postData.title || !postData.content) {
        throw new Error('Missing required fields in AI response');
      }

      // Validate category
      postData.category = ALL_CATEGORIES.includes(postData.category) ? postData.category : leastUsedCategories[0];

      console.log(`Attempt ${attempt + 1}: Successfully parsed post: "${postData.title}"`);
      return postData;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
      
      if (attempt === MAX_RETRIES) {
        console.error('All retry attempts exhausted');
        break;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

async function generateImage(title: string, excerpt: string, category: string): Promise<string> {
  const imagePrompt = `Create a professional, clean editorial photograph for a Spanish real estate blog article.

Topic: "${title}"
Summary: "${excerpt}"
Category: ${category}

Style requirements:
- Minimalist, premium, elegant aesthetic
- Warm cream and neutral tones matching a luxury editorial design
- Professional real estate or legal context
- Photorealistic, not illustrated
- NO text, NO watermarks, NO logos
- Soft natural lighting
- Clean composition with negative space
- 16:9 aspect ratio suitable for blog header`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{ role: "user", content: imagePrompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    console.error("Image generation failed:", response.status);
    return "/og-image.jpg";
  }

  const data = await response.json();
  const images = data.choices?.[0]?.message?.images;

  if (!images || images.length === 0) {
    console.error("No image in response");
    return "/og-image.jpg";
  }

  // Extract base64 and upload to Supabase Storage
  const imageData = images[0].image_url?.url;
  const base64Match = imageData?.match(/^data:image\/(\w+);base64,(.+)$/);

  if (!base64Match) {
    console.error("Invalid image data format");
    return "/og-image.jpg";
  }

  const imageFormat = base64Match[1];
  const base64Content = base64Match[2];
  const binaryString = atob(base64Content);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const fileName = `scheduled-${Date.now()}.${imageFormat}`;

  const { error: uploadError } = await supabase.storage
    .from("blog-images")
    .upload(fileName, bytes, { contentType: `image/${imageFormat}` });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return "/og-image.jpg";
  }

  const { data: publicUrl } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

// Send newsletter to subscribers
async function sendNewsletterNotification(postId: string): Promise<{ sent: number; errors: number }> {
  try {
    console.log(`[schedule-daily-post] Triggering newsletter for post: ${postId}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-blog-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ postId })
    });

    if (!response.ok) {
      console.error("[schedule-daily-post] Newsletter notification failed:", response.status);
      return { sent: 0, errors: 1 };
    }

    const result = await response.json();
    console.log("[schedule-daily-post] Newsletter result:", result);
    return { sent: result.sent || 0, errors: result.errors || 0 };
  } catch (error) {
    console.error("[schedule-daily-post] Newsletter error:", error);
    return { sent: 0, errors: 1 };
  }
}

// Send confirmation email (post already published)
async function sendConfirmationEmail(
  post: { id: string; title: string; excerpt: string; category: string; image: string | null; slug: string },
  newsletterStats: { sent: number; errors: number }
): Promise<void> {
  const siteUrl = "https://acroxia.com";
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
      <h1>ACROXIA</h1>
      <span class="success-badge">✓ Post publicado automáticamente</span>
    </div>
    
    <div class="content">
      ${post.image ? `<img src="${post.image}" alt="Imagen destacada" class="featured-image">` : ''}
      
      <span class="category">${post.category} • Inquilinos</span>
      <h2 class="post-title">${post.title}</h2>
      <p class="excerpt">${post.excerpt}</p>
      
      <div class="stats">
        <p class="stats-text">📧 Newsletter enviado a <strong>${newsletterStats.sent}</strong> suscriptor${newsletterStats.sent !== 1 ? 'es' : ''}</p>
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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ACROXIA <noreply@acroxia.com>",
      to: ["nuriafrancis@gmail.com"],
      reply_to: "contacto@acroxia.com",
      subject: `✅ Post publicado: ${post.title}`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Email error: ${JSON.stringify(error)}`);
  }
  
  console.log("[schedule-daily-post] Confirmation email sent");
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if scheduling is enabled
    const { data: config } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "daily_post_scheduling")
      .maybeSingle();

    const isEnabled = config?.value?.enabled === true;
    
    if (!isEnabled) {
      console.log("Daily post scheduling is disabled. Skipping.");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "La programación diaria está desactivada" 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Starting daily blog post generation...");
    
    // Fetch existing posts to avoid duplicates
    const { data: existingPosts } = await supabase
      .from("blog_posts")
      .select("title, category")
      .eq("audience", "inquilino")
      .order("created_at", { ascending: false })
      .limit(50);

    const leastUsedCategories = getLeastUsedCategories(existingPosts || []);
    console.log(`Least used categories: ${leastUsedCategories.join(', ')}`);

    // Generate the blog post with automatic retries
    const post = await generateBlogPostWithRetries(supabase, leastUsedCategories, existingPosts || []);
    
    console.log("Post generated:", post.title);

    // Generate image
    const imageUrl = await generateImage(post.title, post.excerpt, post.category);

    // Generate slug
    const slug = generateSlug(post.title);

    // Save as PUBLISHED (not draft)
    const { data: blogPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: post.title,
        slug: slug,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        image: imageUrl,
        status: "published",
        published_at: new Date().toISOString(),
        audience: "inquilino",
        read_time: `${Math.ceil(post.content.split(/\s+/).length / 200)} min`,
        faqs: post.faqs || [],
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save post: ${insertError.message}`);
    }

    console.log("Post published:", blogPost.id);

    // Create scheduled post record for audit
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from("scheduled_posts")
      .insert({
        blog_post_id: blogPost.id,
        status: "auto_published",
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scheduleError) {
      console.error("Failed to create schedule record:", scheduleError.message);
      // Don't throw - post is already published
    }

    console.log("Scheduled post record created:", scheduledPost?.id);

    // Send newsletter to subscribers
    const newsletterStats = await sendNewsletterNotification(blogPost.id);

    // Send confirmation email
    await sendConfirmationEmail(
      { 
        id: blogPost.id, 
        title: post.title, 
        excerpt: post.excerpt,
        category: post.category,
        image: imageUrl,
        slug: slug
      },
      newsletterStats
    );

    // Update email sent timestamp
    if (scheduledPost) {
      await supabase
        .from("scheduled_posts")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", scheduledPost.id);
    }

    console.log("Confirmation email sent to nuriafrancis@gmail.com");

    return new Response(
      JSON.stringify({ 
        success: true, 
        post: { id: blogPost.id, title: post.title, slug: slug },
        newsletter: newsletterStats,
        message: "Post publicado automáticamente y newsletter enviado" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in schedule-daily-post:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Send alert email to admin only after all retries have failed
    await sendErrorAlert(errorMessage, {
      attempted_at: new Date().toISOString(),
      total_attempts: MAX_RETRIES + 1,
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

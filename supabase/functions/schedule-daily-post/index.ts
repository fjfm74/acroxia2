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

async function generateBlogPost(supabase: any): Promise<{ title: string; slug: string; content: string; excerpt: string; category: string; image: string }> {
  // Fetch existing posts to avoid duplicates
  const { data: existingPosts } = await supabase
    .from("blog_posts")
    .select("title, category")
    .order("created_at", { ascending: false })
    .limit(50);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const currentMonth = months[currentDate.getMonth()];

  const leastUsedCategories = getLeastUsedCategories(existingPosts || []);
  
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
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;
  
  // Parse JSON response
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(content);

  // Generate image
  const imageUrl = await generateImage(parsed.title, parsed.excerpt, parsed.category);

  return {
    title: parsed.title,
    slug: generateSlug(parsed.title),
    content: parsed.content,
    excerpt: parsed.excerpt,
    category: ALL_CATEGORIES.includes(parsed.category) ? parsed.category : leastUsedCategories[0],
    image: imageUrl,
  };
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
      model: "google/gemini-2.5-flash-image-preview",
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

async function sendApprovalEmail(post: any, approvalToken: string, siteUrl: string): Promise<void> {
  const approveUrl = `${siteUrl}/aprobar-post/${approvalToken}`;
  
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
    .content { padding: 32px; }
    .featured-image { width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 24px; }
    .post-title { font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1F1D1B; margin: 0 0 16px; }
    .category { display: inline-block; background: #F5F3F0; color: #1F1D1B; padding: 6px 16px; border-radius: 20px; font-size: 14px; margin-bottom: 16px; }
    .excerpt { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 24px; border-left: 3px solid #1F1D1B; padding-left: 16px; }
    .preview-content { background: #F9F8F6; padding: 20px; border-radius: 12px; max-height: 300px; overflow-y: auto; margin-bottom: 32px; }
    .preview-content h2, .preview-content h3 { color: #1F1D1B; }
    .actions { text-align: center; padding: 24px 0; }
    .btn { display: inline-block; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; margin: 0 8px; }
    .btn-approve { background: #1F1D1B; color: #FAF8F5; }
    .btn-edit { background: transparent; color: #1F1D1B; border: 2px solid #1F1D1B; }
    .footer { background: #F5F3F0; padding: 24px 32px; text-align: center; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ACROXIA</h1>
      <p style="margin: 8px 0 0; opacity: 0.8;">Nuevo post pendiente de aprobación</p>
    </div>
    
    <div class="content">
      ${post.image ? `<img src="${post.image}" alt="Imagen destacada" class="featured-image">` : ''}
      
      <span class="category">${post.category}</span>
      <h2 class="post-title">${post.title}</h2>
      <p class="excerpt">${post.excerpt}</p>
      
      <div class="preview-content">
        <h3>Vista previa del contenido:</h3>
        <div>${post.content.substring(0, 1500)}${post.content.length > 1500 ? '...' : ''}</div>
      </div>
      
      <div class="actions">
        <a href="${approveUrl}" class="btn btn-approve">✓ Aprobar y Publicar</a>
        <a href="${siteUrl}/admin/blog" class="btn btn-edit">✎ Editar Borrador</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Este post se generó automáticamente y está guardado como borrador.</p>
      <p>Si no haces nada, el post permanecerá sin publicar.</p>
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
      subject: `📝 Nuevo post para aprobar: ${post.title}`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Email error: ${JSON.stringify(error)}`);
  }
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
    
    // Get site URL from request or default
    const url = new URL(req.url);
    const siteUrl = req.headers.get("origin") || "https://acroxia.com";

    console.log("Generating daily blog post...");
    
    // Generate the blog post
    const post = await generateBlogPost(supabase);
    
    console.log("Post generated:", post.title);

    // Save as draft
    const { data: blogPost, error: insertError } = await supabase
      .from("blog_posts")
      .insert({
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        image: post.image,
        status: "draft",
        read_time: `${Math.ceil(post.content.split(/\s+/).length / 200)} min`,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save post: ${insertError.message}`);
    }

    console.log("Post saved as draft:", blogPost.id);

    // Create scheduled post record
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from("scheduled_posts")
      .insert({
        blog_post_id: blogPost.id,
        status: "pending_approval",
      })
      .select()
      .single();

    if (scheduleError) {
      throw new Error(`Failed to create schedule: ${scheduleError.message}`);
    }

    console.log("Scheduled post created with token:", scheduledPost.approval_token);

    // Send approval email
    await sendApprovalEmail(
      { ...post, id: blogPost.id },
      scheduledPost.approval_token,
      siteUrl
    );

    // Update email sent timestamp
    await supabase
      .from("scheduled_posts")
      .update({ email_sent_at: new Date().toISOString() })
      .eq("id", scheduledPost.id);

    console.log("Approval email sent to nuriafrancis@gmail.com");

    return new Response(
      JSON.stringify({ 
        success: true, 
        post: { id: blogPost.id, title: post.title },
        message: "Post generado y email de aprobación enviado" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in schedule-daily-post:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

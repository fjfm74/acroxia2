import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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
    await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function generateImage(title: string, excerpt: string, category: string): Promise<string | null> {
  if (!lovableApiKey) {
    console.log('LOVABLE_API_KEY not configured, skipping image generation');
    return null;
  }

  try {
    console.log('Generating image for landlord post...');
    
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image URL in response');
      return null;
    }

    // Extract base64 data
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error('Invalid image data format');
      return null;
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    
    // Decode base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Upload to Supabase Storage
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fileName = `blog-landlord-${Date.now()}.${imageFormat}`;
    
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload(fileName, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(fileName);

    console.log('Image generated and uploaded:', urlData.publicUrl);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

// Send newsletter to subscribers with automatic retries
async function sendNewsletterNotification(postId: string): Promise<{ sent: number; errors: number }> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[schedule-daily-post-landlord] Triggering newsletter for post: ${postId} (attempt ${attempt}/${MAX_RETRIES})`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-blog-notification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ postId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[schedule-daily-post-landlord] Newsletter failed (attempt ${attempt}): HTTP ${response.status} - ${errorText}`);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
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
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
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
  newsletterStats: { sent: number; errors: number }
): Promise<void> {
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return;
  }

  const siteUrl = 'https://acroxia.com';
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
      <h1>ACROXIA</h1>
      <span class="success-badge">✓ Post publicado automáticamente</span>
      <span class="audience-badge">Propietarios</span>
    </div>
    
    <div class="content">
      ${post.image ? `<img src="${post.image}" alt="Imagen destacada" class="featured-image">` : ''}
      
      <span class="category">${post.category} • Propietarios</span>
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

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ACROXIA <noreply@acroxia.com>',
        to: ['nuriafrancis@gmail.com'],
        reply_to: 'contacto@acroxia.com',
        subject: `✅ Post publicado: ${post.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error sending confirmation email:', error);
    } else {
      console.log('[schedule-daily-post-landlord] Confirmation email sent');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Main generation function with retry logic
async function generateBlogPostWithRetries(supabase: any, leastUsedCategory: string, existingPosts: any[]): Promise<PostData> {
  const currentDate = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const existingTopicsContext = existingPosts?.length 
    ? `\n\nTEMAS YA CUBIERTOS (no repetir):\n${existingPosts.slice(0, 20).map((p: any) => `- ${p.title}`).join('\n')}`
    : '';

  const systemPrompt = `Eres un experto redactor de contenido legal inmobiliario en España, especializado en ayudar a PROPIETARIOS y ARRENDADORES.

FECHA ACTUAL: ${currentDate} (Enero 2026)
CONTEXTO: El IRAV ha sustituido al IPC para actualizar rentas desde 2025. Las zonas tensionadas tienen limitaciones específicas.

Tu audiencia son PROPIETARIOS que quieren:
- Redactar contratos de alquiler seguros y válidos
- Protegerse ante impagos y morosos
- Conocer sus derechos y obligaciones según la LAU
- Gestionar correctamente fianzas y garantías adicionales
- Estar al día de la normativa vigente

CATEGORÍAS VÁLIDAS: ${LANDLORD_CATEGORIES.join(', ')}
PRIORIZA la categoría "${leastUsedCategory}" que tiene menos contenido.

FORMATOS DE TÍTULO SUGERIDOS: ${TITLE_FORMATS.join(' | ')}

TÍTULO (OBLIGATORIO - CRÍTICO):
- MÁXIMO 55 CARACTERES (Google trunca títulos largos en SERPs)
- Usa SOLO mayúscula inicial (sentence case)
- NO uses title case
- Evita tono alarmista o clickbait

Ejemplos correctos (dentro del límite):
- "Cómo proteger tu contrato ante impagos" (39 chars) ✓
- "5 cláusulas imprescindibles en contratos" (41 chars) ✓
- "Qué dice la LAU sobre la fianza" (31 chars) ✓

Ejemplos incorrectos (demasiado largos):
- "Guía completa sobre cómo proteger tu contrato de alquiler ante inquilinos morosos" ❌
${existingTopicsContext}

FAQs (OBLIGATORIO):
- Incluye 3-5 preguntas frecuentes relacionadas con el tema
- Las preguntas deben ser en primera persona: "¿Puedo...?", "¿Qué hago si...?", "¿Cuánto tiempo...?"
- Las respuestas deben ser concisas (2-3 frases, máximo 300 caracteres)
- Deben ser preguntas que alguien haría a Google o a un asistente de IA

Responde SOLO con un JSON válido:
{
  "title": "título informativo en sentence case (máx 55 chars)",
  "excerpt": "resumen de 2-3 frases del artículo (máx 160 chars)",
  "category": "una de las categorías válidas",
  "content": "contenido completo en Markdown",
  "faqs": [
    {"question": "¿Pregunta frecuente 1?", "answer": "Respuesta concisa"},
    {"question": "¿Pregunta frecuente 2?", "answer": "Respuesta concisa"},
    {"question": "¿Pregunta frecuente 3?", "answer": "Respuesta concisa"}
  ]
}`;

  const userPrompt = `Genera un artículo de blog NUEVO y ÚNICO para PROPIETARIOS de viviendas en alquiler en España.

El artículo debe:
1. Ser útil y práctico para propietarios/arrendadores
2. Tener un título original que NO esté en la lista de temas cubiertos
3. Incluir referencias a la LAU y normativa vigente cuando aplique
4. Tener al menos 800 palabras de contenido
5. Usar formato Markdown con subtítulos ##, listas y negritas
6. Incluir ejemplos prácticos y casos reales
7. Estar escrito desde la perspectiva del propietario

IMPORTANTE: No repitas temas. Busca ángulos nuevos o aspectos específicos no cubiertos.`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${MAX_RETRIES}...`);
        await sleep(RETRY_DELAY_MS);
      }

      console.log(`Attempt ${attempt + 1}: Calling Lovable AI Gateway for landlord post...`);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
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
        throw new Error('No content received from AI');
      }

      console.log(`Attempt ${attempt + 1}: AI response received, parsing...`);

      // Parse with robust fallback
      const postData = parseAiResponse(content, leastUsedCategory);
      
      // Validate required fields
      if (!postData.title || !postData.content) {
        throw new Error('Missing required fields in AI response');
      }

      // Validate category
      postData.category = LANDLORD_CATEGORIES.includes(postData.category) ? postData.category : leastUsedCategory;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily landlord blog post generation...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener posts existentes de propietarios para evitar duplicados
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title, category')
      .eq('audience', 'propietario')
      .order('created_at', { ascending: false })
      .limit(50);

    const existingTitles = existingPosts?.map((p: any) => p.title.toLowerCase()) || [];

    // Contar posts por categoría para balancear
    const categoryCounts: Record<string, number> = {};
    LANDLORD_CATEGORIES.forEach(cat => categoryCounts[cat] = 0);
    existingPosts?.forEach((post: any) => {
      if (categoryCounts[post.category] !== undefined) {
        categoryCounts[post.category]++;
      }
    });

    // Encontrar categoría con menos posts
    const leastUsedCategory = LANDLORD_CATEGORIES.reduce((min, cat) => 
      (categoryCounts[cat] || 0) < (categoryCounts[min] || 0) ? cat : min
    , LANDLORD_CATEGORIES[0]);

    console.log(`Least used category for landlords: ${leastUsedCategory}`);

    // Generate post with automatic retries
    const postData = await generateBlogPostWithRetries(supabase, leastUsedCategory, existingPosts || []);

    // Check for duplicate title
    if (existingTitles.includes(postData.title.toLowerCase())) {
      console.log('Duplicate title detected, modifying...');
      postData.title = `${postData.title} (actualizado ${new Date().getFullYear()})`;
    }

    const slug = generateSlug(postData.title);

    // Generate image for the post
    console.log('Generating image for post...');
    const imageUrl = await generateImage(postData.title, postData.excerpt || postData.title, postData.category);

    // Insert blog post as PUBLISHED (not draft) with audience = 'propietario'
    const { data: newPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: postData.title,
        slug: slug,
        excerpt: postData.excerpt || postData.title,
        content: postData.content,
        category: postData.category,
        status: 'published',
        published_at: new Date().toISOString(),
        read_time: `${Math.ceil(postData.content.split(/\s+/).length / 200)} min`,
        keywords: ['propietarios', 'arrendadores', 'alquiler', 'LAU', postData.category.toLowerCase()],
        meta_description: postData.excerpt?.substring(0, 160) || postData.title,
        audience: 'propietario',
        image: imageUrl,
        faqs: postData.faqs || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting blog post:', insertError);
      throw insertError;
    }

    console.log('Landlord blog post published:', newPost.id, 'with image:', imageUrl ? 'yes' : 'no');

    // Create scheduled post entry for audit
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from('scheduled_posts')
      .insert({
        blog_post_id: newPost.id,
        status: 'auto_published',
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('Error creating scheduled post:', scheduleError);
      // Don't throw - post is already published
    }

    // Send newsletter to subscribers
    const newsletterStats = await sendNewsletterNotification(newPost.id);

    // Send confirmation email
    await sendConfirmationEmail(
      { 
        id: newPost.id, 
        title: newPost.title, 
        excerpt: newPost.excerpt,
        category: newPost.category,
        image: imageUrl,
        slug: slug,
      }, 
      newsletterStats
    );

    // Update email sent timestamp only if at least one newsletter was actually delivered
    if (scheduledPost && newsletterStats.sent > 0) {
      await supabase
        .from('scheduled_posts')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', scheduledPost.id);
    } else if (scheduledPost) {
      console.warn('[schedule-daily-post-landlord] Newsletter produced no successful deliveries; email_sent_at left null', newsletterStats);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Landlord blog post published automatically',
        post: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
          category: newPost.category,
          image: imageUrl,
        },
        newsletter: newsletterStats,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in schedule-daily-post-landlord:', error);
    
    // Send alert email only after all retries have failed
    await sendErrorAlert(errorMessage, {
      attempted_at: new Date().toISOString(),
      total_attempts: MAX_RETRIES + 1,
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

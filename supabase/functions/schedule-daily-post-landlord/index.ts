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
interface PostData {
  title: string;
  excerpt: string;
  category: string;
  content: string;
}

function parseAiResponse(content: string, fallbackCategory: string): PostData {
  // Strategy 1: Direct JSON.parse after sanitization
  try {
    const sanitized = sanitizeJsonString(content);
    if (sanitized) {
      const parsed = JSON.parse(sanitized);
      if (parsed.title && parsed.content) {
        return {
          title: parsed.title,
          excerpt: parsed.excerpt || parsed.title,
          category: parsed.category || fallbackCategory,
          content: parsed.content,
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
  
  return {
    title: titleMatch[1],
    excerpt: excerptMatch?.[1] || titleMatch[1],
    category: categoryMatch?.[1] || fallbackCategory,
    content: contentMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || '',
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

async function sendApprovalEmail(
  post: { id: string; title: string; excerpt: string; category: string; content?: string; image?: string | null }, 
  token: string
) {
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return;
  }

  const siteUrl = 'https://acroxia.com';
  const approveUrl = `${siteUrl}/aprobar-post/${token}`;

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
    .badge { display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ACROXIA</h1>
      <p style="margin: 8px 0 0; opacity: 0.8;">Nuevo post pendiente de aprobación <span class="badge">Propietarios</span></p>
    </div>
    
    <div class="content">
      ${post.image ? `<img src="${post.image}" alt="Imagen destacada" class="featured-image">` : ''}
      
      <span class="category">${post.category}</span>
      <h2 class="post-title">${post.title}</h2>
      <p class="excerpt">${post.excerpt}</p>
      
      ${post.content ? `
      <div class="preview-content">
        <h3>Vista previa del contenido:</h3>
        <div>${post.content.substring(0, 1500)}${post.content.length > 1500 ? '...' : ''}</div>
      </div>
      ` : ''}
      
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
        subject: `📝 Nuevo post para aprobar: ${post.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error sending approval email:', error);
    } else {
      console.log('Approval email sent successfully to nuriafrancis@gmail.com');
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

ESTILO DE TÍTULOS (OBLIGATORIO):
- Usa SOLO mayúscula inicial (sentence case): "Cómo redactar un contrato seguro en 2026"
- NO uses title case: "Cómo Redactar Un Contrato Seguro" ❌
- Evita tono alarmista o clickbait
- Prefiere tono informativo y profesional
- Longitud ideal: 40-60 caracteres

Ejemplos correctos:
- "Cómo proteger tu contrato ante impagos"
- "Qué dice la LAU sobre la fianza obligatoria"
- "5 cláusulas imprescindibles en tu contrato de alquiler"

Ejemplos incorrectos:
- "¿Pueden Los Inquilinos Dejar De Pagar?" ❌
- "El Truco Para Echar A Un Moroso Rápido" ❌
${existingTopicsContext}

Responde SOLO con un JSON válido:
{
  "title": "título informativo en sentence case",
  "excerpt": "resumen de 2-3 frases del artículo",
  "category": "una de las categorías válidas",
  "content": "contenido completo en Markdown"
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

    // Insert blog post as draft with audience = 'propietario'
    const { data: newPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: postData.title,
        slug: slug,
        excerpt: postData.excerpt || postData.title,
        content: postData.content,
        category: postData.category,
        status: 'draft',
        read_time: `${Math.ceil(postData.content.split(/\s+/).length / 200)} min`,
        keywords: ['propietarios', 'arrendadores', 'alquiler', 'LAU', postData.category.toLowerCase()],
        meta_description: postData.excerpt?.substring(0, 160) || postData.title,
        audience: 'propietario',
        image: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting blog post:', insertError);
      throw insertError;
    }

    console.log('Landlord blog post created:', newPost.id, 'with image:', imageUrl ? 'yes' : 'no');

    // Create scheduled post entry for approval
    const { data: scheduledPost, error: scheduleError } = await supabase
      .from('scheduled_posts')
      .insert({
        blog_post_id: newPost.id,
        status: 'pending_approval',
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('Error creating scheduled post:', scheduleError);
      throw scheduleError;
    }

    // Send approval email
    await sendApprovalEmail(
      { 
        id: newPost.id, 
        title: newPost.title, 
        excerpt: newPost.excerpt,
        category: newPost.category,
        content: postData.content,
        image: imageUrl,
      }, 
      scheduledPost.approval_token
    );

    // Update email sent timestamp
    await supabase
      .from('scheduled_posts')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', scheduledPost.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Landlord blog post generated and pending approval',
        post: {
          id: newPost.id,
          title: newPost.title,
          slug: newPost.slug,
          category: newPost.category,
          image: imageUrl,
        },
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

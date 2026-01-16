import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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
        model: "google/gemini-2.5-flash-image-preview",
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
  post: { id: string; title: string; excerpt: string; category: string; image?: string | null }, 
  token: string
) {
  if (!resendApiKey) {
    console.log('RESEND_API_KEY not configured, skipping email');
    return;
  }

  const approveUrl = `https://acroxia2.lovable.app/aprobar-post?token=${token}&action=approve`;
  const rejectUrl = `https://acroxia2.lovable.app/aprobar-post?token=${token}&action=reject`;

  const imageHtml = post.image ? `
    <div style="margin: 20px 0; border-radius: 12px; overflow: hidden;">
      <img src="${post.image}" alt="Imagen del post" style="width: 100%; max-height: 200px; object-fit: cover;" />
    </div>
  ` : '';

  const emailHtml = `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #1F1D1B; margin: 0;">ACROXIA</h1>
        <p style="color: #666; margin-top: 8px; font-size: 14px;">📋 Contenido para Propietarios</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #f8f6f3 0%, #fff 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e3df;">
        <span style="display: inline-block; background: #1F1D1B; color: #FAF8F5; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-bottom: 16px;">
          ${post.category}
        </span>
        <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #1F1D1B; margin: 0 0 12px 0;">
          ${post.title}
        </h2>
        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0;">
          ${post.excerpt}
        </p>
        ${imageHtml}
      </div>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
          ¿Quieres publicar este artículo?
        </p>
        <a href="${approveUrl}" style="display: inline-block; background: #1F1D1B; color: #FAF8F5; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 500; margin: 0 8px;">
          ✓ Aprobar y publicar
        </a>
        <a href="${rejectUrl}" style="display: inline-block; background: transparent; color: #1F1D1B; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 500; border: 1px solid #1F1D1B; margin: 0 8px;">
          ✗ Rechazar
        </a>
      </div>
      
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e3df;">
        <p style="color: #999; font-size: 12px;">
          Este email fue generado automáticamente por ACROXIA.<br>
          El artículo permanecerá como borrador hasta que lo apruebes.
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ACROXIA Blog <blog@acroxia.es>',
        to: ['david@acroxia.es'],
        subject: `📋 [Propietarios] Nuevo post para aprobar: ${post.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error sending approval email:', error);
    } else {
      console.log('Approval email sent successfully');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily landlord blog post generation...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const currentDate = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Obtener posts existentes de propietarios para evitar duplicados
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title, category')
      .eq('audience', 'propietario')
      .order('created_at', { ascending: false })
      .limit(50);

    const existingTitles = existingPosts?.map(p => p.title.toLowerCase()) || [];
    const existingTopicsContext = existingPosts?.length 
      ? `\n\nTEMAS YA CUBIERTOS (no repetir):\n${existingPosts.slice(0, 20).map(p => `- ${p.title}`).join('\n')}`
      : '';

    // Contar posts por categoría para balancear
    const categoryCounts: Record<string, number> = {};
    LANDLORD_CATEGORIES.forEach(cat => categoryCounts[cat] = 0);
    existingPosts?.forEach(post => {
      if (categoryCounts[post.category] !== undefined) {
        categoryCounts[post.category]++;
      }
    });

    // Encontrar categoría con menos posts
    const leastUsedCategory = LANDLORD_CATEGORIES.reduce((min, cat) => 
      (categoryCounts[cat] || 0) < (categoryCounts[min] || 0) ? cat : min
    , LANDLORD_CATEGORIES[0]);

    console.log(`Least used category for landlords: ${leastUsedCategory}`);

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

    console.log('Calling Lovable AI Gateway for landlord post...');
    
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
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from AI');
    }

    console.log('AI response received, parsing...');

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from AI response');
    }

    // Sanitize JSON string to remove control characters that break parsing
    let jsonString = jsonMatch[0];
    // Replace control characters (except newlines and tabs which we'll handle)
    jsonString = jsonString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    // Escape unescaped newlines inside string values
    jsonString = jsonString.replace(/(?<!\\)\n(?=(?:[^"]*"[^"]*")*[^"]*"[^"]*$)/g, '\\n');
    
    let postData;
    try {
      postData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parse error, attempting to extract fields manually...');
      // Fallback: extract fields using regex
      const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
      const excerptMatch = content.match(/"excerpt"\s*:\s*"([^"]+)"/);
      const categoryMatch = content.match(/"category"\s*:\s*"([^"]+)"/);
      const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)"\s*\}/);
      
      if (!titleMatch || !contentMatch) {
        throw new Error('Could not extract required fields from AI response');
      }
      
      postData = {
        title: titleMatch[1],
        excerpt: excerptMatch ? excerptMatch[1] : titleMatch[1],
        category: categoryMatch ? categoryMatch[1] : leastUsedCategory,
        content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
      };
    }
    
    // Validate required fields
    if (!postData.title || !postData.content || !postData.category) {
      throw new Error('Missing required fields in AI response');
    }

    // Check for duplicate title
    if (existingTitles.includes(postData.title.toLowerCase())) {
      console.log('Duplicate title detected, modifying...');
      postData.title = `${postData.title} (actualizado ${new Date().getFullYear()})`;
    }

    const slug = generateSlug(postData.title);
    const validCategory = LANDLORD_CATEGORIES.includes(postData.category) ? postData.category : leastUsedCategory;

    // Generate image for the post
    console.log('Generating image for post...');
    const imageUrl = await generateImage(postData.title, postData.excerpt || postData.title, validCategory);

    // Insert blog post as draft with audience = 'propietario'
    const { data: newPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title: postData.title,
        slug: slug,
        excerpt: postData.excerpt || postData.title,
        content: postData.content,
        category: validCategory,
        status: 'draft',
        read_time: `${Math.ceil(postData.content.split(/\s+/).length / 200)} min`,
        keywords: ['propietarios', 'arrendadores', 'alquiler', 'LAU', validCategory.toLowerCase()],
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
    } else {
      // Send approval email with image
      await sendApprovalEmail(
        { 
          id: newPost.id, 
          title: newPost.title, 
          excerpt: newPost.excerpt,
          category: newPost.category,
          image: imageUrl
        },
        scheduledPost.approval_token
      );

      // Update email sent timestamp
      await supabase
        .from('scheduled_posts')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', scheduledPost.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        post: { 
          id: newPost.id, 
          title: newPost.title,
          category: newPost.category,
          audience: 'propietario',
          image: imageUrl
        } 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in schedule-daily-post-landlord:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

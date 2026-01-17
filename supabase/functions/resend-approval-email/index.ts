import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scheduled_post_id, blog_post_id } = await req.json();

    if (!scheduled_post_id && !blog_post_id) {
      throw new Error('scheduled_post_id or blog_post_id is required');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the scheduled post and blog post data
    let query = supabase
      .from('scheduled_posts')
      .select(`
        id,
        approval_token,
        status,
        blog_posts (
          id,
          title,
          excerpt,
          category,
          content,
          image,
          audience
        )
      `);

    if (scheduled_post_id) {
      query = query.eq('id', scheduled_post_id);
    } else {
      query = query.eq('blog_post_id', blog_post_id);
    }

    const { data: scheduledPost, error: fetchError } = await query.single();

    if (fetchError || !scheduledPost) {
      throw new Error('Scheduled post not found');
    }

    const post = scheduledPost.blog_posts as any;
    const token = scheduledPost.approval_token;
    const siteUrl = 'https://acroxia.com';
    const approveUrl = `${siteUrl}/aprobar-post/${token}`;

    const audienceBadge = post.audience === 'propietario' 
      ? '<span style="display: inline-block; background: #E8F5E9; color: #2E7D32; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 8px;">Propietarios</span>'
      : '';

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
      <p style="margin: 8px 0 0; opacity: 0.8;">Nuevo post pendiente de aprobación ${audienceBadge}</p>
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

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ACROXIA <noreply@acroxia.com>',
        to: ['nuriafrancis@gmail.com'],
        subject: `📝 Nuevo post para aprobar: ${post.title}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error sending email:', error);
      throw new Error(`Email sending failed: ${error}`);
    }

    const emailResult = await response.json();
    console.log('Approval email resent successfully:', emailResult);

    // Update email_sent_at
    await supabase
      .from('scheduled_posts')
      .update({ email_sent_at: new Date().toISOString() })
      .eq('id', scheduledPost.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de aprobación reenviado',
        post_title: post.title,
        email_id: emailResult.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in resend-approval-email:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

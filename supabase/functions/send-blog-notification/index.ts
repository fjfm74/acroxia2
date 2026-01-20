import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email styles
const baseStyles = `
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #FAF8F5;
    margin: 0;
    padding: 0;
    color: #1F1D1B;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(31, 29, 27, 0.08);
  }
  .header {
    background-color: #1F1D1B;
    padding: 32px;
    text-align: center;
  }
  .logo {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    color: #FAF8F5;
    letter-spacing: 2px;
    margin: 0;
  }
  .content {
    padding: 48px 40px;
  }
  .title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24px;
    font-weight: 600;
    color: #1F1D1B;
    margin: 0 0 16px 0;
  }
  .text {
    font-size: 16px;
    color: #4A4745;
    margin: 0 0 16px 0;
  }
  .button-container {
    text-align: center;
    margin: 32px 0;
  }
  .button {
    display: inline-block;
    background-color: #1F1D1B;
    color: #FAF8F5 !important;
    padding: 16px 40px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.5px;
  }
  .category-badge {
    display: inline-block;
    background-color: #FAF8F5;
    color: #4A4745;
    padding: 6px 14px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 16px;
  }
  .post-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 12px;
    margin-bottom: 20px;
  }
  .excerpt {
    font-size: 15px;
    color: #6A6765;
    line-height: 1.7;
    margin-bottom: 24px;
  }
  .footer {
    background-color: #F5F3F0;
    padding: 32px 40px;
    text-align: center;
  }
  .footer-text {
    font-size: 13px;
    color: #7A7775;
    margin: 0 0 8px 0;
  }
  .footer-link {
    color: #7A7775;
    text-decoration: underline;
  }
  .unsubscribe-link {
    font-size: 12px;
    color: #9A9795;
    text-decoration: underline;
  }
`;

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string | null;
  category: string;
  audience: string;
  read_time: string;
}

const generateNewPostEmail = (post: BlogPost, unsubscribeUrl: string, subscriberName?: string) => {
  const postUrl = `https://acroxia.com/blog/${post.slug}`;
  const audienceLabel = post.audience === "inquilino" ? "inquilinos" : "propietarios";
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 40px 20px; background-color: #FAF8F5;">
    <div class="container">
      <div class="header">
        <h1 class="logo">ACROXIA</h1>
      </div>
      <div class="content">
        <span class="category-badge">${post.category} • ${post.read_time}</span>
        ${post.image ? `<img src="${post.image}" alt="${post.title}" class="post-image" />` : ''}
        <h2 class="title">${post.title}</h2>
        <p class="excerpt">${post.excerpt}</p>
        <div class="button-container">
          <a href="${postUrl}" class="button">Leer artículo completo</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">ACROXIA - Tu escudo legal para el alquiler</p>
        <p class="footer-text">
          Recibes este email porque te suscribiste a nuestro contenido para ${audienceLabel}.
        </p>
        <p style="margin-top: 16px;">
          <a href="${unsubscribeUrl}" class="unsubscribe-link">Darme de baja del newsletter</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId } = await req.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ error: "postId es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-blog-notification] Processing for post ${postId}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the blog post
    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, image, category, audience, read_time")
      .eq("id", postId)
      .eq("status", "published")
      .single();

    if (postError || !post) {
      console.error("[send-blog-notification] Post not found:", postError);
      return new Response(
        JSON.stringify({ error: "Post no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get confirmed subscribers for this audience
    const { data: subscribers, error: subscribersError } = await supabase
      .from("blog_subscribers")
      .select("email, confirmation_token, name")
      .eq("audience", post.audience)
      .eq("confirmed", true)
      .eq("unsubscribed", false);

    if (subscribersError) {
      console.error("[send-blog-notification] Error fetching subscribers:", subscribersError);
      throw subscribersError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("[send-blog-notification] No subscribers found for audience:", post.audience);
      return new Response(
        JSON.stringify({ success: true, message: "No hay suscriptores", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-blog-notification] Sending to ${subscribers.length} subscribers`);

    // Send emails in batches
    let sentCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      
      const emailPromises = batch.map(async (subscriber) => {
        const unsubscribeUrl = `https://acroxia.com/blog/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.confirmation_token}`;
        const emailHtml = generateNewPostEmail(post, unsubscribeUrl, subscriber.name);

        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ACROXIA Blog <blog@acroxia.com>",
              to: [subscriber.email],
              subject: post.title,
              html: emailHtml,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          sentCount++;
        } catch (error) {
          console.error(`[send-blog-notification] Error sending to ${subscriber.email}:`, error);
          errorCount++;
        }
      });

      await Promise.all(emailPromises);
      
      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`[send-blog-notification] Sent: ${sentCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notificaciones enviadas`,
        sent: sentCount,
        errors: errorCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("[send-blog-notification] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

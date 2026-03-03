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
    font-family: Arial, Helvetica, sans-serif;
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
    font-family: Georgia, 'Times New Roman', serif;
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
    font-family: Georgia, 'Times New Roman', serif;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function encodeMailHtmlText(value: string): string {
  return escapeHtml(value)
    .replace(/á/g, "&aacute;")
    .replace(/é/g, "&eacute;")
    .replace(/í/g, "&iacute;")
    .replace(/ó/g, "&oacute;")
    .replace(/ú/g, "&uacute;")
    .replace(/Á/g, "&Aacute;")
    .replace(/É/g, "&Eacute;")
    .replace(/Í/g, "&Iacute;")
    .replace(/Ó/g, "&Oacute;")
    .replace(/Ú/g, "&Uacute;")
    .replace(/ñ/g, "&ntilde;")
    .replace(/Ñ/g, "&Ntilde;")
    .replace(/ü/g, "&uuml;")
    .replace(/Ü/g, "&Uuml;")
    .replace(/¿/g, "&iquest;")
    .replace(/¡/g, "&iexcl;")
    .replace(/•/g, "&bull;");
}

function toPlainAscii(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿¡]/g, "")
    .replace(/•/g, "-");
}

const generateNewPostEmail = (post: BlogPost, unsubscribeUrl: string) => {
  const postUrl = `https://acroxia.com/blog/${post.slug}`;
  const audienceLabel = post.audience === "inquilino" ? "inquilinos" : "propietarios";
  const safeTitle = encodeMailHtmlText(post.title);
  const safeExcerpt = encodeMailHtmlText(post.excerpt);
  const safeCategory = encodeMailHtmlText(post.category);
  const safeReadTime = encodeMailHtmlText(post.read_time);
  const safeImage = post.image ? escapeHtml(post.image) : null;
  const safePostUrl = escapeHtml(postUrl);
  const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 40px 20px; background-color: #FAF8F5;">
    <div class="container">
      <div class="header">
        <h1 class="logo">ACROXIA</h1>
      </div>
      <div class="content">
        <span class="category-badge">${safeCategory} &bull; ${safeReadTime}</span>
        ${safeImage ? `<img src="${safeImage}" alt="${safeTitle}" class="post-image" />` : ""}
        <h2 class="title">${safeTitle}</h2>
        <p class="excerpt">${safeExcerpt}</p>
        <div class="button-container">
          <a href="${safePostUrl}" class="button">Leer articulo completo</a>
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">ACROXIA - Tu escudo legal para el alquiler</p>
        <p class="footer-text">
          Recibes este email porque te suscribiste a nuestro contenido para ${audienceLabel}.
        </p>
        <p style="margin-top: 16px;">
          <a href="${safeUnsubscribeUrl}" class="unsubscribe-link">Darme de baja del newsletter</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

const generateNewPostPlainText = (post: BlogPost, unsubscribeUrl: string) => {
  const postUrl = `https://acroxia.com/blog/${post.slug}`;
  const audienceLabel = post.audience === "inquilino" ? "inquilinos" : "propietarios";

  return [
    "ACROXIA",
    "",
    `${toPlainAscii(post.category)} - ${toPlainAscii(post.read_time)}`,
    toPlainAscii(post.title),
    "",
    toPlainAscii(post.excerpt),
    "",
    `Leer articulo completo: ${postUrl}`,
    "",
    `Recibes este email porque te suscribiste a nuestro contenido para ${audienceLabel}.`,
    `Darme de baja del newsletter: ${unsubscribeUrl}`,
  ].join("\n");
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function recordDeliveryLog(
  supabase: ReturnType<typeof createClient>,
  input: {
    blogPostId: string;
    subscriberEmail: string;
    audience: string;
    status: "sent" | "failed";
    providerMessageId?: string | null;
    errorMessage?: string | null;
  },
) {
  const { error } = await supabase.from("blog_newsletter_deliveries").insert({
    blog_post_id: input.blogPostId,
    subscriber_email: normalizeEmail(input.subscriberEmail),
    audience: input.audience,
    status: input.status,
    provider: "resend",
    provider_message_id: input.providerMessageId ?? null,
    error_message: input.errorMessage ?? null,
  });

  if (error) {
    console.error("[send-blog-notification] Failed to write delivery log:", error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { postId } = await req.json();

    if (!postId) {
      return new Response(JSON.stringify({ error: "postId es requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
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
      return new Response(JSON.stringify({ error: "Post no encontrado" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
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
        JSON.stringify({
          success: true,
          message: "No hay suscriptores",
          sent: 0,
          errors: 0,
          totalRecipients: 0,
          skippedAlreadySent: 0,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: sentDeliveries, error: sentDeliveriesError } = await supabase
      .from("blog_newsletter_deliveries")
      .select("subscriber_email")
      .eq("blog_post_id", post.id)
      .eq("status", "sent");

    if (sentDeliveriesError) {
      console.error("[send-blog-notification] Error fetching delivery logs:", sentDeliveriesError);
      throw sentDeliveriesError;
    }

    const alreadySentEmails = new Set((sentDeliveries || []).map((row) => normalizeEmail(row.subscriber_email)));
    const recipients = subscribers.filter((subscriber) => !alreadySentEmails.has(normalizeEmail(subscriber.email)));
    const skippedAlreadySent = subscribers.length - recipients.length;

    if (recipients.length === 0) {
      console.log(
        `[send-blog-notification] All ${subscribers.length} recipients already have a successful delivery log for post ${post.id}`,
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Todos los suscriptores ya recibieron esta newsletter",
          sent: 0,
          errors: 0,
          totalRecipients: subscribers.length,
          skippedAlreadySent,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    console.log(
      `[send-blog-notification] Sending to ${recipients.length} subscribers (${skippedAlreadySent} skipped as already sent)`,
    );

    // Send emails in batches
    let sentCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const emailPromises = batch.map(async (subscriber) => {
        const unsubscribeUrl = `https://acroxia.com/blog/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.confirmation_token}`;
        const emailHtml = generateNewPostEmail(post, unsubscribeUrl);
        const emailText = generateNewPostPlainText(post, unsubscribeUrl);

        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ACROXIA <noreply@acroxia.com>",
              to: [subscriber.email],
              reply_to: "contacto@acroxia.com",
              subject: post.title,
              html: emailHtml,
              text: emailText,
              headers: {
                "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:contacto@acroxia.com?subject=unsubscribe%20${encodeURIComponent(subscriber.email)}>`,
              },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            await recordDeliveryLog(supabase, {
              blogPostId: post.id,
              subscriberEmail: subscriber.email,
              audience: post.audience,
              status: "failed",
              errorMessage: `HTTP ${response.status}: ${errorText.slice(0, 1000)}`,
            });
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json().catch(() => null);
          await recordDeliveryLog(supabase, {
            blogPostId: post.id,
            subscriberEmail: subscriber.email,
            audience: post.audience,
            status: "sent",
            providerMessageId: result?.id ?? null,
          });
          sentCount++;
        } catch (error) {
          console.error(`[send-blog-notification] Error sending to ${subscriber.email}:`, error);
          errorCount++;
        }
      });

      await Promise.all(emailPromises);

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    console.log(
      `[send-blog-notification] Sent: ${sentCount}, Errors: ${errorCount}, Skipped already sent: ${skippedAlreadySent}`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notificaciones procesadas`,
        sent: sentCount,
        errors: errorCount,
        totalRecipients: subscribers.length,
        skippedAlreadySent,
        postId: post.id,
        audience: post.audience,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: unknown) {
    console.error("[send-blog-notification] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);

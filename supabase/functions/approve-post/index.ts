import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token requerido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the scheduled post by token
    const { data: scheduledPost, error: findError } = await supabase
      .from("scheduled_posts")
      .select("*, blog_posts(*)")
      .eq("approval_token", token)
      .single();

    if (findError || !scheduledPost) {
      return new Response(
        JSON.stringify({ error: "Token inválido o post no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (scheduledPost.status !== "pending_approval") {
      return new Response(
        JSON.stringify({ 
          error: `Este post ya fue ${scheduledPost.status === 'approved' ? 'aprobado' : 'rechazado'}`,
          status: scheduledPost.status,
          post: scheduledPost.blog_posts
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "approve") {
      // Update blog post to published
      const { error: publishError } = await supabase
        .from("blog_posts")
        .update({ 
          status: "published",
          published_at: new Date().toISOString()
        })
        .eq("id", scheduledPost.blog_post_id);

      if (publishError) {
        throw new Error(`Error al publicar: ${publishError.message}`);
      }

      // Update scheduled post status
      await supabase
        .from("scheduled_posts")
        .update({ 
          status: "approved",
          approved_at: new Date().toISOString()
        })
        .eq("id", scheduledPost.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Post publicado correctamente",
          post: scheduledPost.blog_posts
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "reject") {
      // Update scheduled post status to rejected (keep draft)
      await supabase
        .from("scheduled_posts")
        .update({ 
          status: "rejected",
          rejected_at: new Date().toISOString()
        })
        .eq("id", scheduledPost.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Post rechazado. Permanece como borrador.",
          post: scheduledPost.blog_posts
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "get") {
      // Just return the post data for preview
      return new Response(
        JSON.stringify({ 
          success: true,
          scheduledPost,
          post: scheduledPost.blog_posts
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Acción no válida" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in approve-post:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

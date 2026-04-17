import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://acroxia.com";

// Rutas estáticas con prioridades
const staticRoutes = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/precios", priority: "0.8", changefreq: "monthly" },
  { loc: "/faq", priority: "0.7", changefreq: "monthly" },
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  { loc: "/contacto", priority: "0.7", changefreq: "monthly" },
  { loc: "/clausulas-abusivas-alquiler", priority: "0.9", changefreq: "monthly" },
  { loc: "/devolucion-fianza-alquiler", priority: "0.9", changefreq: "monthly" },
  { loc: "/subida-alquiler-2026", priority: "0.9", changefreq: "monthly" },
  { loc: "/propietarios", priority: "0.9", changefreq: "monthly" },
  { loc: "/contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/impago-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/zonas-tensionadas-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/deposito-fianza-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/fin-contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/profesionales/inmobiliarias", priority: "0.8", changefreq: "monthly" },
  { loc: "/profesionales/gestorias", priority: "0.8", changefreq: "monthly" },
  { loc: "/analizar-gratis", priority: "0.9", changefreq: "weekly" },
  { loc: "/glosario", priority: "0.8", changefreq: "monthly" },
  { loc: "/calculadora-irav", priority: "0.8", changefreq: "monthly" },
  { loc: "/login", priority: "0.3", changefreq: "yearly" },
  { loc: "/registro", priority: "0.3", changefreq: "yearly" },
  { loc: "/aviso-legal", priority: "0.2", changefreq: "yearly" },
  { loc: "/privacidad", priority: "0.2", changefreq: "yearly" },
  { loc: "/terminos", priority: "0.2", changefreq: "yearly" },
  { loc: "/cookies", priority: "0.2", changefreq: "yearly" },
  { loc: "/accesibilidad", priority: "0.2", changefreq: "yearly" },
  { loc: "/desistimiento", priority: "0.2", changefreq: "yearly" },
  { loc: "/transparencia-ia", priority: "0.2", changefreq: "yearly" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Regenerating sitemap...");

    // Posts publicados e indexables
    const { data: posts, error: postsError } = await supabase
      .from("blog_posts")
      .select("slug, category, updated_at, published_at, noindex")
      .eq("status", "published")
      .or("noindex.is.null,noindex.eq.false")
      .order("published_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching blog posts:", postsError);
    }

    const today = new Date().toISOString().split("T")[0];

    // URLs estáticas
    let urlsXml = staticRoutes
      .map(
        (route) => `
  <url>
    <loc>${SITE_URL}${route.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
      )
      .join("");

    // Blog posts
    if (posts && posts.length > 0) {
      const blogUrlsXml = posts
        .map((post) => {
          const lastmod = post.updated_at
            ? new Date(post.updated_at).toISOString().split("T")[0]
            : post.published_at
              ? new Date(post.published_at).toISOString().split("T")[0]
              : today;

          return `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
        })
        .join("");

      urlsXml += blogUrlsXml;

      // Páginas de categoría (1 URL por categoría con ≥1 post indexable)
      const categories = Array.from(
        new Set(posts.map((p) => p.category).filter(Boolean))
      );
      const categoryUrlsXml = categories
        .map((category) => {
          const encoded = encodeURIComponent(category as string);
          return `
  <url>
    <loc>${SITE_URL}/blog?categoria=${encoded}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        })
        .join("");

      urlsXml += categoryUrlsXml;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

    // Guardar en sitemap_cache (UPSERT - garantiza que siempre haya 1 fila)
    // Borrar todas las filas existentes y luego insertar la nueva
    const { error: deleteError } = await supabase
      .from("sitemap_cache")
      .delete()
      .gte("generated_at", "1900-01-01");

    if (deleteError) {
      console.error("Error clearing sitemap cache:", deleteError);
    }

    const { error: insertError } = await supabase
      .from("sitemap_cache")
      .insert({
        content: sitemap,
        generated_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Error inserting sitemap cache:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert sitemap cache", details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sitemap regenerated with ${posts?.length || 0} indexable blog posts`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sitemap regenerated",
        blogPostsCount: posts?.length || 0,
        staticRoutesCount: staticRoutes.length,
        generatedAt: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error regenerating sitemap:", error);
    return new Response(
      JSON.stringify({ error: "Error regenerating sitemap" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

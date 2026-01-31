import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://acroxia.com";

// Rutas estáticas con prioridades y fechas de última modificación
const staticRoutes = [
  { loc: "/", priority: "1.0", changefreq: "weekly", lastmod: "2026-01-31" },
  { loc: "/precios", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-15" },
  { loc: "/faq", priority: "0.7", changefreq: "monthly", lastmod: "2026-01-20" },
  { loc: "/blog", priority: "0.9", changefreq: "daily", lastmod: null }, // dynamic
  { loc: "/contacto", priority: "0.7", changefreq: "monthly", lastmod: "2026-01-08" },
  { loc: "/clausulas-abusivas-alquiler", priority: "0.9", changefreq: "monthly", lastmod: "2026-01-25" },
  { loc: "/devolucion-fianza-alquiler", priority: "0.9", changefreq: "monthly", lastmod: "2026-01-25" },
  { loc: "/subida-alquiler-2026", priority: "0.9", changefreq: "monthly", lastmod: "2026-01-25" },
  { loc: "/propietarios", priority: "0.9", changefreq: "monthly", lastmod: "2026-01-20" },
  { loc: "/contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-23" },
  { loc: "/impago-alquiler-propietarios", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-23" },
  { loc: "/zonas-tensionadas-propietarios", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-23" },
  { loc: "/deposito-fianza-propietarios", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-23" },
  { loc: "/fin-contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-23" },
  { loc: "/profesionales/inmobiliarias", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-15" },
  { loc: "/profesionales/gestorias", priority: "0.8", changefreq: "monthly", lastmod: "2026-01-15" },
  { loc: "/analizar-gratis", priority: "0.9", changefreq: "weekly", lastmod: "2026-01-30" },
  { loc: "/login", priority: "0.3", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/registro", priority: "0.3", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/aviso-legal", priority: "0.2", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/privacidad", priority: "0.2", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/terminos", priority: "0.2", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/cookies", priority: "0.2", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/accesibilidad", priority: "0.2", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/desistimiento", priority: "0.2", changefreq: "yearly", lastmod: "2026-01-08" },
  { loc: "/transparencia-ia", priority: "0.2", changefreq: "yearly", lastmod: "2026-01-08" },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Intentar leer del caché primero
    const { data: cache, error: cacheError } = await supabase
      .from("sitemap_cache")
      .select("content, generated_at")
      .limit(1)
      .single();

    if (!cacheError && cache?.content && cache.content.length > 0) {
      console.log("Serving sitemap from cache, generated at:", cache.generated_at);
      return new Response(cache.content, {
        headers: corsHeaders,
        status: 200,
      });
    }

    console.log("Cache miss or empty, generating sitemap dynamically...");

    // Fallback: generar dinámicamente si no hay caché
    // Obtener posts del blog publicados
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching blog posts:", error);
    }

    const today = new Date().toISOString().split("T")[0];

    // Generar URLs estáticas con fechas de modificación reales
    let urlsXml = staticRoutes
      .map(
        (route) => `
  <url>
    <loc>${SITE_URL}${route.loc}</loc>
    <lastmod>${route.lastmod || today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
      )
      .join("");

    // Añadir URLs de blog posts
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
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response("Error generating sitemap", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  }
});

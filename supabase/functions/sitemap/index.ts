import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
};

const SITE_URL = "https://acroxia.com";

// Todas las rutas públicas indexables (sincronizadas con App.tsx)
const staticRoutes = [
  // Home & core
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/precios", priority: "0.8", changefreq: "monthly" },
  { loc: "/faq", priority: "0.7", changefreq: "monthly" },
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  { loc: "/contacto", priority: "0.7", changefreq: "monthly" },
  { loc: "/analizar-gratis", priority: "0.9", changefreq: "weekly" },

  // Landings de perfil
  { loc: "/propietarios", priority: "0.9", changefreq: "monthly" },
  { loc: "/profesionales/inmobiliarias", priority: "0.8", changefreq: "monthly" },
  { loc: "/profesionales/gestorias", priority: "0.8", changefreq: "monthly" },

  // SEO pages - inquilinos
  { loc: "/clausulas-abusivas-alquiler", priority: "0.9", changefreq: "monthly" },
  { loc: "/devolucion-fianza-alquiler", priority: "0.9", changefreq: "monthly" },
  { loc: "/subida-alquiler-2026", priority: "0.9", changefreq: "monthly" },

  // SEO pages - propietarios
  { loc: "/contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/impago-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/zonas-tensionadas-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/deposito-fianza-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/fin-contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },

  // Herramientas
  { loc: "/glosario", priority: "0.8", changefreq: "monthly" },
  { loc: "/calculadora-irav", priority: "0.8", changefreq: "monthly" },

  // Auth (baja prioridad)
  { loc: "/login", priority: "0.3", changefreq: "yearly" },
  { loc: "/registro", priority: "0.3", changefreq: "yearly" },

  // Legal
  { loc: "/aviso-legal", priority: "0.2", changefreq: "yearly" },
  { loc: "/privacidad", priority: "0.2", changefreq: "yearly" },
  { loc: "/terminos", priority: "0.2", changefreq: "yearly" },
  { loc: "/cookies", priority: "0.2", changefreq: "yearly" },
  { loc: "/accesibilidad", priority: "0.2", changefreq: "yearly" },
  { loc: "/desistimiento", priority: "0.2", changefreq: "yearly" },
  { loc: "/transparencia-ia", priority: "0.2", changefreq: "yearly" },
];

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const todayStr = new Date().toISOString().split("T")[0];

    // Posts publicados e indexables (excluye noindex = true)
    const { data: posts, error: postsError } = await supabase
      .from("blog_posts")
      .select("slug, category, updated_at, published_at")
      .eq("status", "published")
      .or("noindex.is.null,noindex.eq.false")
      .order("published_at", { ascending: false });

    if (postsError) {
      console.error("Error fetching blog posts:", postsError);
    }

    // URLs estáticas (lastmod = hoy, dinámico)
    let urlsXml = staticRoutes
      .map(
        (route) => `
  <url>
    <loc>${SITE_URL}${route.loc}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
      )
      .join("");

    let blogPostsCount = 0;
    let categoriesCount = 0;

    if (posts && posts.length > 0) {
      // Blog posts individuales
      const blogUrlsXml = posts
        .map((post) => {
          const lastmod = post.updated_at
            ? new Date(post.updated_at).toISOString().split("T")[0]
            : post.published_at
              ? new Date(post.published_at).toISOString().split("T")[0]
              : todayStr;

          return `
  <url>
    <loc>${SITE_URL}/blog/${escapeXml(post.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
        })
        .join("");

      urlsXml += blogUrlsXml;
      blogPostsCount = posts.length;

      // Páginas de categoría (solo categorías con ≥1 post indexable)
      const categories = Array.from(
        new Set(posts.map((p) => p.category).filter(Boolean))
      );
      categoriesCount = categories.length;

      const categoryUrlsXml = categories
        .map((category) => {
          const encoded = encodeURIComponent(category as string);
          return `
  <url>
    <loc>${SITE_URL}/blog?categoria=${encoded}</loc>
    <lastmod>${todayStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        })
        .join("");

      urlsXml += categoryUrlsXml;
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlsXml}
</urlset>`;

    console.log(
      `Sitemap generated: ${staticRoutes.length} static + ${blogPostsCount} posts + ${categoriesCount} categories = ${staticRoutes.length + blogPostsCount + categoriesCount} URLs`
    );

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

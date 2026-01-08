import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BlogSidebar from "@/components/blog/BlogSidebar";
import TableOfContents from "@/components/blog/TableOfContents";
import AuthorBox from "@/components/blog/AuthorBox";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import FadeIn from "@/components/animations/FadeIn";
import { Skeleton } from "@/components/ui/skeleton";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:authors(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.category, slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .neq('slug', slug!)
        .limit(2);

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-24">
          <div className="container mx-auto px-6 text-center">
            <h1 className="font-serif text-4xl font-semibold text-foreground mb-4">
              Artículo no encontrado
            </h1>
            <p className="text-muted-foreground mb-8">
              El artículo que buscas no existe o ha sido movido.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al blog
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formattedDate = post.published_at 
    ? new Date(post.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  // Article schema with E-E-A-T author data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.meta_description,
    "image": post.image,
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "author": post.author ? {
      "@type": "Person",
      "name": post.author.name,
      "jobTitle": post.author.role,
      "url": `https://acroxia.com/autores/${post.author.slug}`,
      "sameAs": [
        post.author.linkedin_url,
        post.author.twitter_url
      ].filter(Boolean)
    } : {
      "@type": "Organization",
      "name": "ACROXIA"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ACROXIA",
      "logo": {
        "@type": "ImageObject",
        "url": "https://acroxia.com/logo.png"
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | ACROXIA Blog</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <meta name="keywords" content={post.keywords?.join(", ") || ""} />
        <link rel="canonical" href={`https://acroxia.com/blog/${post.slug}`} />
        <meta property="og:image" content={post.image || ""} />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Breadcrumbs 
            items={[
              { label: "Blog", href: "/blog" },
              { label: post.category }
            ]} 
          />

          {/* Article Header */}
          <section className="bg-muted pb-12">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center">
                <FadeIn>
                  <span className="inline-block bg-background text-foreground text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                    {post.category}
                  </span>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-6 leading-tight">
                    {post.title}
                  </h1>
                </FadeIn>
                <FadeIn delay={0.2}>
                  <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formattedDate}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {post.read_time} de lectura
                    </span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </section>

          {/* Featured Image */}
          {post.image && (
            <section className="bg-muted pb-16">
              <div className="container mx-auto px-6">
                <FadeIn delay={0.3}>
                  <div className="max-w-5xl mx-auto">
                    <div className="aspect-[21/9] rounded-2xl overflow-hidden shadow-xl">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </FadeIn>
              </div>
            </section>
          )}

          {/* Article Content */}
          <section className="py-16">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <article className="lg:col-span-2">
                  {/* Table of Contents */}
                  <FadeIn delay={0.35}>
                    <TableOfContents content={post.content || ""} className="mb-10" />
                  </FadeIn>

                  <FadeIn delay={0.4}>
                    <div className="prose prose-lg max-w-none 
                      prose-headings:font-serif prose-headings:text-foreground prose-headings:font-semibold
                      prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border
                      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                      prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-li:text-muted-foreground prose-li:leading-relaxed
                      prose-ul:my-6 prose-ol:my-6
                      prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                      prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-foreground
                      prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
                    ">
                      <ReactMarkdown
                        components={{
                          h2: ({ children }) => {
                            const text = String(children);
                            const id = text
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/[^a-z0-9\s-]/g, "")
                              .replace(/\s+/g, "-")
                              .replace(/-+/g, "-");
                            return <h2 id={id}>{children}</h2>;
                          },
                          h3: ({ children }) => {
                            const text = String(children);
                            const id = text
                              .toLowerCase()
                              .normalize("NFD")
                              .replace(/[\u0300-\u036f]/g, "")
                              .replace(/[^a-z0-9\s-]/g, "")
                              .replace(/\s+/g, "-")
                              .replace(/-+/g, "-");
                            return <h3 id={id}>{children}</h3>;
                          },
                          ul: ({ children }) => (
                            <ul className="space-y-3 my-6">
                              {children}
                            </ul>
                          ),
                          li: ({ children }) => (
                            <li className="flex items-start gap-3 text-muted-foreground">
                              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{children}</span>
                            </li>
                          ),
                        }}
                      >
                        {post.content}
                      </ReactMarkdown>
                    </div>
                  </FadeIn>

                  {/* Author Box */}
                  {post.author && <AuthorBox author={post.author} />}

                  {/* Legal Disclaimer */}
                  <FadeIn delay={0.5}>
                    <div className="mt-8 p-4 bg-muted rounded-lg border border-border text-sm text-muted-foreground">
                      <p>
                        <strong>Aviso:</strong> Este artículo tiene carácter meramente informativo y no constituye 
                        asesoramiento legal. La información puede variar según la legislación vigente en cada momento 
                        y las circunstancias particulares de cada caso. Para situaciones específicas, recomendamos 
                        consultar con un profesional del derecho.
                      </p>
                    </div>
                  </FadeIn>

                  {/* CTA after article */}
                  <FadeIn delay={0.6}>
                    <div className="mt-8 p-8 bg-foreground text-background rounded-2xl">
                      <h3 className="font-serif text-2xl font-semibold mb-4">
                        ¿Quieres analizar tu contrato?
                      </h3>
                      <p className="text-background/70 mb-6">
                        Nuestra IA analiza tu contrato e identifica cláusulas potencialmente problemáticas en menos de 2 minutos. 
                        El primer análisis es gratis.
                      </p>
                      <Button 
                        asChild 
                        variant="secondary" 
                        className="rounded-full bg-background text-foreground hover:bg-background/90"
                      >
                        <Link to="/">
                          Analizar mi contrato gratis
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </FadeIn>

                  {/* Related Articles */}
                  {relatedPosts.length > 0 && (
                    <FadeIn delay={0.6}>
                      <div className="mt-16">
                        <h3 className="font-serif text-2xl font-semibold text-foreground mb-8">
                          Artículos relacionados
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-6">
                          {relatedPosts.map((relatedPost) => (
                            <Link
                              key={relatedPost.slug}
                              to={`/blog/${relatedPost.slug}`}
                              className="group block overflow-hidden bg-muted rounded-xl hover:shadow-md transition-all"
                            >
                              {relatedPost.image && (
                                <div className="aspect-[16/9] overflow-hidden">
                                  <img 
                                    src={relatedPost.image} 
                                    alt={relatedPost.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="p-6">
                                <span className="text-xs text-muted-foreground mb-2 block">
                                  {relatedPost.category}
                                </span>
                                <h4 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                  {relatedPost.title}
                                </h4>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </FadeIn>
                  )}
                </article>

                {/* Sidebar */}
                <aside className="lg:col-span-1">
                  <div className="sticky top-8">
                    <BlogSidebar />
                  </div>
                </aside>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogPost;

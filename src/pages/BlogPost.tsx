import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Clock, Calendar, ArrowRight } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { Button } from "@/components/ui/button";
import { getPostBySlug, blogPosts } from "@/data/blogPosts";
import ReactMarkdown from "react-markdown";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

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

  // Article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.metaDescription,
    "datePublished": "2025-01-05",
    "dateModified": "2025-01-05",
    "author": {
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

  // Get related posts (excluding current)
  const relatedPosts = blogPosts.filter(p => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <Helmet>
        <title>{post.title} | ACROXIA Blog</title>
        <meta name="description" content={post.metaDescription} />
        <meta name="keywords" content={post.keywords.join(", ")} />
        <link rel="canonical" href={`https://acroxia.com/blog/${post.slug}`} />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Breadcrumb */}
          <div className="bg-muted py-4">
            <div className="container mx-auto px-6">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-foreground transition-colors">
                  Inicio
                </Link>
                <span>/</span>
                <Link to="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
                <span>/</span>
                <span className="text-foreground">{post.category}</span>
              </nav>
            </div>
          </div>

          {/* Article Header */}
          <section className="bg-muted pb-16 pt-8">
            <div className="container mx-auto px-6">
              <div className="max-w-3xl">
                <span className="inline-block bg-background text-foreground text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                  {post.category}
                </span>
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-6 leading-tight">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {post.readTime} de lectura
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Article Content */}
          <section className="py-16">
            <div className="container mx-auto px-6">
              <div className="grid lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <article className="lg:col-span-2">
                  <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-a:text-primary">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>

                  {/* CTA after article */}
                  <div className="mt-12 p-8 bg-foreground text-background rounded-2xl">
                    <h3 className="font-serif text-2xl font-semibold mb-4">
                      ¿Quieres analizar tu contrato?
                    </h3>
                    <p className="text-background/70 mb-6">
                      Nuestra IA detecta cláusulas abusivas en menos de 2 minutos. 
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

                  {/* Related Articles */}
                  {relatedPosts.length > 0 && (
                    <div className="mt-16">
                      <h3 className="font-serif text-2xl font-semibold text-foreground mb-8">
                        Artículos relacionados
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-6">
                        {relatedPosts.map((relatedPost) => (
                          <Link
                            key={relatedPost.slug}
                            to={`/blog/${relatedPost.slug}`}
                            className="group block p-6 bg-muted rounded-xl hover:bg-muted/70 transition-colors"
                          >
                            <span className="text-xs text-muted-foreground mb-2 block">
                              {relatedPost.category}
                            </span>
                            <h4 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {relatedPost.title}
                            </h4>
                          </Link>
                        ))}
                      </div>
                    </div>
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

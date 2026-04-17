import { useParams, Link } from "react-router-dom";
import ExitIntentCapture from "@/components/ExitIntentCapture";
import StickyBottomCTA from "@/components/blog/StickyBottomCTA";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BlogSidebar from "@/components/blog/BlogSidebar";
import TableOfContents from "@/components/blog/TableOfContents";
import AuthorBox from "@/components/blog/AuthorBox";
import BlogContextualCTA from "@/components/blog/BlogContextualCTA";
import BlogRelatedGuides from "@/components/blog/BlogRelatedGuides";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import FadeIn from "@/components/animations/FadeIn";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
}

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
    queryKey: ['related-posts', post?.audience, post?.category, slug],
    queryFn: async () => {
      // Filtrar por misma audiencia y categoría para coherencia SEO
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('audience', post!.audience)
        .eq('category', post!.category)
        .neq('slug', slug!)
        .order('published_at', { ascending: false })
        .limit(2);

      if (error) throw error;
      
      // Si no hay suficientes posts de la misma categoría, buscar de la misma audiencia
      if (data.length < 2) {
        const { data: fallbackData } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('audience', post!.audience)
          .neq('slug', slug!)
          .neq('category', post!.category)
          .order('published_at', { ascending: false })
          .limit(2 - data.length);
        
        return [...data, ...(fallbackData || [])];
      }
      
      return data;
    },
    enabled: !!post?.audience && !!post?.category,
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

  // Parse FAQs from post data
  const faqs: FAQ[] = Array.isArray(post.faqs) 
    ? (post.faqs as any[]).filter((faq: any) => faq?.question && faq?.answer)
    : [];

  // Word count for structured data
  const wordCount = post.content ? post.content.split(/\s+/).length : 0;

  // BlogPosting schema
  const blogPostingSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.meta_description || post.excerpt,
    "image": post.image || "https://acroxia.com/og-image.jpg",
    "author": post.author ? {
      "@type": "Person",
      "name": post.author.name,
      "url": `https://acroxia.com/autor/${post.author.slug}`,
      "jobTitle": post.author.role
    } : {
      "@type": "Organization",
      "name": "ACROXIA",
      "url": "https://acroxia.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ACROXIA",
      "logo": {
        "@type": "ImageObject",
        "url": "https://acroxia.com/acroxia-logo.png"
      }
    },
    "datePublished": post.published_at,
    "dateModified": post.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://acroxia.com/blog/${post.slug}`
    },
    "isPartOf": {
      "@type": "Blog",
      "name": "Blog ACROXIA",
      "url": "https://acroxia.com/blog"
    },
    "articleSection": post.category,
    "inLanguage": "es-ES",
    "wordCount": wordCount
  };

  // FAQ schema for posts with FAQs
  const faqSchema: Record<string, unknown> | null = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  } : null;

  // HowTo schema for posts with steps
  const howToSteps: HowToStep[] = Array.isArray((post as any).howto_steps)
    ? ((post as any).howto_steps as any[]).filter((s: any) => s?.name && s?.text)
    : [];
  const howToName = (post as any).howto_name as string | null;
  const howToTotalTime = (post as any).howto_total_time as string | null;

  const howToSchema: Record<string, unknown> | null = howToSteps.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": howToName || post.title,
    ...(howToTotalTime ? { "totalTime": howToTotalTime } : {}),
    "description": post.meta_description || post.excerpt,
    "step": howToSteps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text
    }))
  } : null;

  const jsonLdSchemas = [
    blogPostingSchema,
    ...(faqSchema ? [faqSchema] : []),
    ...(howToSchema ? [howToSchema] : []),
  ];

  // Determinar audiencia para breadcrumbs
  const audienceLabel = post.audience === "propietario" ? "Propietarios" : "Inquilinos";
  const audienceUrl = `/blog?audiencia=${post.audience || "inquilino"}`;

  // Truncar título a 60 caracteres para SEO
  const suffix = " | ACROXIA";
  const maxTitleLength = 60;
  const availableLength = maxTitleLength - suffix.length;
  const seoTitle = post.title.length > availableLength
    ? `${post.title.slice(0, availableLength - 3).trimEnd()}...${suffix}`
    : `${post.title}${suffix}`;

  const seoDescription = post.meta_description || post.excerpt || "";

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription.slice(0, 155)}
        canonical={`https://acroxia.com/blog/${post.slug}`}
        ogImage={post.image || "https://acroxia.com/og-image.jpg"}
        ogType="article"
        noindex={post.noindex === true}
        robots={post.noindex === true ? "noindex, follow" : "index, follow"}
        keywords={post.keywords?.join(", ") || ""}
        jsonLd={jsonLdSchemas}
        articleMeta={{
          author: post.author?.name || "ACROXIA",
          datePublished: post.published_at || undefined,
          dateModified: post.updated_at || undefined,
          section: post.category,
          tags: post.keywords || undefined,
        }}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Breadcrumbs 
            items={[
              { label: "Blog", href: "/blog" },
              { label: audienceLabel, href: audienceUrl },
              { label: post.title }
            ]} 
            truncateLength={40}
          />

          {/* Article Header */}
          <section className="bg-muted pb-12">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto text-center">
                <FadeIn>
                  <Link
                    to={`/blog?categoria=${encodeURIComponent(post.category)}`}
                    className="inline-block bg-background text-foreground text-sm font-medium px-4 py-1.5 rounded-full mb-6 hover:bg-foreground hover:text-background transition-colors"
                  >
                    {post.category}
                  </Link>
                </FadeIn>
                <FadeIn delay={0.1}>
                  <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-6 leading-tight">
                    {post.title}
                  </h1>
                </FadeIn>
                <FadeIn delay={0.2}>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                    {/* Fecha de publicación semántica */}
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={post.published_at ? new Date(post.published_at).toISOString() : ''}>
                        {formattedDate}
                      </time>
                    </span>

                    {/* Fecha de actualización semántica */}
                    {post.updated_at && post.published_at && 
                      new Date(post.updated_at).getTime() - new Date(post.published_at).getTime() > 86400000 && (
                      <span className="flex items-center gap-2">
                        Actualizado:&nbsp;
                        <time dateTime={new Date(post.updated_at).toISOString()}>
                          {new Date(post.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </time>
                      </span>
                    )}

                    <span className="text-border">|</span>

                    {/* Tiempo de lectura */}
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {post.read_time} de lectura
                    </span>

                    <span className="text-border">|</span>

                    {/* Autor inline */}
                    <span className="flex items-center gap-2">
                      <img 
                        src="/acroxia-logo.png" 
                        alt="ACROXIA" 
                        className="w-5 h-5 rounded-full object-contain bg-foreground p-0.5" 
                      />
                      Por {post.author?.name || "Equipo ACROXIA"}
                    </span>
                  </div>
                </FadeIn>
                <FadeIn delay={0.25}>
                  <p className="text-xs text-muted-foreground/70 mt-3">
                    Contenido revisado por {post.author?.name || "profesionales de ACROXIA"}
                  </p>
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

                  {/* Inline CTA after table of contents */}
                  <FadeIn delay={0.37}>
                    <div className="mb-10">
                      <BlogContextualCTA audience={post.audience} variant="inline" />
                    </div>
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
                          h1: ({ children }) => <h2>{children}</h2>,
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

                  {/* Related Guides based on content */}
                  <FadeIn delay={0.43}>
                    <BlogRelatedGuides
                      title={post.title}
                      content={post.content || ""}
                      category={post.category}
                    />
                  </FadeIn>

                  {/* Prominent CTA before FAQs */}
                  <FadeIn delay={0.44}>
                    <div className="mt-10">
                      <BlogContextualCTA audience={post.audience} variant="prominent" />
                    </div>
                  </FadeIn>

                  {/* FAQ Section with Schema */}
                  {faqs.length > 0 && (
                    <FadeIn delay={0.45}>
                      <div className="mt-12 bg-muted/50 rounded-2xl p-8">
                        <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">
                          Preguntas frecuentes
                        </h2>
                        <Accordion type="single" collapsible className="w-full">
                          {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                              <AccordionTrigger className="text-left text-foreground hover:text-foreground/80">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </FadeIn>
                  )}

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
                        <Link to="/analizar-gratis">
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
                                    alt={`Ilustración sobre ${relatedPost.category.toLowerCase()}: ${relatedPost.title}`}
                                    loading="lazy"
                                    decoding="async"
                                    width={400}
                                    height={225}
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
        <ExitIntentCapture />
        <StickyBottomCTA />
      </div>
    </>
  );
};

export default BlogPost;

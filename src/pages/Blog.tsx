import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BlogHero from "@/components/blog/BlogHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type Audience = "inquilino" | "propietario";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const audienceFromUrl = searchParams.get("audiencia") as Audience | null;
  
  // null = no seleccionado aún, mostrará posts de ambas audiencias
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(
    audienceFromUrl && ["inquilino", "propietario"].includes(audienceFromUrl) 
      ? audienceFromUrl 
      : null
  );

  // Sincronizar con URL al cargar
  useEffect(() => {
    if (audienceFromUrl && ["inquilino", "propietario"].includes(audienceFromUrl)) {
      setSelectedAudience(audienceFromUrl);
    }
  }, [audienceFromUrl]);

  // Query para posts filtrados por audiencia
  const { data: filteredPosts = [], isLoading: isLoadingFiltered } = useQuery({
    queryKey: ['blog-posts-filtered', selectedAudience],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .eq('audience', selectedAudience!)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedAudience,
  });

  // Query para TODOS los posts recientes (para crawlers y vista por defecto)
  const { data: recentPosts = [], isLoading: isLoadingRecent } = useQuery({
    queryKey: ['blog-posts-all-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data;
    },
    enabled: !selectedAudience,
  });

  const posts = selectedAudience ? filteredPosts : recentPosts;
  const isLoading = selectedAudience ? isLoadingFiltered : isLoadingRecent;
  const [featuredPost, ...otherPosts] = posts;

  // Separar posts por audiencia para vista sin filtro
  const inquilinoPosts = recentPosts.filter(p => p.audience === 'inquilino').slice(0, 3);
  const propietarioPosts = recentPosts.filter(p => p.audience === 'propietario').slice(0, 3);

  const handleSelectAudience = (audience: Audience) => {
    setSelectedAudience(audience);
    setSearchParams({ audiencia: audience });
  };

  const handleResetAudience = () => {
    setSelectedAudience(null);
    setSearchParams({});
  };

  const seoData = {
    default: {
      title: "Blog de Alquiler en España | ACROXIA",
      description: "Guías prácticas sobre alquiler en España para inquilinos y propietarios. Normativa LAU, contratos, fianzas y consejos legales actualizados 2026.",
      keywords: "blog alquiler españa, inquilinos, propietarios, contratos alquiler, LAU 2026",
    },
    inquilino: {
      title: "Blog de Alquiler y Derechos del Inquilino | ACROXIA",
      description: "Guías prácticas sobre alquiler en España: cláusulas abusivas, fianzas, derechos del inquilino, subidas de renta y más. Información legal actualizada 2026.",
      keywords: "blog alquiler españa, derechos inquilino, cláusulas abusivas, fianza alquiler, subida renta",
    },
    propietario: {
      title: "Blog para Propietarios: Contratos, Gestión y Normativa | ACROXIA",
      description: "Guías para propietarios de viviendas en alquiler: contratos seguros, gestión de impagos, garantías, normativa LAU actualizada 2026.",
      keywords: "blog propietarios alquiler, contratos alquiler, gestión inmuebles, impagos alquiler, LAU 2026",
    },
  };

  const currentSeo = selectedAudience ? seoData[selectedAudience] : seoData.default;
  const canonicalUrl = selectedAudience 
    ? `https://acroxia.com/blog?audiencia=${selectedAudience}`
    : "https://acroxia.com/blog";

  return (
    <>
      <Helmet>
        <title>{currentSeo.title}</title>
        <meta name="description" content={currentSeo.description} />
        <meta name="keywords" content={currentSeo.keywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={currentSeo.title} />
        <meta property="og:description" content={currentSeo.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <BlogHero 
            selectedAudience={selectedAudience}
            onSelectAudience={handleSelectAudience}
            onResetAudience={handleResetAudience}
          />
          
          {/* Breadcrumbs solo si hay audiencia seleccionada */}
          {selectedAudience && (
            <Breadcrumbs 
              items={[
                { label: "Blog", href: "/blog" },
                { label: selectedAudience === "inquilino" ? "Inquilinos" : "Propietarios" }
              ]} 
              className="pt-6 pb-4"
            />
          )}
          
          {/* Vista con audiencia seleccionada */}
          {selectedAudience && (
            <section className="py-8 bg-background">
              <div className="container mx-auto px-6">
                <div className="grid lg:grid-cols-3 gap-12">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-12">
                    {isLoading ? (
                      <div className="space-y-6">
                        <Skeleton className="h-64 w-full rounded-2xl" />
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ) : featuredPost ? (
                      <>
                        {/* Featured Post */}
                        <div>
                          <span className="text-sm font-medium text-muted-foreground mb-4 block">
                            ARTÍCULO DESTACADO
                          </span>
                          <BlogCard
                            slug={featuredPost.slug}
                            title={featuredPost.title}
                            excerpt={featuredPost.excerpt}
                            category={featuredPost.category}
                            readTime={featuredPost.read_time}
                            date={featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                            image={featuredPost.image || ''}
                            featured
                          />
                        </div>

                        {/* Other Posts */}
                        {otherPosts.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground mb-6 block">
                              MÁS ARTÍCULOS
                            </span>
                            <div className="grid sm:grid-cols-2 gap-6">
                              {otherPosts.map((post, index) => (
                                <BlogCard
                                  key={post.slug}
                                  slug={post.slug}
                                  title={post.title}
                                  excerpt={post.excerpt}
                                  category={post.category}
                                  readTime={post.read_time}
                                  date={post.published_at ? new Date(post.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                  image={post.image || ''}
                                  index={index}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          {selectedAudience === "inquilino" 
                            ? "No hay artículos para inquilinos todavía."
                            : "No hay artículos para propietarios todavía."
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-28">
                      <BlogSidebar selectedAudience={selectedAudience} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Vista por defecto: Posts de AMBAS audiencias para crawlers */}
          {!selectedAudience && (
            <section className="py-12 bg-background">
              <div className="container mx-auto px-6">
                {isLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-64 w-full rounded-2xl" />
                    <Skeleton className="h-8 w-3/4" />
                  </div>
                ) : (
                  <div className="space-y-16">
                    {/* Artículos para Inquilinos */}
                    {inquilinoPosts.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="font-serif text-2xl font-semibold text-foreground">
                            Para Inquilinos
                          </h2>
                          <button
                            onClick={() => handleSelectAudience('inquilino')}
                            className="text-sm text-primary hover:underline"
                          >
                            Ver todos →
                          </button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                          {inquilinoPosts.map((post, index) => (
                            <BlogCard
                              key={post.slug}
                              slug={post.slug}
                              title={post.title}
                              excerpt={post.excerpt}
                              category={post.category}
                              readTime={post.read_time}
                              date={post.published_at ? new Date(post.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                              image={post.image || ''}
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Artículos para Propietarios */}
                    {propietarioPosts.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-8">
                          <h2 className="font-serif text-2xl font-semibold text-foreground">
                            Para Propietarios
                          </h2>
                          <button
                            onClick={() => handleSelectAudience('propietario')}
                            className="text-sm text-primary hover:underline"
                          >
                            Ver todos →
                          </button>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                          {propietarioPosts.map((post, index) => (
                            <BlogCard
                              key={post.slug}
                              slug={post.slug}
                              title={post.title}
                              excerpt={post.excerpt}
                              category={post.category}
                              readTime={post.read_time}
                              date={post.published_at ? new Date(post.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                              image={post.image || ''}
                              index={index}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;

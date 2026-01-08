import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BlogHero from "@/components/blog/BlogHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const Blog = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const [featuredPost, ...otherPosts] = posts;

  return (
    <>
      <Helmet>
        <title>Blog de Alquiler y Derechos del Inquilino | ACROXIA</title>
        <meta 
          name="description" 
          content="Guías prácticas sobre alquiler en España: cláusulas abusivas, fianzas, derechos del inquilino, subidas de renta y más. Información legal actualizada 2025." 
        />
        <meta 
          name="keywords" 
          content="blog alquiler españa, derechos inquilino, cláusulas abusivas, fianza alquiler, subida renta" 
        />
        <link rel="canonical" href="https://acroxia.com/blog" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <BlogHero />
          
          <section className="py-16 bg-background">
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
                      <p className="text-muted-foreground">No hay artículos publicados todavía.</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <BlogSidebar />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;

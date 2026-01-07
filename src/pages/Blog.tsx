import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import BlogHero from "@/components/blog/BlogHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { blogPosts } from "@/data/blogPosts";

const Blog = () => {
  const [featuredPost, ...otherPosts] = blogPosts;

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
                      readTime={featuredPost.readTime}
                      date={featuredPost.date}
                      featured
                    />
                  </div>

                  {/* Other Posts */}
                  <div>
                    <span className="text-sm font-medium text-muted-foreground mb-6 block">
                      MÁS ARTÍCULOS
                    </span>
                    <div className="grid sm:grid-cols-2 gap-6">
                      {otherPosts.map((post) => (
                        <BlogCard
                          key={post.slug}
                          slug={post.slug}
                          title={post.title}
                          excerpt={post.excerpt}
                          category={post.category}
                          readTime={post.readTime}
                          date={post.date}
                        />
                      ))}
                    </div>
                  </div>
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

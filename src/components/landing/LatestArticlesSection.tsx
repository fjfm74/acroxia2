import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FadeIn from "@/components/animations/FadeIn";
import { Skeleton } from "@/components/ui/skeleton";

const LatestArticlesSection = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['latest-blog-posts-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, category, audience, image, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <Skeleton className="h-10 w-64 mx-auto mb-12" />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
              Últimos artículos del blog
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Guías prácticas sobre alquiler en España actualizadas a la normativa vigente
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {posts.map((post, index) => (
            <FadeIn key={post.slug} delay={0.1 * index}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block bg-background rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full"
              >
                {post.image && (
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-primary uppercase">
                      {post.audience === 'propietario' ? 'Propietarios' : 'Inquilinos'}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{post.category}</span>
                  </div>
                  <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.5}>
          <div className="text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-foreground font-medium hover:text-primary transition-colors"
            >
              Ver todos los artículos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default LatestArticlesSection;

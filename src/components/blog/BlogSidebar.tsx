import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileSearch, ArrowRight, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BlogSubscriptionForm from "./BlogSubscriptionForm";

interface BlogSidebarProps {
  selectedAudience?: "inquilino" | "propietario";
}

const BlogSidebar = ({ selectedAudience = "inquilino" }: BlogSidebarProps) => {
  const { data: popularPosts = [], isLoading } = useQuery({
    queryKey: ['popular-posts', selectedAudience],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title')
        .eq('status', 'published')
        .eq('audience', selectedAudience)
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories', selectedAudience],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('category')
        .eq('status', 'published')
        .eq('audience', selectedAudience);

      if (error) throw error;
      
      // Get unique categories
      const uniqueCategories = [...new Set(data.map(post => post.category))];
      return uniqueCategories;
    },
  });

  // CTA content based on audience
  const ctaContent = {
    inquilino: {
      icon: FileSearch,
      title: "¿Dudas sobre tu contrato?",
      description: "Analiza tu contrato gratis y descubre si tiene cláusulas abusivas.",
      buttonText: "Analizar ahora",
      buttonLink: "/",
    },
    propietario: {
      icon: Home,
      title: "¿Necesitas un contrato seguro?",
      description: "Genera un contrato de alquiler legalmente válido y protege tu inversión.",
      buttonText: "Crear contrato",
      buttonLink: "/propietarios",
    },
  };

  const cta = ctaContent[selectedAudience];
  const CtaIcon = cta.icon;

  return (
    <aside className="space-y-8">
      {/* CTA Analysis */}
      <div className="bg-foreground text-background rounded-2xl p-6">
        <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center mb-4">
          <CtaIcon className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl font-semibold mb-3">
          {cta.title}
        </h3>
        <p className="text-background/70 text-sm mb-6 leading-relaxed">
          {cta.description}
        </p>
        <Button 
          asChild 
          variant="secondary" 
          className="w-full rounded-full bg-background text-foreground hover:bg-background/90"
        >
          <Link to={cta.buttonLink}>
            {cta.buttonText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      {/* Popular Posts */}
      <div className="bg-muted rounded-2xl p-6">
        <h3 className="font-medium text-foreground mb-4">
          Artículos populares
        </h3>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : popularPosts.length > 0 ? (
          <ul className="space-y-4">
            {popularPosts.map((post, index) => (
              <li key={index}>
                <Link 
                  to={`/blog/${post.slug}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors block"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay artículos disponibles todavía.
          </p>
        )}
      </div>

      {/* Newsletter Subscription */}
      <BlogSubscriptionForm selectedAudience={selectedAudience} />

      {/* Categories */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <h3 className="font-medium text-foreground mb-4">
          Categorías
        </h3>
        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span 
                key={cat}
                className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full"
              >
                {cat}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay categorías disponibles.
          </p>
        )}
      </div>
    </aside>
  );
};

export default BlogSidebar;

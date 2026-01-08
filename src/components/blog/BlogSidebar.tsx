import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileSearch, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const BlogSidebar = () => {
  const { data: popularPosts = [], isLoading } = useQuery({
    queryKey: ['popular-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('category')
        .eq('status', 'published');

      if (error) throw error;
      
      // Get unique categories
      const uniqueCategories = [...new Set(data.map(post => post.category))];
      return uniqueCategories;
    },
  });

  return (
    <aside className="space-y-8">
      {/* CTA Analysis */}
      <div className="bg-foreground text-background rounded-2xl p-6">
        <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center mb-4">
          <FileSearch className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl font-semibold mb-3">
          ¿Dudas sobre tu contrato?
        </h3>
        <p className="text-background/70 text-sm mb-6 leading-relaxed">
          Analiza tu contrato gratis y descubre si tiene cláusulas abusivas.
        </p>
        <Button 
          asChild 
          variant="secondary" 
          className="w-full rounded-full bg-background text-foreground hover:bg-background/90"
        >
          <Link to="/">
            Analizar ahora
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
        ) : (
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
        )}
      </div>

      {/* Categories */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <h3 className="font-medium text-foreground mb-4">
          Categorías
        </h3>
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
      </div>
    </aside>
  );
};

export default BlogSidebar;

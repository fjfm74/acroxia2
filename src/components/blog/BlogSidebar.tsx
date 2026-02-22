import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSearch, ArrowRight, Home, BookOpen, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import BlogSubscriptionForm from "./BlogSubscriptionForm";
import { trackConversion } from "@/lib/analytics";

interface BlogSidebarProps {
  selectedAudience?: "inquilino" | "propietario";
}

const BlogSidebar = ({ selectedAudience = "inquilino" }: BlogSidebarProps) => {
  const { toast } = useToast();
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSent, setLeadSent] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
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

  const handleLeadMagnet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail) return;
    setLeadLoading(true);
    try {
      const sessionId = localStorage.getItem("acroxia_session_id") || crypto.randomUUID();
      await supabase.from("leads").insert({
        email: leadEmail,
        session_id: sessionId,
        source: "blog_lead_magnet",
      });
      trackConversion("lead_captured", { source: "blog_lead_magnet" });
      setLeadSent(true);
    } catch {
      toast({ title: "Error", description: "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setLeadLoading(false);
    }
  };

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

      {/* Lead Magnet */}
      <div className="bg-muted rounded-2xl p-6">
        <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center mb-3">
          <BookOpen className="w-5 h-5 text-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-2">
          Guía gratuita
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Las 5 cláusulas ilegales más comunes en contratos de alquiler en 2026.
        </p>
        {leadSent ? (
          <p className="text-sm text-green-600 font-medium">✓ ¡Enviada! Revisa tu email.</p>
        ) : (
          <form onSubmit={handleLeadMagnet} className="space-y-2">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={leadLoading || !leadEmail}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full text-sm"
              size="sm"
            >
              {leadLoading ? "..." : "Recibir guía"}
            </Button>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Sin spam
            </p>
          </form>
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

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSearch, ArrowRight, BookOpen } from "lucide-react";

const BlogSidebar = () => {
  const popularPosts = [
    {
      title: "Las 13 cláusulas abusivas más comunes",
      slug: "clausulas-abusivas-contrato-alquiler"
    },
    {
      title: "Cómo recuperar tu fianza del alquiler",
      slug: "recuperar-fianza-alquiler"
    },
    {
      title: "Subida del alquiler 2025: guía IRAV",
      slug: "subida-alquiler-2025-irav"
    }
  ];

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
      </div>

      {/* Categories */}
      <div className="bg-background border border-border rounded-2xl p-6">
        <h3 className="font-medium text-foreground mb-4">
          Categorías
        </h3>
        <div className="flex flex-wrap gap-2">
          {["Cláusulas Abusivas", "Fianza", "Derechos", "Subida Alquiler", "LAU"].map((cat) => (
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

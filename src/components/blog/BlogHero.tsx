import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const BlogHero = () => {
  return (
    <section className="bg-muted py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-medium text-muted-foreground mb-4">
            BLOG
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
            Guías y consejos para{" "}
            <span className="text-primary">inquilinos</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Artículos prácticos sobre derechos del inquilino, cláusulas abusivas, 
            fianzas y todo lo que necesitas saber sobre el alquiler en España.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BlogHero;

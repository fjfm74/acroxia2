import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSearch, ArrowRight, BookOpen } from "lucide-react";

const FAQContactCTA = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Primary CTA - Análisis */}
            <div className="bg-foreground text-background rounded-3xl p-8 md:p-10">
              <div className="w-14 h-14 rounded-2xl bg-background/10 flex items-center justify-center mb-6">
                <FileSearch className="w-7 h-7 text-background" />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold mb-4">
                ¿Tienes dudas sobre tu contrato?
              </h3>
              <p className="text-background/70 mb-8 leading-relaxed">
                No te la juegues. Sube tu contrato y nuestra IA detectará 
                cláusulas abusivas, errores y todo lo que deberías saber antes 
                de firmar.
              </p>
              <Button 
                asChild 
                variant="secondary" 
                className="rounded-full px-8 bg-background text-foreground hover:bg-background/90"
              >
                <Link to="/">
                  Analizar contrato gratis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Secondary CTA - Blog */}
            <div className="bg-background border border-border rounded-3xl p-8 md:p-10">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6">
                <BookOpen className="w-7 h-7 text-foreground" />
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-4">
                Aprende más en nuestro blog
              </h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Guías detalladas, plantillas gratuitas y consejos de expertos 
                para proteger tus derechos como inquilino.
              </p>
              <Button 
                asChild 
                variant="outline" 
                className="rounded-full px-8"
              >
                <Link to="/blog">
                  Explorar artículos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground text-sm">
              Más de <span className="text-foreground font-medium">2,847 inquilinos</span> han 
              analizado sus contratos este mes
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQContactCTA;

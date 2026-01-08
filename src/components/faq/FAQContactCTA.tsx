import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSearch, ArrowRight, MessageSquare } from "lucide-react";
import ContactForm from "@/components/ContactForm";

const FAQContactCTA = () => {
  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
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

            {/* Contact Form */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    ¿Necesitas ayuda?
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Escríbenos y te respondemos en 24-48h
                  </p>
                </div>
              </div>
              <ContactForm />
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

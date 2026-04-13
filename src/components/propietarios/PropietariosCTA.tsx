import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";

const PropietariosCTA = () => {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-6">
              Analiza tu contrato en menos de 2 minutos
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Sube tu contrato y descubre si cumple con la normativa vigente. 
              Preview gratuito en 2 minutos.
            </p>
            <Button 
              asChild 
              size="lg" 
              className="rounded-full px-8"
            >
              <Link to="/analizar-gratis?perspectiva=propietario">
                Analizar mi contrato gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default PropietariosCTA;

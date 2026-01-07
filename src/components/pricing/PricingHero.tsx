import { Badge } from "@/components/ui/badge";
import FadeIn from "@/components/animations/FadeIn";

const PricingHero = () => {
  return (
    <section className="pt-32 pb-20 bg-muted">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <Badge variant="secondary" className="mb-6 bg-cream text-charcoal border-charcoal/20 font-medium">
              Primer análisis gratis
            </Badge>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold text-charcoal leading-tight mb-6">
              Precios transparentes,
              <br />
              sin sorpresas
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-lg text-charcoal/70 max-w-xl mx-auto">
              Elige el plan que mejor se adapte a tus necesidades. 
              Desde análisis puntuales hasta soluciones empresariales completas.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default PricingHero;

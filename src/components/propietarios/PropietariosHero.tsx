import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";

const PropietariosHero = () => {
  return (
    <section className="bg-background pt-10 pb-20 lg:pb-28">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <span className="inline-block px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-full mb-6">
              Para Propietarios
            </span>
          </FadeIn>
          
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground leading-tight mb-6">
              Tu contrato de alquiler, revisado desde la perspectiva del propietario
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Sube tu contrato y descubre en menos de 2 minutos si cumple con la LAU 2026, los límites de zona tensionada y los requisitos documentales obligatorios.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/registro">Ver planes para propietarios</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link to="/analizar-gratis">Analizar mi contrato</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default PropietariosHero;

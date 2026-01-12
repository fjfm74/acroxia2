import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import FadeIn from "@/components/animations/FadeIn";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image - Optimized local WebP */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-professional.webp"
          alt="Profesional revisando contrato de alquiler"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 pt-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text Content */}
          <div className="max-w-xl">
            <FadeIn>
              <p className="text-sm font-medium text-muted-foreground mb-6 tracking-wide uppercase">
                Análisis de contratos con inteligencia artificial
              </p>
            </FadeIn>
            
            <FadeIn delay={0.1}>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-foreground leading-[1.1] mb-8">
                Protege tus derechos como inquilino
              </h1>
            </FadeIn>
            
            <FadeIn delay={0.2}>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-md">
                Sube tu contrato de alquiler y descubre en menos de 2 minutos si contiene cláusulas que podrían ser abusivas o contrarias a la LAU.
              </p>
            </FadeIn>
            
            <FadeIn delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-base font-medium">
                  <Link to="/analizar-gratis">Analiza tu contrato gratis</Link>
                </Button>
                <Button 
                  asChild
                  variant="ghost" 
                  className="text-foreground hover:bg-transparent underline underline-offset-4 text-base font-medium"
                >
                  <a href="#como-funciona">Ver cómo funciona</a>
                </Button>
              </div>
            </FadeIn>
            
            <FadeIn delay={0.4}>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <span>Sin registro inicial</span>
                <span>Resultado en 2 minutos</span>
                <span>100% confidencial</span>
              </div>
            </FadeIn>
          </div>

          {/* Right - Floating Preview Card */}
          <div className="hidden lg:block">
            <FadeIn delay={0.3} direction="left">
              <div className="bg-card rounded-2xl shadow-2xl shadow-foreground/10 p-8 max-w-md ml-auto">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Resultado del análisis
                  </span>
                  <span className="text-xs text-muted-foreground">
                    hace 2 min
                  </span>
                </div>
                
                <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                  Contrato_Alquiler_Madrid.pdf
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  12 cláusulas analizadas
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">8 cláusulas correctas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">3 cláusulas sospechosas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">1 cláusula potencialmente ilegal</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <Button className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full">
                    Ver informe completo
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

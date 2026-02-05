import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

// Using CSS animations instead of Framer Motion for critical above-the-fold content
// This reduces JS bundle size and improves FCP/LCP

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image - Optimized with explicit dimensions */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/images/hero-professional.webp" 
          alt="Profesional revisando contrato de alquiler" 
          loading="eager" 
          decoding="async" 
          fetchPriority="high"
          width={1920}
          height={1080}
          className="w-full h-full object-cover object-center" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 pt-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text Content with CSS animations */}
          <div className="max-w-xl">
            <p className="hero-animate text-sm font-medium text-muted-foreground mb-6 tracking-wide uppercase">
              Análisis de contratos con inteligencia artificial
            </p>
            
            <h1 className="hero-animate hero-animate-delay-1 font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-foreground leading-[1.1] mb-8">
              Protege tus derechos como inquilino
            </h1>
            
            <p className="hero-animate hero-animate-delay-2 speakable-summary text-lg text-muted-foreground leading-relaxed mb-10 max-w-md">
              Sube tu contrato de alquiler y descubre en menos de 2 minutos si contiene cláusulas que podrían ser abusivas o contrarias a la legislación vigente.
            </p>
            
            <div className="hero-animate hero-animate-delay-3 flex flex-col sm:flex-row gap-4 mb-12">
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-base font-medium">
                <Link to="/analizar-gratis">Analiza tu contrato gratis</Link>
              </Button>
              <Button asChild variant="ghost" className="text-foreground hover:bg-transparent underline underline-offset-4 text-base font-medium">
                <a href="#como-funciona">Ver cómo funciona</a>
              </Button>
            </div>
            
            <div className="hero-animate hero-animate-delay-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <span>Sin registro inicial</span>
              <span>Resultado en 2 minutos</span>
              <span>100% confidencial</span>
            </div>
          </div>

          {/* Right - Floating Preview Card */}
          <div className="hidden lg:block">
            <div className="hero-animate-left hero-animate-delay-3 bg-card rounded-2xl shadow-2xl shadow-foreground/10 p-8 max-w-md ml-auto">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

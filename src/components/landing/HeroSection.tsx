import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2076&auto=format&fit=crop"
          alt="Professional reviewing documents"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 pt-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Text Content */}
          <div className="max-w-xl">
            <p className="text-sm font-medium text-muted-foreground mb-6 tracking-wide uppercase">
              Análisis legal con inteligencia artificial
            </p>
            
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-foreground leading-[1.1] mb-8">
              Protege tus derechos como inquilino
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-md">
              Sube tu contrato de alquiler y descubre en menos de 2 minutos si contiene cláusulas abusivas o ilegales según la LAU.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-base font-medium">
                Analiza tu contrato gratis
              </Button>
              <Button 
                variant="ghost" 
                className="text-foreground hover:bg-transparent underline underline-offset-4 text-base font-medium"
              >
                Ver cómo funciona
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <span>Sin registro inicial</span>
              <span>Resultado en 2 minutos</span>
              <span>100% confidencial</span>
            </div>
          </div>

          {/* Right - Floating Preview Card */}
          <div className="hidden lg:block">
            <div className="bg-card rounded-2xl shadow-2xl shadow-foreground/10 p-8 max-w-md ml-auto animate-fade-up">
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
                    <p className="text-sm font-medium text-foreground">1 cláusula ilegal</p>
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

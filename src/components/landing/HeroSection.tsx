import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, FileText, CheckCircle } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-[hsl(222,47%,18%)] to-[hsl(222,47%,12%)]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" />
      
      <div className="container mx-auto px-6 pt-24 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8 animate-fade-up">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm text-white/90 font-medium">Tecnología IA · Expertos en LAU</span>
          </div>
          
          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-up animation-delay-200">
            Tu escudo legal contra
            <span className="block text-accent mt-2">contratos de alquiler abusivos</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up animation-delay-400">
            Analizamos tu contrato de alquiler con inteligencia artificial en menos de 2 minutos. 
            Detectamos cláusulas ilegales y generamos cartas de reclamación automáticas.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up animation-delay-600">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-xl shadow-lg shadow-accent/25 group">
              Analiza tu contrato gratis
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl">
              Ver cómo funciona
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm animate-fade-in animation-delay-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>Sin registro inicial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>Resultado en 2 minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <span>100% confidencial</span>
            </div>
          </div>
        </div>
        
        {/* Preview card */}
        <div className="max-w-3xl mx-auto mt-16 animate-fade-up animation-delay-600">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-white font-semibold">Contrato_Alquiler_2024.pdf</p>
                <p className="text-white/60 text-sm">Analizado hace 3 minutos</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-400">12</p>
                <p className="text-xs text-green-300">Cláusulas correctas</p>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">3</p>
                <p className="text-xs text-yellow-300">Sospechosas</p>
              </div>
              <div className="bg-red-500/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-400">2</p>
                <p className="text-xs text-red-300">Ilegales</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

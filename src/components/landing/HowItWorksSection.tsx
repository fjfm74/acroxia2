import { Upload, Brain, FileCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Sube tu contrato",
    description: "Arrastra tu PDF o haz una foto del contrato de alquiler. Aceptamos cualquier formato.",
  },
  {
    icon: Brain,
    number: "02",
    title: "IA analiza en 2 minutos",
    description: "Nuestra inteligencia artificial revisa cada cláusula contra la LAU y normativa vigente.",
  },
  {
    icon: FileCheck,
    number: "03",
    title: "Recibe tu informe",
    description: "Obtén un informe detallado con cláusulas ilegales y cartas de reclamación automáticas.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Proceso simple
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cómo funciona ACROXIA
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            En tres sencillos pasos, descubre si tu contrato tiene cláusulas abusivas
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-4 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/20 via-accent/40 to-primary/20" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                {/* Step number */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-5xl font-bold text-primary/10 group-hover:text-accent/20 transition-colors">
                    {step.number}
                  </span>
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center group-hover:bg-accent transition-colors shadow-lg">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-accent" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

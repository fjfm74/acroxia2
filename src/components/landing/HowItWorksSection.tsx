import FadeIn from "@/components/animations/FadeIn";

const steps = [
  {
    number: "01",
    title: "Sube tu contrato",
    description: "Arrastra tu PDF o imagen del contrato. Aceptamos cualquier formato legible.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=800&auto=format&fit=crop",
  },
  {
    number: "02",
    title: "Análisis IA",
    description: "Nuestra inteligencia artificial revisa cada cláusula según la legislación vigente.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
  },
  {
    number: "03",
    title: "Recibe tu informe",
    description: "Obtén un informe detallado con orientaciones claras sobre cada cláusula.",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800&auto=format&fit=crop",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-32 bg-background">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-3xl mb-20">
            <p className="text-sm font-medium text-muted-foreground mb-4 tracking-wide uppercase">
              Proceso simple
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground leading-tight">
              Cómo funciona
            </h2>
          </div>
        </FadeIn>
        
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <FadeIn key={index} delay={index * 0.15}>
              <div className="group">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-8">
                  <img
                    src={step.image}
                    alt={step.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                
                <span className="font-serif text-5xl font-medium text-muted-foreground/30 block mb-4">
                  {step.number}
                </span>
                
                <h3 className="font-serif text-2xl font-medium text-foreground mb-3">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

import FadeIn from "@/components/animations/FadeIn";

const stats = [
  {
    value: "1,9M",
    context: "de contratos de alquiler activos en España según el INE",
  },
  {
    value: "7 de 10",
    context: "inquilinos no revisan su contrato antes de firmar",
  },
  {
    value: "150‑300€",
    context: "es el coste medio de una consulta jurídica especializada",
  },
  {
    value: "<2 min",
    context: "es el tiempo de análisis con tecnología IA de ACROXIA",
  },
];

const StatsSection = () => {
  return (
    <section className="py-32 bg-muted">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="max-w-3xl mb-20">
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground leading-tight mb-6">
              Por qué analizar tu contrato es importante
            </h2>
            <p className="text-lg text-muted-foreground">
              Tanto inquilinos como propietarios se enfrentan a contratos con cláusulas que podrían no ajustarse a la normativa. Los datos lo confirman.
            </p>
          </div>
        </FadeIn>
        
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-16">
          {stats.map((stat, index) => (
            <FadeIn key={index} delay={index * 0.1}>
              <div className="border-t border-border pt-8">
                <p className="font-serif text-6xl md:text-7xl font-medium text-foreground mb-4">
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-lg max-w-sm">
                  {stat.context}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

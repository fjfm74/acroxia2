import FadeIn from "@/components/animations/FadeIn";

const stats = [
  {
    value: "632.369",
    context: "contratos de alquiler vencerán en España en 2026",
  },
  {
    value: "73%",
    context: "de inquilinos desconocen sus derechos según la LAU",
  },
  {
    value: "€850",
    context: "es el coste medio de una consulta con abogado especializado",
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
              El problema es más grande de lo que piensas
            </h2>
            <p className="text-lg text-muted-foreground">
              Miles de inquilinos en España firman contratos con cláusulas abusivas sin saberlo. Los datos hablan por sí solos.
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

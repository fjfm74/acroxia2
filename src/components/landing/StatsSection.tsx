import { TrendingUp, Users, Gavel, Clock } from "lucide-react";

const stats = [
  {
    icon: TrendingUp,
    value: "632.369",
    label: "Contratos de alquiler",
    description: "vencerán en España en 2026",
  },
  {
    icon: Users,
    value: "73%",
    label: "De inquilinos",
    description: "desconocen sus derechos según la LAU",
  },
  {
    icon: Gavel,
    value: "€850",
    label: "Coste medio",
    description: "de una consulta legal tradicional",
  },
  {
    icon: Clock,
    value: "<2 min",
    label: "Tiempo de análisis",
    description: "con tecnología IA de ACROXIA",
  },
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            El problema es más grande de lo que piensas
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Miles de inquilinos en España firman contratos con cláusulas abusivas sin saberlo
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="group relative bg-card rounded-2xl p-8 border border-border hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-accent/10 transition-colors">
                <stat.icon className="w-7 h-7 text-primary group-hover:text-accent transition-colors" />
              </div>
              <p className="text-4xl font-bold text-foreground mb-2">{stat.value}</p>
              <p className="text-lg font-semibold text-foreground mb-1">{stat.label}</p>
              <p className="text-muted-foreground text-sm">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;

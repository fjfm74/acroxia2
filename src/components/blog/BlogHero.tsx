import { Home, Building2, ArrowRight, ArrowLeft } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";

type Audience = "inquilino" | "propietario" | null;

interface BlogHeroProps {
  selectedAudience: Audience;
  onSelectAudience: (audience: "inquilino" | "propietario") => void;
  onResetAudience: () => void;
}

const audienceContent = {
  inquilino: {
    label: "BLOG · INQUILINOS",
    title: "Guías y derechos del inquilino",
    subtitle: "Cláusulas abusivas, fianzas, subidas de renta y todo lo que necesitas saber sobre el alquiler en España.",
  },
  propietario: {
    label: "BLOG · PROPIETARIOS",
    title: "Guías para propietarios",
    subtitle: "Contratos seguros, gestión de impagos, garantías y normativa LAU actualizada.",
  },
};

const BlogHero = ({ selectedAudience, onSelectAudience, onResetAudience }: BlogHeroProps) => {
  // Estado inicial: mostrar selector de audiencia
  if (!selectedAudience) {
    return (
      <section className="bg-muted pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeIn>
              <span className="inline-block text-sm font-medium text-muted-foreground mb-4 tracking-wider">
                BLOG
              </span>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-4 leading-tight">
                Todo sobre el alquiler en España
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                Guías prácticas, normativa actualizada y consejos legales. Selecciona tu perfil para ver contenido relevante.
              </p>
            </FadeIn>

            {/* Selector de audiencia */}
            <FadeIn delay={0.3}>
              <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Card Inquilino */}
                <button
                  onClick={() => onSelectAudience("inquilino")}
                  className="group bg-background rounded-2xl p-8 text-left shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-foreground/10"
                >
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Home className="w-7 h-7" />
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
                    Soy inquilino
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Derechos, fianzas, cláusulas abusivas y cómo protegerte ante abusos.
                  </p>
                  <span className="inline-flex items-center text-sm font-medium text-foreground group-hover:underline">
                    Ver artículos
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                {/* Card Propietario */}
                <button
                  onClick={() => onSelectAudience("propietario")}
                  className="group bg-background rounded-2xl p-8 text-left shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-foreground/10"
                >
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-6 group-hover:bg-foreground group-hover:text-background transition-colors">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
                    Soy propietario
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Contratos, garantías, gestión de impagos y normativa LAU.
                  </p>
                  <span className="inline-flex items-center text-sm font-medium text-foreground group-hover:underline">
                    Ver artículos
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    );
  }

  // Estado con audiencia seleccionada: Hero colapsado
  const content = audienceContent[selectedAudience];

  return (
    <section className="bg-muted pt-32 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground tracking-wider">
                {content.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetAudience}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cambiar perfil
              </Button>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-3 leading-tight">
              {content.title}
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {content.subtitle}
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default BlogHero;

import { Link } from "react-router-dom";
import { AlertTriangle, Wallet, TrendingUp, Calculator } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

interface TenantGuide {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

const allGuides: TenantGuide[] = [
  {
    slug: "/clausulas-abusivas-alquiler",
    title: "Cláusulas Abusivas en Alquiler",
    shortTitle: "Cláusulas abusivas",
    description: "Identifica cláusulas ilegales y cómo reclamar según la LAU.",
    icon: AlertTriangle,
    iconColor: "text-red-600"
  },
  {
    slug: "/devolucion-fianza-alquiler",
    title: "Devolución de Fianza",
    shortTitle: "Recuperar fianza",
    description: "Plazo de 30 días, motivos de retención y cómo reclamar.",
    icon: Wallet,
    iconColor: "text-green-600"
  },
  {
    slug: "/subida-alquiler-2026",
    title: "Subida de Alquiler 2026",
    shortTitle: "Subida alquiler",
    description: "IRAV, límites legales y qué hacer ante subidas abusivas.",
    icon: TrendingUp,
    iconColor: "text-blue-600"
  },
  {
    slug: "/calculadora-irav",
    title: "Calculadora IRAV 2026",
    shortTitle: "Calculadora IRAV",
    description: "Descubre qué índice aplica a tu revisión de renta: IRAV o IPC.",
    icon: Calculator,
    iconColor: "text-emerald-600"
  }
];

interface RelatedTenantGuidesProps {
  currentSlug: string;
}

const RelatedTenantGuides = ({ currentSlug }: RelatedTenantGuidesProps) => {
  const relatedGuides = allGuides.filter(guide => guide.slug !== currentSlug);

  return (
    <section className="bg-muted py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-3">
              Otras guías para inquilinos
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Consulta nuestras guías especializadas para proteger tus derechos como inquilino.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {relatedGuides.map((guide, index) => (
            <FadeIn key={guide.slug} delay={index * 0.1}>
              <Link 
                to={guide.slug}
                className="block bg-background rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group h-full"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <guide.icon className={`w-5 h-5 ${guide.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm mb-1 group-hover:text-foreground/80 transition-colors">
                      {guide.shortTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {guide.description}
                    </p>
                  </div>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="text-center mt-8">
            <Link 
              to="/faq" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Ver todas las preguntas frecuentes →
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default RelatedTenantGuides;

import { Link } from "react-router-dom";
import { AlertTriangle, MapPin, Building2, CalendarX, FileText } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

interface LandlordGuide {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

const allGuides: LandlordGuide[] = [
  {
    slug: "/contrato-alquiler-propietarios",
    title: "Contrato de Alquiler LAU 2026",
    shortTitle: "Contrato LAU",
    description: "Requisitos legales, fianzas permitidas y elementos obligatorios.",
    icon: FileText,
    iconColor: "text-blue-600"
  },
  {
    slug: "/impago-alquiler-propietarios",
    title: "Impago de Alquiler",
    shortTitle: "Impago",
    description: "Pasos legales, burofax, desahucio express y protección preventiva.",
    icon: AlertTriangle,
    iconColor: "text-red-600"
  },
  {
    slug: "/zonas-tensionadas-propietarios",
    title: "Zonas Tensionadas",
    shortTitle: "Zonas tensionadas",
    description: "Consulta SERPAVI, límites de renta y obligaciones legales.",
    icon: MapPin,
    iconColor: "text-purple-600"
  },
  {
    slug: "/deposito-fianza-propietarios",
    title: "Depósito de Fianza",
    shortTitle: "Fianza",
    description: "Organismos por CCAA, plazos de depósito y descuentos permitidos.",
    icon: Building2,
    iconColor: "text-amber-600"
  },
  {
    slug: "/fin-contrato-alquiler-propietarios",
    title: "Fin de Contrato",
    shortTitle: "Fin contrato",
    description: "Prórrogas obligatorias, preaviso y recuperación de vivienda.",
    icon: CalendarX,
    iconColor: "text-slate-600"
  }
];

interface RelatedLandlordGuidesProps {
  currentSlug: string;
}

const RelatedLandlordGuides = ({ currentSlug }: RelatedLandlordGuidesProps) => {
  const relatedGuides = allGuides.filter(guide => guide.slug !== currentSlug);

  return (
    <section className="bg-muted py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground mb-3">
              Otras guías para propietarios
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Consulta nuestras guías especializadas para arrendadores y protege tu inversión inmobiliaria.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {relatedGuides.map((guide, index) => (
            <FadeIn key={guide.slug} delay={index * 0.1}>
              <Link 
                to={guide.slug}
                className="block bg-background rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group h-full"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
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

        <FadeIn delay={0.4}>
          <div className="text-center mt-8">
            <Link 
              to="/propietarios" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Ver todos los servicios para propietarios →
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default RelatedLandlordGuides;

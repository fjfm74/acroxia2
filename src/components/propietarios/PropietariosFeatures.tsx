import { Link } from "react-router-dom";
import { FileSearch, MapPin, FileText, Bell, ExternalLink } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

const features = [
  {
    icon: FileSearch,
    title: "Análisis desde perspectiva propietario",
    description: "Revisa tu contrato buscando cláusulas que podrían perjudicarte como arrendador o que no cumplen con la normativa vigente.",
  },
  {
    icon: MapPin,
    title: "Verificador de zona tensionada",
    description: "Comprueba si tu inmueble está en una zona tensionada y qué límites de renta aplican. Consulta directamente en la web oficial.",
    link: "https://serpavi.mivau.gob.es/",
    linkText: "Ver Sistema de Referencia de Precios (MIVAU)",
  },
  {
    icon: FileText,
    title: "Generador de contratos LAU 2026",
    description: "Crea contratos de alquiler conformes a la legislación vigente, adaptados a tu situación específica como propietario.",
  },
  {
    icon: Bell,
    title: "Alertas de renovación",
    description: "Recibe recordatorios cuando se acerquen fechas clave: fin de contrato, prórrogas obligatorias o actualizaciones de renta.",
  },
];

const PropietariosFeatures = () => {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
              Herramientas para propietarios
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Todo lo que necesitas para gestionar tus contratos con tranquilidad jurídica
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FadeIn key={index} delay={index * 0.1}>
              <div className="bg-muted rounded-2xl p-8 h-full">
                <div className="w-14 h-14 bg-foreground rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-background" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {feature.description}
                </p>
                {feature.link && (
                  <a 
                    href={feature.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
                  >
                    {feature.linkText}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </FadeIn>
          ))}
        </div>

        {/* IRAV Notice */}
        <FadeIn delay={0.4}>
          <div className="max-w-3xl mx-auto mt-12 p-6 bg-blue-50 rounded-2xl border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Sobre el IRAV y la actualización de rentas</h4>
                <p className="text-muted-foreground text-sm">
                  El cálculo del IRAV (Índice de Referencia de Arrendamientos de Vivienda) debe realizarse en la 
                  <a 
                    href="https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176993&menu=ultiDatos&idp=1254735576757"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mx-1"
                  >
                    web oficial del INE
                  </a>
                  o en la web de tu Comunidad Autónoma si dispone de índice propio. ACROXIA te indica dónde consultar, pero el cálculo oficial debe hacerse en la fuente correspondiente.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default PropietariosFeatures;

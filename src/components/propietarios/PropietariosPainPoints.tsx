import { FileQuestion, Scale, AlertCircle } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

const painPoints = [
  {
    icon: FileQuestion,
    title: "¿Tu contrato está actualizado a 2026?",
    description: "La normativa de alquiler ha cambiado. Un contrato desactualizado puede tener cláusulas nulas o inaplicables.",
  },
  {
    icon: Scale,
    title: "¿Conoces los límites en zonas tensionadas?",
    description: "En ciertas zonas hay límites al precio del alquiler. Un contrato que los incumpla puede ser reclamado por el inquilino.",
  },
  {
    icon: AlertCircle,
    title: "¿Tu fianza y garantías son legales?",
    description: "La LAU limita las garantías que puedes pedir. Excederse puede suponer la nulidad de esas cláusulas.",
  },
];

const PropietariosPainPoints = () => {
  return (
    <section className="bg-muted py-20">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
              ¿Te resulta familiar?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Problemas comunes que enfrentan los propietarios con sus contratos de alquiler
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <FadeIn key={index} delay={index * 0.1}>
              <div className="bg-background rounded-2xl p-8 shadow-lg h-full">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                  <point.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                  {point.title}
                </h3>
                <p className="text-muted-foreground">
                  {point.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropietariosPainPoints;

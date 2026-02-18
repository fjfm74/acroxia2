import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";
import SubscriptionCard from "./SubscriptionCard";

const plans = [
  {
    name: "Escaneo Rápido",
    price: "0",
    period: "",
    description: "Preview gratuito de tu contrato",
    features: [
      "Puntuación de riesgo (1-10)",
      "Número de alertas detectadas",
      "2 cláusulas parcialmente visibles",
      "Válido durante 24 horas",
    ],
    cta: "Escanear contrato gratis",
    highlighted: false,
  },
  {
    name: "Análisis Único",
    price: "39",
    period: "",
    description: "Análisis completo para un contrato específico",
    features: [
      "1 análisis completo",
      "Informe detallado en PDF",
      "Cláusulas potencialmente ilegales destacadas",
      "Recomendaciones personalizadas",
    ],
    cta: "Analizar contrato",
    highlighted: false,
  },
  {
    name: "Pack Comparador",
    price: "79",
    period: "",
    description: "Ideal para comparar varios pisos antes de decidir",
    features: [
      "3 análisis completos",
      "Comparativa entre contratos",
      "Informe detallado en PDF",
      "Cláusulas potencialmente ilegales destacadas",
      "Recomendaciones personalizadas",
    ],
    cta: "Comparar contratos",
    highlighted: true,
    badge: "Más popular",
  },
];

const B2CPricing = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-charcoal/60 uppercase tracking-widest mb-4">
              Para inquilinos
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-charcoal">
              Analiza tu próximo alquiler
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.1}>
              <div
                className={`relative bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-lg h-full ${
                  plan.highlighted
                    ? "ring-2 ring-charcoal shadow-xl"
                    : "border border-charcoal/10 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-charcoal text-cream text-xs font-medium px-4 py-1.5 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-serif text-lg font-medium text-charcoal mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl font-semibold text-charcoal">
                      €{plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-charcoal/60 text-sm">{plan.period}</span>
                    )}
                  </div>
                  <p className="text-sm text-charcoal/60 mt-3">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-charcoal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-charcoal/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full rounded-full font-medium ${
                    plan.highlighted
                      ? "bg-charcoal text-cream hover:bg-charcoal/90"
                      : "bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-cream"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </FadeIn>
          ))}
          
          {/* Subscription Card with toggle */}
          <FadeIn delay={0.3}>
            <SubscriptionCard />
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default B2CPricing;

import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";

const plans = [
  {
    name: "Propietario Único",
    price: "49",
    period: "",
    description: "Para propietarios con 1-2 inmuebles",
    features: [
      "1 análisis completo de contrato",
      "Generador de contrato conforme a LAU",
      "Verificación de zona tensionada",
      "Informe PDF descargable",
    ],
    cta: "Comprar análisis",
    highlighted: false,
  },
  {
    name: "Propietario Múltiple",
    price: "99",
    period: "/año",
    description: "Para propietarios con varios inmuebles",
    features: [
      "5 análisis al año",
      "Generador de contratos ilimitado",
      "Alertas de renovación",
      "Verificación de zonas tensionadas",
      "Soporte prioritario",
    ],
    cta: "Suscribirse",
    highlighted: true,
    badge: "Más popular",
  },
  {
    name: "Cartera Premium",
    price: "149",
    period: "/año",
    description: "Para carteras de alquiler profesionalizadas",
    features: [
      "Análisis ilimitados",
      "Generador de contratos ilimitado",
      "Alertas de renovación y vencimientos",
      "Dashboard de gestión",
      "Soporte dedicado",
    ],
    cta: "Suscribirse",
    highlighted: false,
  },
];

const PropietariosPricing = () => {
  return (
    <section className="bg-foreground py-24">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-background/60 uppercase tracking-widest mb-4">
              Planes para propietarios
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-background">
              Elige el plan que se adapta a tu cartera
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.1}>
              <div
                className={`relative rounded-2xl p-8 transition-all duration-300 h-full flex flex-col ${
                  plan.highlighted
                    ? "bg-background text-foreground ring-2 ring-background shadow-2xl"
                    : "bg-foreground/10 text-background border border-background/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-background text-foreground text-xs font-medium px-4 py-1.5 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`font-serif text-lg font-medium mb-2 ${
                    plan.highlighted ? "text-foreground" : "text-background"
                  }`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`font-serif text-4xl font-semibold ${
                      plan.highlighted ? "text-foreground" : "text-background"
                    }`}>
                      €{plan.price}
                    </span>
                    {plan.period && (
                      <span className={plan.highlighted ? "text-foreground/60" : "text-background/60"}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-3 ${
                    plan.highlighted ? "text-foreground/60" : "text-background/60"
                  }`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlighted ? "text-foreground" : "text-background"
                      }`} />
                      <span className={`text-sm ${
                        plan.highlighted ? "text-foreground/80" : "text-background/80"
                      }`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full rounded-full font-medium ${
                    plan.highlighted
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-background text-foreground hover:bg-background/90"
                  }`}
                >
                  <Link to="/registro">{plan.cta}</Link>
                </Button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PropietariosPricing;

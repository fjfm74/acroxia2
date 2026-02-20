import { Button } from "@/components/ui/button";
import { Check, Building2 } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

const b2bPlans = [
  {
    icon: Building2,
    name: "Plan Profesional",
    audience: "Inmobiliarias, APIs, Gestorías y Administradores de Fincas",
    price: "99",
    period: "/mes",
    description: "Herramienta de apoyo para equipos que gestionan contratos de alquiler",
    features: [
      "15 análisis al mes",
      "Dashboard personalizado",
      "Informes con tu marca",
      "Soporte sobre la plataforma",
    ],
    upsell: null as string | null,
    badge: "Más popular" as string | null,
    highlighted: true,
    cta: "Contratar",
  },
  {
    icon: Building2,
    name: "Plan Profesional Plus",
    audience: "Inmobiliarias, APIs, Gestorías y Administradores de Fincas",
    price: "149",
    period: "/mes",
    description: "Para equipos con alto volumen de contratos",
    features: [
      "Todo lo del Plan Profesional +",
      "Análisis ilimitados",
      "Soporte prioritario",
    ],
    upsell: "Sin límite mensual de análisis" as string | null,
    badge: null as string | null,
    highlighted: false,
    cta: "Contratar",
  },
];

const B2BPricing = () => {
  return (
    <section className="py-24 bg-charcoal">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-cream/60 uppercase tracking-widest mb-4">
              Para profesionales
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-cream">
              Soluciones empresariales
            </h2>
            <p className="text-cream/70 mt-4 max-w-xl mx-auto">
              Herramientas profesionales para equipos que gestionan contratos a diario
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {b2bPlans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.15}>
              <div
                className={`relative backdrop-blur-sm rounded-2xl p-8 transition-all duration-300 h-full flex flex-col ${
                  plan.highlighted
                    ? "bg-cream/10 border-2 border-success/70 shadow-xl shadow-success/10"
                    : "bg-cream/5 border border-cream/10 hover:bg-cream/10"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-success text-white text-xs font-medium px-4 py-1.5 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-cream/10 flex items-center justify-center">
                    <plan.icon className="w-6 h-6 text-cream" />
                  </div>
                  <div>
                    <p className="text-sm text-cream/60">{plan.audience}</p>
                    <h3 className="font-serif text-xl font-medium text-cream">{plan.name}</h3>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-serif text-5xl font-semibold text-cream">
                    €{plan.price}
                  </span>
                  <span className="text-cream/60">{plan.period}</span>
                </div>

                {plan.upsell && (
                  <p className="text-green-400 text-xs font-medium mb-4">{plan.upsell}</p>
                )}

                <p className="text-cream/70 text-sm mb-8">{plan.description}</p>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-cream/80 mt-0.5 flex-shrink-0" />
                      <span
                        className={`text-sm ${
                          feature.includes("Todo lo")
                            ? "text-cream font-medium"
                            : "text-cream/80"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button className="w-full rounded-full bg-cream text-charcoal hover:bg-cream/90 font-medium">
                  {plan.cta}
                </Button>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default B2BPricing;

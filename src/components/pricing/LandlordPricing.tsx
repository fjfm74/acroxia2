import { useState } from "react";
import { Check, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";
import WaitlistModal from "@/components/WaitlistModal";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Propietario",
    price: "29",
    period: "",
    description: "Pago único por contrato",
    features: [
      "1 análisis completo de contrato",
      "Generador de contrato adaptado a la LAU",
      "Checklist de cumplimiento legal",
      "Descarga en PDF",
    ],
    cta: "Unirme a la lista",
    highlighted: false,
    badge: undefined as string | undefined,
  },
  {
    name: "Propietario Pro",
    price: "149",
    period: "/año",
    description: "Para gestionar múltiples propiedades",
    features: [
      "Análisis ilimitados",
      "Generador de contratos ilimitado",
      "Alertas de renovación por propiedad",
      "Gestión multi-propiedad",
      "Detección de zona tensionada",
      "Historial completo",
    ],
    cta: "Unirme a la lista",
    highlighted: true,
    badge: "Recomendado para +3 inmuebles",
  },
];

const LandlordPricing = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  return (
    <section className="py-24 bg-muted">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-full mb-6">
              <Key className="w-4 h-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground/60">Para propietarios</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-charcoal">
              Contratos conformes a la ley
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Analiza tus contratos desde la perspectiva del arrendador y asegúrate de cumplir con la LAU 2026
            </p>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.1}>
              <div
                className={`relative bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-lg h-full flex flex-col ${
                  plan.highlighted
                    ? "ring-2 ring-success shadow-xl shadow-success/10"
                    : "border border-charcoal/10 shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-success text-white text-xs font-medium px-4 py-1.5 rounded-full">
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

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-charcoal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-charcoal/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => { setSelectedPlan(plan.name); setWaitlistOpen(true); }}
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
        </div>

        <FadeIn delay={0.3}>
          <div className="text-center mt-10">
            <Link
              to="/propietarios"
              className="text-sm font-medium text-charcoal/70 hover:text-charcoal underline underline-offset-4"
            >
              Ver todas las funcionalidades para propietarios →
            </Link>
          </div>
        </FadeIn>
      </div>

      <WaitlistModal
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        planName={selectedPlan}
        source="pricing_landlord"
      />
    </section>
  );
};

export default LandlordPricing;

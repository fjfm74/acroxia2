import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, Sparkles, X } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { toast } from "sonner";

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
    isFree: true,
    priceId: "",
  },
  {
    name: "Análisis Único",
    price: "14,99",
    period: "",
    description: "Análisis completo para un contrato específico",
    subPrice: "Menos de lo que cuesta un café al día",
    subPriceColor: "text-green-600",
    features: [
      "1 análisis completo",
      "Todas las cláusulas analizadas",
      "Cláusulas potencialmente ilegales destacadas",
      "Recomendaciones personalizadas",
    ],
    cta: "Comprar análisis",
    highlighted: true,
    badge: "Recomendado",
    isFree: false,
    priceId: "analisis_unico_price",
  },
  {
    name: "Pack Comparador",
    price: "34,99",
    period: "",
    description: "Ideal para comparar varios pisos antes de decidir",
    subPrice: "11,66€ por análisis",
    subPriceColor: "text-charcoal/60",
    features: [
      "3 análisis completos",
      "Todas las cláusulas analizadas",
      "Cláusulas potencialmente ilegales destacadas",
      "Recomendaciones personalizadas",
    ],
    cta: "Comprar pack",
    highlighted: false,
    isFree: false,
    priceId: "pack_comparador_price",
  },
];

const B2CPricing = () => {
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();
  const [consentDigital, setConsentDigital] = useState(false);

  const handlePlanClick = async (plan: typeof plans[0]) => {
    if (!plan.isFree && !consentDigital) {
      toast.error("Marca la casilla de consentimiento antes de continuar al pago.");
      return;
    }

    if (plan.isFree) return;

    if (!user) {
      toast.error("Inicia sesión para continuar con la compra");
      return;
    }

    try {
      await openCheckout({
        priceId: plan.priceId,
        customerEmail: user.email || undefined,
        customData: { userId: user.id },
        successUrl: `${window.location.origin}/analizar?checkout=success`,
      });
    } catch (error) {
      toast.error("Error al abrir el checkout. Inténtalo de nuevo.");
    }
  };

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

        <FadeIn delay={0.05}>
          <div className="flex items-start gap-3 max-w-4xl mx-auto mb-8 p-4 rounded-xl border border-charcoal/10 bg-white">
            <Checkbox
              id="consent-digital"
              checked={consentDigital}
              onCheckedChange={(checked) => setConsentDigital(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="consent-digital" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Confirmo que entiendo que el análisis es un servicio digital de ejecución inmediata y que, conforme al art. 103.m del RDL 1/2007, pierdo el derecho de desistimiento de 14 días en cuanto se inicie el análisis. He leído los{" "}
              <Link to="/terminos" className="underline hover:no-underline text-foreground">Términos</Link>
              {" "}y la{" "}
              <Link to="/desistimiento" className="underline hover:no-underline text-foreground">Política de Desistimiento</Link>.
            </Label>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.1}>
              <div
                className={`relative bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-lg h-full ${
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
                  {plan.subPrice && (
                    <p className={`text-xs font-medium mt-1 ${plan.subPriceColor || "text-charcoal/60"}`}>
                      {plan.subPrice}
                    </p>
                  )}
                  <p className="text-sm text-charcoal/60 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-charcoal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-charcoal/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.isFree ? (
                  <Button
                    asChild
                    className="w-full rounded-full font-medium bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-cream"
                  >
                    <Link to="/analizar-gratis">{plan.cta}</Link>
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePlanClick(plan)}
                    disabled={loading || !consentDigital}
                    className={`w-full rounded-full font-medium ${
                      plan.highlighted
                        ? "bg-charcoal text-cream hover:bg-charcoal/90"
                        : "bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-cream"
                    }`}
                  >
                    {loading ? "Cargando..." : plan.cta}
                  </Button>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default B2CPricing;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const SubscriptionCard = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const monthlyPrice = "12";
  const annualPrice = "99";
  const savings = "45";

  const features = [
    "Alertas de renovación de contrato",
    "Notificaciones de cambios legislativos",
    "Análisis incluido en cada renovación",
    "Historial de análisis",
  ];

  return (
    <div className="relative bg-white rounded-2xl p-8 transition-all duration-300 hover:shadow-lg h-full border border-charcoal/10 shadow-sm">
      <div className="mb-6">
        <h3 className="font-serif text-lg font-medium text-charcoal mb-4">
          Suscripción
        </h3>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              !isAnnual
                ? "bg-charcoal text-cream"
                : "bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
              isAnnual
                ? "bg-charcoal text-cream"
                : "bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
            }`}
          >
            Anual
          </button>
        </div>

        <div className="flex items-baseline justify-center gap-1">
          <span className="font-serif text-4xl font-semibold text-charcoal">
            €{isAnnual ? annualPrice : monthlyPrice}
          </span>
          <span className="text-charcoal/60 text-sm">
            {isAnnual ? "/año" : "/mes"}
          </span>
        </div>

        {isAnnual && (
          <p className="text-center text-sm text-green-600 font-medium mt-2">
            Ahorra {savings}€ al año
          </p>
        )}

        <p className="text-sm text-charcoal/60 mt-3 text-center">
          Para usuarios que ya han analizado un contrato con nosotros
        </p>
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className="w-4 h-4 text-charcoal mt-0.5 flex-shrink-0" />
            <span className="text-sm text-charcoal/80">{feature}</span>
          </li>
        ))}
      </ul>

      <Button className="w-full rounded-full font-medium bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-cream">
        Suscribirse
      </Button>
    </div>
  );
};

export default SubscriptionCard;

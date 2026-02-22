import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";
import WaitlistModal from "@/components/WaitlistModal";

const features = [
  "Alertas de renovación de contrato",
  "Notificaciones de cambios legislativos",
  "Análisis incluido en cada renovación",
  "Historial de análisis",
];

const PostPurchaseUpsell = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const monthlyPrice = "12";
  const annualPrice = "99";

  return (
    <FadeIn>
      <div className="bg-white rounded-2xl border border-charcoal/10 shadow-lg overflow-hidden max-w-lg mx-auto">
        <div className="bg-charcoal px-8 py-6 text-center">
          <div className="flex justify-center mb-3">
            <Shield className="w-8 h-8 text-cream/80" />
          </div>
          <h3 className="font-serif text-2xl font-medium text-cream mb-2">
            Protege tu contrato todo el año
          </h3>
          <p className="text-cream/70 text-sm leading-relaxed">
            Ya analizaste tu contrato. Ahora mantén la tranquilidad con monitorización continua.
          </p>
        </div>

        <div className="px-8 py-7">
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                !isAnnual ? "bg-charcoal text-cream" : "bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                isAnnual ? "bg-charcoal text-cream" : "bg-charcoal/10 text-charcoal hover:bg-charcoal/20"
              }`}
            >
              Anual
            </button>
          </div>

          <div className="text-center mb-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-serif text-5xl font-semibold text-charcoal">
                €{isAnnual ? annualPrice : monthlyPrice}
              </span>
              <span className="text-charcoal/60 text-sm">{isAnnual ? "/año" : "/mes"}</span>
            </div>
            {isAnnual && (
              <p className="text-sm text-green-600 font-medium mt-1">2 meses gratis</p>
            )}
          </div>

          <ul className="space-y-3 mt-6 mb-7">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-charcoal mt-0.5 flex-shrink-0" />
                <span className="text-sm text-charcoal/80">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={() => setWaitlistOpen(true)}
            className="w-full rounded-full font-medium bg-charcoal text-cream hover:bg-charcoal/90"
          >
            Unirme a la lista
          </Button>

          <p className="text-center text-xs text-charcoal/40 mt-3">
            Cancela cuando quieras · Sin permanencia
          </p>
        </div>
      </div>

      <WaitlistModal
        open={waitlistOpen}
        onOpenChange={setWaitlistOpen}
        planName={`Suscripción ${isAnnual ? "Anual" : "Mensual"}`}
        source="post_purchase_upsell"
      />
    </FadeIn>
  );
};

export default PostPurchaseUpsell;

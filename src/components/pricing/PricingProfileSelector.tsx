import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import B2CPricing from "./B2CPricing";
import LandlordPricing from "./LandlordPricing";
import B2BPricing from "./B2BPricing";

type Profile = "inquilino" | "propietario" | "profesional";

const profiles: { id: Profile; label: string; subtitle: string }[] = [
  {
    id: "inquilino",
    label: "Soy inquilino",
    subtitle: "Revisa tu contrato antes de firmar",
  },
  {
    id: "propietario",
    label: "Soy propietario",
    subtitle: "Genera contratos legales y protege tus inmuebles",
  },
  {
    id: "profesional",
    label: "Soy profesional",
    subtitle: "Informes con tu marca para tus clientes",
  },
];

const PricingProfileSelector = () => {
  const [active, setActive] = useState<Profile>("inquilino");

  const current = profiles.find((p) => p.id === active)!;

  return (
    <div>
      {/* Selector */}
      <section className="py-12 bg-background border-b border-charcoal/8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-6">
            {/* Pills */}
            <div className="inline-flex items-center gap-1 bg-muted p-1.5 rounded-full">
              {profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActive(p.id)}
                  className={`relative px-6 py-2.5 text-sm font-medium rounded-full transition-all duration-300 ${
                    active === p.id
                      ? "bg-charcoal text-cream shadow-sm"
                      : "text-charcoal/70 hover:text-charcoal"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Subtitle */}
            <AnimatePresence mode="wait">
              <motion.p
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-charcoal/60 text-base text-center"
              >
                {current.subtitle}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {active === "inquilino" && <B2CPricing />}
          {active === "propietario" && <LandlordPricing />}
          {active === "profesional" && <B2BPricing />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PricingProfileSelector;

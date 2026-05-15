import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudienceFlag, getAudienceLabel } from "@/lib/features";

interface Props {
  audience: AudienceFlag;
  onCtaClick: () => void;
}

const ComingSoonBanner = ({ audience, onCtaClick }: Props) => {
  return (
    <div className="bg-amber-50/90 border-b border-amber-200 text-amber-900">
      <div className="container mx-auto px-6 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-start sm:items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 mt-0.5 sm:mt-0 flex-shrink-0 text-amber-700" />
            <p>
              <span className="font-medium">Próximamente</span> — Estamos
              terminando los últimos detalles para {getAudienceLabel(audience)}.
              Déjanos tu email y te avisamos en cuanto esté disponible.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onCtaClick}
            className="rounded-full border-amber-700/40 text-amber-900 hover:bg-amber-100 hover:text-amber-900 flex-shrink-0"
          >
            Avísame
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonBanner;

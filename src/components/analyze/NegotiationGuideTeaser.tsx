import { FileText, Lock, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  generatedLetter: string;
  problematicClausesCount: number;
  perspective: "tenant" | "landlord";
  price: string;
  onUnlock: () => void;
  disabled?: boolean;
}

const NegotiationGuideTeaser = ({
  generatedLetter,
  problematicClausesCount,
  perspective,
  price,
  onUnlock,
  disabled,
}: Props) => {
  const isLandlord = perspective === "landlord";
  const audienceLabel = isLandlord ? "consensuar con tu inquilino" : "reclamar a tu propietario";

  // Limpia markdown básico para preview legible
  const previewClean = generatedLetter
    .replace(/^#+\s/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const visiblePreview = previewClean.slice(0, 320);
  const blurredPreview = previewClean.slice(320, 800);

  return (
    <Card className="border-2 border-foreground/20 bg-gradient-to-br from-cream to-muted shadow-lg overflow-hidden">
      <CardContent className="pt-6 pb-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-xl md:text-2xl font-semibold text-foreground leading-tight">
              Tu Guía de Negociación está lista
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hemos preparado{" "}
              <strong className="text-foreground">{problematicClausesCount} puntos específicos</strong> para{" "}
              {audienceLabel}.
            </p>
          </div>
        </div>

        <div className="relative rounded-lg border border-foreground/10 bg-background/60 p-4 overflow-hidden">
          <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">{visiblePreview}…</p>
          {blurredPreview && (
            <p
              className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed mt-2 select-none pointer-events-none"
              style={{ filter: "blur(4px)" }}
              aria-hidden
            >
              {blurredPreview}
            </p>
          )}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/90 to-transparent flex flex-col items-center justify-end pb-4 gap-2">
            <div className="w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-foreground" />
            </div>
            <p className="text-xs font-medium text-foreground/80 text-center px-4">
              Desbloquea la guía completa + email + burofax
            </p>
          </div>
        </div>

        <Button
          onClick={onUnlock}
          disabled={disabled}
          size="lg"
          className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full font-medium"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Desbloquear por {price}
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>✓ Descarga inmediata</span>
          <span>✓ PDF + email + burofax</span>
          <span>✓ Pago seguro Paddle</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default NegotiationGuideTeaser;

import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowRight, CheckCircle, Loader2, Shield } from "lucide-react";

interface PaymentPlaceholderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  perspective?: "tenant" | "landlord";
}

const PaymentPlaceholder = ({ open, onOpenChange, analysisId, perspective = "tenant" }: PaymentPlaceholderProps) => {
  const { user } = useAuth();
  const { openCheckout, loading } = usePaddleCheckout();

  const isLandlord = perspective === "landlord";
  const priceId = isLandlord ? "propietario_unico_price" : "analisis_unico_price";
  const priceDisplay = isLandlord ? "29,00€" : "14,99€";

  const handleCheckout = async () => {
    try {
      localStorage.setItem("acroxia_return_url", `/resultado-previo/${analysisId}`);

      await openCheckout({
        priceId,
        quantity: 1,
        customerEmail: user?.email || undefined,
        customData: {
          userId: user?.id || "",
          analysisId,
          perspective,
          sessionId: localStorage.getItem("acroxia_session_id") || "",
          userType: localStorage.getItem("acroxia_user_type") || "inquilino",
        },
        successUrl: user
          ? `${window.location.origin}/resultado/${analysisId}`
          : `${window.location.origin}/registro?checkout=success&analysisId=${analysisId}`,
      });

      onOpenChange(false);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Error al abrir el checkout. Inténtalo de nuevo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-center">Informe completo</DialogTitle>
          <DialogDescription className="text-center">
            Desbloquea el análisis detallado de todas las cláusulas de tu contrato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground mb-1">{priceDisplay}</div>
            <p className="text-xs text-muted-foreground">Pago único · Incluye registro gratuito</p>
          </div>

          <ul className="text-sm space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Análisis de todas las cláusulas
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Consejos de negociación
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Referencias legales verificadas
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              100% confidencial
            </li>
          </ul>

          <Button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              <>
                Desbloquear informe · {priceDisplay}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPlaceholder;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Mail, CheckCircle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { trackConversion } from "@/lib/analytics";

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
  illegalCount: number;
  suspiciousCount: number;
}

const LeadCaptureModal = ({
  open,
  onOpenChange,
  analysisId,
  illegalCount,
  suspiciousCount,
}: LeadCaptureModalProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [contractStatus, setContractStatus] = useState<string>("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const problemCount = illegalCount + suspiciousCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !contractStatus || !acceptedPrivacy) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get session ID from localStorage
      const sessionId = localStorage.getItem("acroxia_session_id");

      // Get UTM params from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("utm_source");
      const utmMedium = urlParams.get("utm_medium");
      const utmCampaign = urlParams.get("utm_campaign");

      // Save lead to database
      const { error: leadError } = await supabase
        .from("leads")
        .insert({
          email,
          session_id: sessionId,
          analysis_id: analysisId,
          contract_status: contractStatus,
          source: "analysis_preview",
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        });

      if (leadError) throw leadError;

      // Update anonymous_analyses with email using secure RPC
      await supabase.rpc("update_anonymous_analysis_email", {
        analysis_uuid: analysisId,
        new_email: email,
        new_contract_status: contractStatus,
      });

      // Send email with summary
      const { error: emailError } = await supabase.functions.invoke(
        "send-lead-email",
        {
          body: { 
            email, 
            analysisId,
            contractStatus,
          },
        }
      );

      if (emailError) {
        console.error("Error sending email:", emailError);
        // Don't throw - lead was saved, email might have failed
      }

      // Track lead captured
      trackConversion('lead_captured', {
        analysis_id: analysisId,
        contract_status: contractStatus,
        source: 'analysis_preview',
      });

      setSuccess(true);
      toast({
        title: "¡Listo!",
        description: "Te avisaremos antes de que expire tu análisis.",
      });

    } catch (error: any) {
      console.error("Error saving lead:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el resumen. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="font-serif text-2xl mb-2">
              ¡Todo listo!
            </DialogTitle>
            <DialogDescription className="mb-6">
              Te enviaremos un recordatorio a <strong>{email}</strong> antes de que expire tu análisis.
            </DialogDescription>
            
            <div className="space-y-3">
              <Button 
                onClick={() => onOpenChange(false)}
                className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
              >
                Volver al análisis
              </Button>
              <p className="text-xs text-muted-foreground">
                ¿Quieres el informe completo?{" "}
                <button 
                  onClick={() => {
                    onOpenChange(false);
                    // Trigger payment modal from parent
                  }}
                  className="underline hover:no-underline"
                >
                  Desbloquéalo por 39€
                </button>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {problemCount} problema{problemCount !== 1 ? 's' : ''} detectado{problemCount !== 1 ? 's' : ''}
            </span>
          </div>
          <DialogTitle className="font-serif text-2xl">
            ¿Quieres que te avisemos?
          </DialogTitle>
          <DialogDescription>
            Te enviaremos un recordatorio antes de que expire tu análisis y ofertas exclusivas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Contract Status */}
          <div className="space-y-3">
            <Label>¿Cuál es tu situación?</Label>
            <RadioGroup 
              value={contractStatus} 
              onValueChange={setContractStatus}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="not_signed" id="not_signed" />
                <Label htmlFor="not_signed" className="cursor-pointer flex-1">
                  Aún no he firmado, estoy evaluando
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="signed_want_claim" id="signed_want_claim" />
                <Label htmlFor="signed_want_claim" className="cursor-pointer flex-1">
                  Ya firmé pero quiero reclamar
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="need_another" id="need_another" />
                <Label htmlFor="need_another" className="cursor-pointer flex-1">
                  Necesito analizar otro contrato
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Privacy Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer">
              Acepto recibir recordatorios y comunicaciones de ACROXIA. Puedo darme de baja en cualquier momento.{" "}
              <Link to="/privacidad" target="_blank" className="underline hover:no-underline">
                Política de privacidad
              </Link>
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !email || !contractStatus || !acceptedPrivacy}
            className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
          >
            {loading ? "Guardando..." : "Activar recordatorio"}
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>No spam. Solo información útil.</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadCaptureModal;

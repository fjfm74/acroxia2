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
import { 
  CreditCard, Mail, CheckCircle, Lock, Sparkles, 
  FileText, MessageSquare, Scale, Bell 
} from "lucide-react";
import { Link } from "react-router-dom";

interface PaymentPlaceholderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
}

const PaymentPlaceholder = ({
  open,
  onOpenChange,
  analysisId,
}: PaymentPlaceholderProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email requerido",
        description: "Por favor, introduce tu email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Save purchase intent
      const { error } = await supabase
        .from("purchase_intents")
        .insert({
          analysis_id: analysisId,
          email,
          amount_cents: 990,
          currency: "eur",
          status: "pending",
        });

      if (error) throw error;

      // Update anonymous_analyses with email if not already set
      await supabase
        .from("anonymous_analyses")
        .update({ email })
        .eq("id", analysisId)
        .is("email", null);

      setSuccess(true);
      toast({
        title: "¡Te avisaremos!",
        description: "Recibirás un email cuando los pagos estén disponibles.",
      });

    } catch (error: any) {
      console.error("Error saving purchase intent:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu solicitud. Inténtalo de nuevo.",
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
              <Bell className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="font-serif text-2xl mb-2">
              ¡Te avisaremos!
            </DialogTitle>
            <DialogDescription className="mb-6">
              Cuando los pagos estén disponibles, te enviaremos un email a <strong>{email}</strong> con 
              un enlace para desbloquear tu informe completo.
            </DialogDescription>
            
            <Button 
              onClick={() => onOpenChange(false)}
              className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
            >
              Volver al análisis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Próximamente</span>
          </div>
          <DialogTitle className="font-serif text-2xl">
            Informe completo por 9,90€
          </DialogTitle>
          <DialogDescription>
            Estamos terminando de configurar los pagos. Déjanos tu email y te avisaremos en cuanto esté disponible.
          </DialogDescription>
        </DialogHeader>

        {/* What's included */}
        <div className="py-4 space-y-3">
          <p className="text-sm font-medium text-foreground">El informe incluye:</p>
          <div className="grid gap-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-green-100">
                <FileText className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Análisis completo de todas las cláusulas</p>
                <p className="text-xs text-muted-foreground">Con explicación legal detallada</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-blue-100">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Consejos de negociación personalizados</p>
                <p className="text-xs text-muted-foreground">Qué decir al propietario para modificar cláusulas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-amber-100">
                <Scale className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Referencias legales verificadas</p>
                <p className="text-xs text-muted-foreground">Artículos de la LAU aplicables a tu caso</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded bg-red-100">
                <CreditCard className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Carta de reclamación (si aplica)</p>
                <p className="text-xs text-muted-foreground">Lista para enviar al arrendador</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleNotifyMe} className="space-y-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Déjanos tu email y te avisaremos cuando puedas pagar:
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="payment-email" className="sr-only">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="payment-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
          >
            {loading ? "Guardando..." : "Avísame cuando esté disponible"}
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Tus datos están protegidos. Sin spam.</span>
          </div>
        </form>

        {/* Alternative CTA */}
        <div className="text-center text-sm text-muted-foreground pt-2 border-t">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="underline hover:no-underline text-foreground">
            Inicia sesión
          </Link>
          {" "}para acceder con créditos.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentPlaceholder;

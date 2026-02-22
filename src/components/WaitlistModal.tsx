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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, CheckCircle, Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { trackConversion } from "@/lib/analytics";
import { emailSchema, fullNameSchema } from "@/lib/validations";

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string;
  source?: string;
  analysisId?: string;
}

const WaitlistModal = ({
  open,
  onOpenChange,
  planName,
  source = "waitlist",
  analysisId,
}: WaitlistModalProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({ title: "Email inválido", description: emailResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    const nameResult = fullNameSchema.safeParse(name);
    if (!nameResult.success) {
      toast({ title: "Nombre inválido", description: nameResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (!userType) {
      toast({ title: "Selecciona tu perfil", description: "Necesitamos saber qué tipo de cliente eres.", variant: "destructive" });
      return;
    }
    if (!gdprConsent) {
      toast({ title: "Consentimiento requerido", description: "Debes aceptar la política de privacidad.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = emailResult.data;
      const normalizedName = nameResult.data;

      // Save to purchase_intents if we have an analysisId
      if (analysisId) {
        await supabase.from("purchase_intents").insert({
          analysis_id: analysisId,
          email: normalizedEmail,
          amount_cents: 0,
          currency: "eur",
          status: "waitlist",
        });
      }

      // Save lead
      await supabase.from("leads").insert({
        email: normalizedEmail,
        source: source,
        contract_status: userType,
      });

      // Save to marketing_contacts if marketing consent
      if (marketingConsent) {
        await supabase.from("marketing_contacts").insert({
          email: normalizedEmail,
          contact_name: normalizedName,
          segment: userType === "profesional" ? "profesional" : userType === "propietario" ? "propietario" : "inquilino",
          source: "waitlist",
          consent_type: "explicit",
          consent_details: `Waitlist ${planName || "general"} - marketing consent`,
        });
      }

      trackConversion("waitlist_signup", {
        plan_name: planName,
        source,
        user_type: userType,
        marketing_consent: marketingConsent,
      });

      setSuccess(true);
      toast({ title: "¡Te has unido a la lista!", description: "Te avisaremos cuando estemos listos." });
    } catch (error: any) {
      console.error("Waitlist error:", error);
      toast({ title: "Error", description: "No se pudo guardar. Inténtalo de nuevo.", variant: "destructive" });
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
            <DialogTitle className="font-serif text-2xl mb-2">¡Estás en la lista!</DialogTitle>
            <DialogDescription className="mb-6">
              Te avisaremos a <strong>{email}</strong> en cuanto {planName ? `el plan "${planName}"` : "la plataforma"} esté disponible.
            </DialogDescription>
            <Button onClick={() => onOpenChange(false)} className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full">
              Entendido
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
            {planName ? `Únete a la lista: ${planName}` : "Únete a la lista de espera"}
          </DialogTitle>
          <DialogDescription>
            Estamos ultimando los detalles. Déjanos tus datos y serás de los primeros en acceder.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="waitlist-name">Nombre *</Label>
            <Input
              id="waitlist-name"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="waitlist-email">Email *</Label>
            <Input
              id="waitlist-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* User type */}
          <div className="space-y-2">
            <Label htmlFor="waitlist-type">¿Qué tipo de cliente eres? *</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger id="waitlist-type">
                <SelectValue placeholder="Selecciona tu perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inquilino">Inquilino</SelectItem>
                <SelectItem value="propietario">Propietario</SelectItem>
                <SelectItem value="profesional">Profesional (gestoría, inmobiliaria...)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* GDPR Consent */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="waitlist-gdpr"
              checked={gdprConsent}
              onCheckedChange={(checked) => setGdprConsent(checked === true)}
            />
            <Label htmlFor="waitlist-gdpr" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Acepto la{" "}
              <Link to="/privacidad" className="underline hover:text-foreground" target="_blank">
                política de privacidad
              </Link>{" "}
              y el tratamiento de mis datos para gestionar mi solicitud. *
            </Label>
          </div>

          {/* Marketing Consent */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="waitlist-marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked === true)}
            />
            <Label htmlFor="waitlist-marketing" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Acepto recibir comunicaciones comerciales y novedades de ACROXIA por email.
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading || !gdprConsent || !email || !name || !userType}
            className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
          >
            {loading ? "Guardando..." : "Unirme a la lista de espera"}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Tus datos están protegidos. Sin spam.</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;

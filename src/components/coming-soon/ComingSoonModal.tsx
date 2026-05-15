import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { AudienceFlag, getAudienceLabel } from "@/lib/features";

interface Props {
  audience: AudienceFlag;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const subtitleByAudience = (a: AudienceFlag) => {
  switch (a) {
    case "propietario":
      return "Estamos terminando los últimos detalles del análisis para propietarios. Te avisaremos en cuanto esté listo.";
    case "profesional_inmobiliarias":
      return "Plan profesional para inmobiliarias en preparación. Te avisaremos en cuanto esté listo.";
    case "profesional_gestorias":
      return "Plan profesional para gestorías en preparación. Te avisaremos en cuanto esté listo.";
  }
};

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const ComingSoonModal = ({ audience, open, onOpenChange }: Props) => {
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = isValidEmail(email) && accepted && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("waitlist_audiences").insert({
        email: email.trim().toLowerCase(),
        audience,
        source_url:
          typeof window !== "undefined" ? window.location.pathname : null,
        accepted_rgpd_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("¡Listo! Te avisaremos por email cuando esté disponible.");
      setEmail("");
      setAccepted(false);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-cream">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-700 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Próximamente
            </span>
          </div>
          <DialogTitle className="font-serif text-2xl text-charcoal">
            Sé el primero en saberlo
          </DialogTitle>
          <DialogDescription className="text-charcoal/70">
            {subtitleByAudience(audience)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="cs-email" className="text-charcoal">
              Tu email
            </Label>
            <Input
              id="cs-email"
              type="email"
              required
              autoComplete="email"
              placeholder={`tu@email.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="cs-rgpd"
              checked={accepted}
              onCheckedChange={(c) => setAccepted(c === true)}
              className="mt-1"
            />
            <Label
              htmlFor="cs-rgpd"
              className="text-xs text-charcoal/70 leading-relaxed font-normal"
            >
              Acepto la{" "}
              <Link
                to="/legal/privacidad"
                target="_blank"
                className="underline hover:text-charcoal"
              >
                Política de Privacidad
              </Link>{" "}
              y autorizo el envío de un email cuando esté disponible para{" "}
              {getAudienceLabel(audience)}.
            </Label>
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-charcoal text-cream hover:bg-charcoal/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Avísame"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ComingSoonModal;

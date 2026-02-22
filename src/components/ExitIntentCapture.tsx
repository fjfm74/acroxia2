import { useState, useEffect, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { trackConversion } from "@/lib/analytics";

const STORAGE_KEY = "acroxia_exit_intent_shown";

const ExitIntentCapture = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const showPopup = useCallback(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, "true");
    setOpen(true);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // Desktop: mouse leaves viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) showPopup();
    };

    // Mobile: 30s inactivity timer
    const mobileTimer = setTimeout(() => {
      if (window.innerWidth < 768) showPopup();
    }, 30000);

    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      clearTimeout(mobileTimer);
    };
  }, [showPopup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !acceptedPrivacy) return;

    setLoading(true);
    try {
      const sessionId = localStorage.getItem("acroxia_session_id") || crypto.randomUUID();
      const urlParams = new URLSearchParams(window.location.search);

      await supabase.from("leads").insert({
        email,
        session_id: sessionId,
        source: "exit_intent",
        utm_source: urlParams.get("utm_source"),
        utm_medium: urlParams.get("utm_medium"),
        utm_campaign: urlParams.get("utm_campaign"),
      });

      trackConversion("lead_captured", { source: "exit_intent" });
      setSuccess(true);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="font-serif text-2xl mb-2">¡Listo!</DialogTitle>
            <DialogDescription>
              Te enviaremos información útil a <strong>{email}</strong>.
            </DialogDescription>
            <Button
              onClick={() => setOpen(false)}
              className="mt-6 bg-foreground text-background hover:bg-foreground/90 rounded-full"
            >
              Continuar navegando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">Antes de irte…</span>
          </div>
          <DialogTitle className="font-serif text-2xl">
            Tu contrato podría tener cláusulas ilegales
          </DialogTitle>
          <DialogDescription>
            Recibe gratis las 5 cláusulas abusivas más comunes en contratos de alquiler en 2026.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="flex items-start gap-3">
            <Checkbox
              id="exit-privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(c) => setAcceptedPrivacy(c as boolean)}
              className="mt-1"
            />
            <Label htmlFor="exit-privacy" className="text-sm text-muted-foreground cursor-pointer">
              Acepto recibir comunicaciones de ACROXIA.{" "}
              <Link to="/privacidad" target="_blank" className="underline hover:no-underline">
                Política de privacidad
              </Link>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading || !email || !acceptedPrivacy}
            className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
          >
            {loading ? "Enviando..." : "Enviar guía gratis"}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Sin spam. Baja en cualquier momento.</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentCapture;

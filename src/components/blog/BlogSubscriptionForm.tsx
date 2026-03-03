import { useState } from "react";
import { Bell, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { emailSchema } from "@/lib/validations";

interface BlogSubscriptionFormProps {
  selectedAudience: "inquilino" | "propietario";
}

const BlogSubscriptionForm = ({ selectedAudience }: BlogSubscriptionFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [successMessage, setSuccessMessage] = useState(
    "Te hemos enviado un email de confirmación. Haz clic en el enlace para activar tu suscripción.",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email with Zod
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setStatus("error");
      setErrorMessage(emailResult.error.errors[0].message);
      return;
    }
    const validatedEmail = emailResult.data;

    if (!gdprConsent) {
      setStatus("error");
      setErrorMessage("Debes aceptar la Política de Privacidad para suscribirte.");
      return;
    }

    setIsSubscribing(true);
    setStatus("idle");
    setSuccessMessage("Te hemos enviado un email de confirmación. Haz clic en el enlace para activar tu suscripción.");
    setErrorMessage("");

    try {
      // Get user's IP address
      let ipAddress = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ipAddress = ipData.ip;
      } catch {
        console.warn("Could not get IP address");
      }

      const now = new Date().toISOString();

      // Insert into blog_subscribers with GDPR fields
      const { error: insertError } = await supabase.from("blog_subscribers").insert({
        email: validatedEmail,
        audience: selectedAudience,
        name: name.trim() || null,
        gdpr_consent: true,
        gdpr_consent_at: now,
        ip_address: ipAddress,
      });

      if (insertError) {
        // Unique constraint violation = already subscribed
        if (insertError.code === "23505") {
          const { data: existingSubscriber, error: existingError } = await supabase
            .from("blog_subscribers")
            .select("confirmed, unsubscribed")
            .eq("email", validatedEmail)
            .eq("audience", selectedAudience)
            .maybeSingle();

          if (existingError || !existingSubscriber) {
            throw existingError || insertError;
          }

          if (existingSubscriber.unsubscribed) {
            setStatus("error");
            setErrorMessage("Este email está dado de baja. Escríbenos si quieres reactivarlo manualmente.");
          } else if (existingSubscriber.confirmed) {
            setSuccessMessage("Este email ya estaba suscrito y confirmado.");
            setStatus("success");
            setName("");
            setEmail("");
            setGdprConsent(false);
          } else {
            await supabase.functions.invoke("send-blog-confirmation", {
              body: { email: validatedEmail, audience: selectedAudience },
            });
            setSuccessMessage("Este email ya existía. Te hemos reenviado el email de confirmación.");
            setStatus("success");
            setName("");
            setEmail("");
            setGdprConsent(false);
          }
        } else {
          throw insertError;
        }
      } else {
        // Send confirmation email
        await supabase.functions.invoke("send-blog-confirmation", {
          body: { email: validatedEmail, audience: selectedAudience },
        });
        setStatus("success");
        setName("");
        setEmail("");
        setGdprConsent(false);
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      setStatus("error");
      setErrorMessage("Ha ocurrido un error. Inténtalo de nuevo.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const audienceLabel = selectedAudience === "inquilino" ? "inquilinos" : "propietarios";

  if (status === "success") {
    return (
      <div className="bg-muted rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="font-medium text-foreground">¡Casi listo!</h3>
        </div>
        <p className="text-sm text-muted-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-2xl p-6 border border-border">
      <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-3">
        <Bell className="w-5 h-5 text-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">¿Quieres recibir nuevos artículos?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Te avisamos cuando publiquemos contenido para {audienceLabel}.
      </p>
      <form onSubmit={handleSubscribe} className="space-y-3">
        <Input
          type="text"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubscribing}
          className="bg-background"
        />
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubscribing}
          className="bg-background"
        />

        {/* GDPR Consent Checkbox */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="gdpr-consent"
            checked={gdprConsent}
            onCheckedChange={(checked) => setGdprConsent(checked as boolean)}
            className="mt-0.5"
          />
          <Label htmlFor="gdpr-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
            Acepto la{" "}
            <Link to="/privacidad" className="text-primary hover:underline" target="_blank">
              Política de Privacidad
            </Link>{" "}
            y recibir emails con nuevos artículos.
          </Label>
        </div>

        <Button type="submit" className="w-full rounded-full" disabled={isSubscribing || !email || !gdprConsent}>
          {isSubscribing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Suscribiendo...
            </>
          ) : (
            "Suscribirme"
          )}
        </Button>
      </form>
      {status === "error" && (
        <div className="flex items-center gap-2 mt-3 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-3 text-center">Sin spam. Cancela cuando quieras.</p>
    </div>
  );
};

export default BlogSubscriptionForm;

import { useState } from "react";
import { Bell, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BlogSubscriptionFormProps {
  selectedAudience: "inquilino" | "propietario";
}

const BlogSubscriptionForm = ({ selectedAudience }: BlogSubscriptionFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      // Insert into blog_subscribers
      const { error: insertError } = await supabase
        .from("blog_subscribers")
        .insert({ 
          email: email.toLowerCase().trim(), 
          audience: selectedAudience 
        });

      if (insertError) {
        // Unique constraint violation = already subscribed
        if (insertError.code === "23505") {
          setStatus("success");
          setEmail("");
        } else {
          throw insertError;
        }
      } else {
        // Send confirmation email
        await supabase.functions.invoke("send-blog-confirmation", {
          body: { email: email.toLowerCase().trim(), audience: selectedAudience }
        });
        setStatus("success");
        setEmail("");
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
        <p className="text-sm text-muted-foreground">
          Te hemos enviado un email de confirmación. Haz clic en el enlace para activar tu suscripción.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-2xl p-6 border border-border">
      <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center mb-3">
        <Bell className="w-5 h-5 text-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">
        ¿Quieres recibir nuevos artículos?
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Te avisamos cuando publiquemos contenido para {audienceLabel}.
      </p>
      <form onSubmit={handleSubscribe} className="space-y-3">
        <Input
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubscribing}
          className="bg-background"
        />
        <Button 
          type="submit" 
          className="w-full rounded-full"
          disabled={isSubscribing || !email}
        >
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
      <p className="text-xs text-muted-foreground mt-3 text-center">
        Sin spam. Cancela cuando quieras.
      </p>
    </div>
  );
};

export default BlogSubscriptionForm;

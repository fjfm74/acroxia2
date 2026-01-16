import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const FooterSubscriptionForm = () => {
  const [audience, setAudience] = useState<"inquilino" | "propietario">("inquilino");
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
      const { error: insertError } = await supabase
        .from("blog_subscribers")
        .insert({ 
          email: email.toLowerCase().trim(), 
          audience 
        });

      if (insertError) {
        if (insertError.code === "23505") {
          setStatus("success");
          setEmail("");
        } else {
          throw insertError;
        }
      } else {
        await supabase.functions.invoke("send-blog-confirmation", {
          body: { email: email.toLowerCase().trim(), audience }
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

  if (status === "success") {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <p className="text-sm text-foreground">
          ¡Revisa tu email para confirmar la suscripción!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector de audiencia */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setAudience("inquilino")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            audience === "inquilino" 
              ? "bg-foreground text-background" 
              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
          }`}
        >
          Soy inquilino
        </button>
        <button
          type="button"
          onClick={() => setAudience("propietario")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            audience === "propietario" 
              ? "bg-foreground text-background" 
              : "bg-foreground/10 text-foreground hover:bg-foreground/20"
          }`}
        >
          Soy propietario
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <Input 
          type="email" 
          placeholder="tu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubscribing}
          className="flex-1 bg-background"
        />
        <Button 
          type="submit" 
          className="rounded-full px-6"
          disabled={isSubscribing || !email}
        >
          {isSubscribing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Suscribirme"
          )}
        </Button>
      </form>

      {status === "error" && (
        <div className="flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{errorMessage}</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Sin spam. Cancela cuando quieras.
      </p>
    </div>
  );
};

export default FooterSubscriptionForm;

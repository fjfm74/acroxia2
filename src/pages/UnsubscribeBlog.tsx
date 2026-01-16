import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";

const unsubscribeReasons = [
  { value: "too_frequent", label: "Recibo demasiados emails" },
  { value: "not_relevant", label: "El contenido no me interesa" },
  { value: "no_longer_renting", label: "Ya no estoy buscando alquiler" },
  { value: "other", label: "Otro motivo" },
];

const UnsubscribeBlog = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  
  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const handleUnsubscribe = async () => {
    if (!email || !token) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const finalReason = reason === "other" ? otherReason : reason;

      // Update subscriber
      const { error } = await supabase
        .from("blog_subscribers")
        .update({
          unsubscribed: true,
          unsubscribe_reason: finalReason || null,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", email.toLowerCase())
        .eq("confirmation_token", token);

      if (error) {
        throw error;
      }

      setStatus("success");
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setStatus("error");
    }
  };

  if (!email || !token) {
    return (
      <>
        <Helmet>
          <title>Darse de baja | ACROXIA Blog</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Header />
        <main className="min-h-screen bg-background pt-28 pb-20">
          <div className="container mx-auto px-6">
            <div className="max-w-lg mx-auto text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
              <h1 className="font-serif text-2xl font-semibold text-foreground mb-4">
                Enlace no válido
              </h1>
              <p className="text-muted-foreground mb-6">
                El enlace de baja no es válido. Por favor, utiliza el enlace que recibiste en tu email.
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/blog">Volver al blog</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Darse de baja | ACROXIA Blog</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-lg mx-auto">
            <FadeIn>
              {status === "success" ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h1 className="font-serif text-3xl font-semibold text-foreground mb-4">
                    Has sido dado de baja
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    Ya no recibirás emails del blog de ACROXIA en <strong>{email}</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    Si cambias de opinión, siempre puedes volver a suscribirte desde nuestro blog.
                  </p>
                  <Button asChild className="rounded-full">
                    <Link to="/blog">Volver al blog</Link>
                  </Button>
                </div>
              ) : (
                <div className="bg-card rounded-2xl p-8 shadow-lg">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                      <Mail className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                      ¿Seguro que quieres irte?
                    </h1>
                    <p className="text-muted-foreground">
                      Dejarás de recibir nuestros artículos en <strong>{email}</strong>.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-3">
                        ¿Por qué te vas? (opcional)
                      </p>
                      <RadioGroup value={reason} onValueChange={setReason}>
                        {unsubscribeReasons.map((item) => (
                          <div key={item.value} className="flex items-center space-x-3 py-2">
                            <RadioGroupItem value={item.value} id={item.value} />
                            <Label htmlFor={item.value} className="text-sm cursor-pointer">
                              {item.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {reason === "other" && (
                      <Textarea
                        placeholder="Cuéntanos más..."
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        className="resize-none"
                        rows={3}
                      />
                    )}

                    {status === "error" && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        Ha ocurrido un error. Inténtalo de nuevo.
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <Button
                        onClick={handleUnsubscribe}
                        disabled={status === "loading"}
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        {status === "loading" ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          "Confirmar baja"
                        )}
                      </Button>
                      <Button asChild className="w-full rounded-full">
                        <Link to="/blog">Mejor me quedo</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </FadeIn>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default UnsubscribeBlog;

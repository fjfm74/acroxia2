import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FadeIn from "@/components/animations/FadeIn";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

const UNSUBSCRIBE_REASONS = [
  { id: "too_many", label: "Recibo demasiados emails" },
  { id: "not_interested", label: "El contenido no me interesa" },
  { id: "found_place", label: "Ya encontré piso" },
  { id: "other", label: "Otro motivo" },
];

type PageState = "initial" | "processing" | "success" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<PageState>("initial");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleUnsubscribe = async () => {
    if (!email || !token) {
      setErrorMessage("Enlace de baja inválido. Por favor, usa el enlace del email.");
      setState("error");
      return;
    }

    setState("processing");

    try {
      const reason = selectedReason === "other" ? otherReason : 
        UNSUBSCRIBE_REASONS.find(r => r.id === selectedReason)?.label || "";

      const { data, error } = await supabase.functions.invoke("process-unsubscribe", {
        body: { email, token, reason },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Error al procesar la solicitud");
      }

      setState("success");
    } catch (error) {
      console.error("Error en unsubscribe:", error);
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido");
      setState("error");
    }
  };

  const maskedEmail = email ? 
    email.replace(/(.{2})(.*)(@.*)/, "$1***$3") : 
    "tu email";

  return (
    <>
      <Helmet>
        <title>Darse de baja | ACROXIA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header simple */}
        <header className="py-6 px-6 border-b border-foreground/5">
          <div className="container mx-auto">
            <Link to="/" className="font-serif text-2xl font-semibold text-foreground">
              ACROXIA
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <FadeIn className="w-full max-w-md">
            {state === "initial" && (
              <div className="bg-card rounded-2xl p-8 shadow-lg border border-foreground/5">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
                    ¿Seguro que quieres darte de baja?
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Dejarás de recibir emails en {maskedEmail}
                  </p>
                </div>

                <div className="mb-6 p-4 bg-muted rounded-xl">
                  <p className="text-sm text-foreground font-medium mb-2">
                    Ya no recibirás:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Tips sobre contratos de alquiler</li>
                    <li>• Ofertas exclusivas</li>
                    <li>• Novedades legales importantes</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-foreground font-medium mb-3">
                    Antes de irte... ¿podemos saber por qué?
                  </p>
                  <RadioGroup 
                    value={selectedReason} 
                    onValueChange={setSelectedReason}
                    className="space-y-2"
                  >
                    {UNSUBSCRIBE_REASONS.map((reason) => (
                      <div 
                        key={reason.id} 
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <RadioGroupItem value={reason.id} id={reason.id} />
                        <Label 
                          htmlFor={reason.id} 
                          className="text-sm cursor-pointer flex-1"
                        >
                          {reason.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  {selectedReason === "other" && (
                    <Textarea
                      placeholder="Cuéntanos más..."
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      className="mt-3"
                      rows={3}
                    />
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleUnsubscribe}
                    className="w-full rounded-full"
                    variant="destructive"
                  >
                    Confirmar baja
                  </Button>
                  <Button 
                    asChild
                    variant="ghost"
                    className="w-full"
                  >
                    <Link to="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver a la web
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {state === "processing" && (
              <div className="bg-card rounded-2xl p-8 shadow-lg border border-foreground/5 text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-foreground font-medium">Procesando tu solicitud...</p>
              </div>
            )}

            {state === "success" && (
              <div className="bg-card rounded-2xl p-8 shadow-lg border border-foreground/5 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                  Te has dado de baja
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Ya no recibirás más emails de nurturing en {maskedEmail}
                </p>
                <Button asChild className="rounded-full">
                  <Link to="/">Volver a ACROXIA</Link>
                </Button>
              </div>
            )}

            {state === "error" && (
              <div className="bg-card rounded-2xl p-8 shadow-lg border border-foreground/5 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
                  Ha ocurrido un error
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {errorMessage}
                </p>
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => setState("initial")}
                    className="rounded-full"
                  >
                    Reintentar
                  </Button>
                  <Button asChild variant="ghost">
                    <Link to="/contacto">Contactar soporte</Link>
                  </Button>
                </div>
              </div>
            )}
          </FadeIn>
        </main>

        {/* Footer simple */}
        <footer className="py-6 px-6 border-t border-foreground/5 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 ACROXIA. Todos los derechos reservados.
          </p>
        </footer>
      </div>
    </>
  );
};

export default Unsubscribe;

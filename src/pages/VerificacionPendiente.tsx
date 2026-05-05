import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 2500;

const VerificacionPendiente = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const emailFromQuery = searchParams.get("email") || "";
  const analysisId = searchParams.get("analysisId");
  const email = emailFromQuery || user?.email || "";

  const [resending, setResending] = useState(false);
  const isVerified = !!(user as any)?.email_confirmed_at;

  useEffect(() => {
    if (!analysisId || !user || !isVerified) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const { data, error } = await supabase.rpc("get_anonymous_analysis", { analysis_uuid: analysisId });
        if (cancelled) return;
        if (!error) {
          const row = Array.isArray(data) ? data[0] : data;
          const contractId = (row as any)?.converted_contract_id;
          if (contractId) {
            navigate(`/resultado/${contractId}`, { replace: true });
            return;
          }
        }
      } catch (e) {
        console.error("[VerificacionPendiente] poll error:", e);
      }
      if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [user, analysisId, isVerified, navigate]);

  const handleResend = async () => {
    if (!email) {
      toast.error("No tenemos tu email guardado. Vuelve al registro.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      toast.success("Email reenviado. Revisa tu bandeja de entrada.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo reenviar el email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Verificación pendiente | ACROXIA</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center py-32 px-4 bg-muted">
          <FadeIn>
            <Card className="w-full max-w-md text-center rounded-2xl shadow-2xl shadow-foreground/10">
              <CardContent className="pt-10 pb-10 space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className={`rounded-full p-4 ${isVerified ? "bg-green-100" : "bg-blue-100"}`}>
                    {isVerified ? (
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    ) : (
                      <Mail className="h-12 w-12 text-blue-600" />
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-3">
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
                    {isVerified ? "¡Email verificado!" : "Verifica tu email"}
                  </h1>
                  {!isVerified ? (
                    <>
                      <p className="text-muted-foreground">
                        Pago recibido y cuenta creada.
                        {email && (
                          <>{" "}Te hemos enviado un email a <strong>{email}</strong> con el enlace de verificación.</>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Verifica tu email para acceder a tu informe completo. Esta página detectará la verificación automáticamente.
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Estamos preparando tu informe… te redirigiremos en unos segundos.
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {!isVerified && (
                    <Button
                      onClick={handleResend}
                      disabled={resending}
                      className="rounded-full px-8"
                      size="lg"
                    >
                      {resending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Reenviando...
                        </>
                      ) : (
                        "Reenviar email de verificación"
                      )}
                    </Button>
                  )}

                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {isVerified ? "Vinculando tu informe…" : "Esperando confirmación…"}
                  </p>
                </div>

                {/* Help text */}
                <p className="text-xs text-muted-foreground">
                  ¿No te llega? Mira en spam o usa el botón de reenviar.
                  {!isVerified && (
                    <>{" "}También puedes <Link to="/login" className="underline">iniciar sesión</Link> después de verificar.</>
                  )}
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default VerificacionPendiente;

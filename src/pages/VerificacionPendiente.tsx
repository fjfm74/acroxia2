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

  // Estrategia:
  // - Escuchar onAuthStateChange: cuando la pestaña de verificación crea sesión
  //   en localStorage, esta pestaña recibe el evento SIGNED_IN/USER_UPDATED.
  // - En paralelo, hacer polling de la RPC pública get_anonymous_analysis
  //   (SECURITY DEFINER, no requiere auth) para detectar converted_contract_id.
  // - Cuando ambos están listos, redirigir al informe.
  // - Si solo hay session verificada (sin analysisId), redirigir a /dashboard.
  useEffect(() => {
    let cancelled = false;
    let hasVerifiedSession = !!(user as any)?.email_confirmed_at;
    let lastContractId: string | null = null;

    const tryNavigate = () => {
      if (cancelled) return;
      if (analysisId) {
        if (hasVerifiedSession && lastContractId) {
          navigate(`/resultado/${lastContractId}`, { replace: true });
        }
      } else if (hasVerifiedSession) {
        navigate("/dashboard", { replace: true });
      }
    };

    // Suscripción a cambios de auth (sincroniza desde la pestaña de verificación)
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && (session.user as any).email_confirmed_at) {
        hasVerifiedSession = true;
        tryNavigate();
      }
    });

    // Poll de la RPC pública + re-check de session
    const poll = async () => {
      try {
        // 1. Siempre re-check session (cross-tab fallback si onAuthStateChange no se disparó)
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && (session.user as any).email_confirmed_at) {
          hasVerifiedSession = true;
        }

        // 2. Si hay analysisId, polling del contract_id
        if (analysisId) {
          const { data, error } = await supabase.rpc("get_anonymous_analysis", {
            analysis_uuid: analysisId,
          });
          if (!cancelled && !error) {
            const row = Array.isArray(data) ? data[0] : data;
            const contractId = (row as any)?.converted_contract_id;
            if (contractId) {
              lastContractId = contractId;
            }
          }
        }

        // 3. Intentar navegar con lo que tengamos
        tryNavigate();
      } catch (e) {
        console.error("[VerificacionPendiente] poll error:", e);
      }
      if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
    };

    // Estado inicial: chequeo inmediato
    tryNavigate();
    poll();

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
    };
  }, [analysisId, navigate, user]);

  const handleResend = async () => {
    if (!email) {
      toast.error("No tenemos tu email guardado. Vuelve al registro.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.functions.invoke("send-verification-email", {
        body: { email, analysisId: analysisId || undefined, redirectOrigin: window.location.origin },
      });
      if (error) throw error;
      toast.success("Email reenviado. Revisa tu bandeja de entrada.");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo reenviar el email.");
    } finally {
      setResending(false);
    }
  };

  const headline = isVerified ? "¡Email verificado!" : "Verifica tu email";

  const intro = isVerified ? (
    <p className="text-muted-foreground">
      {analysisId
        ? "Estamos preparando tu informe… te redirigiremos en unos segundos."
        : "Te estamos llevando a tu panel…"}
    </p>
  ) : analysisId ? (
    <>
      <p className="text-muted-foreground">
        <strong className="text-foreground">Pago recibido</strong> y cuenta creada.
        {email && (
          <>
            {" "}
            Te hemos enviado un email a <strong>{email}</strong> con el enlace de verificación.
          </>
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        Verifica tu email para acceder a tu informe completo. Esta página detectará la verificación automáticamente.
      </p>
    </>
  ) : (
    <>
      <p className="text-muted-foreground">
        <strong className="text-foreground">Cuenta creada.</strong>
        {email && (
          <>
            {" "}
            Te hemos enviado un email a <strong>{email}</strong> con el enlace de verificación.
          </>
        )}
      </p>
      <p className="text-sm text-muted-foreground">
        Verifica tu email para activar tu cuenta. Esta página detectará la verificación automáticamente.
      </p>
    </>
  );

  return (
    <>
      <Helmet>
        <title>Verifica tu email | ContratoAlquiler</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
          <FadeIn>
            <Card className="max-w-md w-full text-center">
              <CardContent className="pt-10 pb-10 space-y-6">
                <div className="flex justify-center">
                  <div className={`rounded-full p-4 ${isVerified ? "bg-green-100" : "bg-amber-100"}`}>
                    {isVerified ? (
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    ) : (
                      <Mail className="h-12 w-12 text-amber-600" />
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="font-serif text-3xl font-semibold text-foreground">{headline}</h1>
                  {intro}
                </div>

                <div className="flex flex-col items-center gap-3">
                  {!isVerified && (
                    <Button onClick={handleResend} variant="outline" disabled={resending} className="w-full">
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

                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mt-2" />
                  <p className="text-xs text-muted-foreground">
                    {isVerified
                      ? analysisId
                        ? "Vinculando tu informe…"
                        : "Cargando tu panel…"
                      : "Esperando confirmación…"}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground border-t pt-4">
                  ¿No te llega? Mira en spam o usa el botón de reenviar.
                  {!isVerified && (
                    <>
                      {" "}
                      También puedes{" "}
                      <Link to="/login" className="underline hover:no-underline">
                        iniciar sesión
                      </Link>{" "}
                      después de verificar.
                    </>
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

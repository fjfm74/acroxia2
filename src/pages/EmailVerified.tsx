import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import SEOHead from "@/components/seo/SEOHead";
import { CheckCircle2, Loader2 } from "lucide-react";

const REDIRECT_SECONDS = 10;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 30_000;

const EmailVerified = () => {
  const { profile, loading, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // analysisId puede venir en la URL (emailRedirectTo) o en localStorage (fallback)
  const analysisIdFromUrl = searchParams.get("analysisId");
  const analysisIdFromStorage = typeof window !== "undefined" ? localStorage.getItem("acroxia_pending_analysis_id") : null;
  const analysisId = analysisIdFromUrl || analysisIdFromStorage;

  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const [waitingForContract, setWaitingForContract] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { redirectPath, buttonLabel } = useMemo(() => {
    if (profile?.user_type === "propietario") {
      return { redirectPath: "/propietario", buttonLabel: "Ir a mi panel de propietario" };
    }
    if (profile?.user_type === "profesional") {
      return { redirectPath: "/pro", buttonLabel: "Ir a mi panel profesional" };
    }
    return { redirectPath: "/dashboard", buttonLabel: "Ir a mi panel" };
  }, [profile]);

  // Si vino del flujo de pago (analysisId en URL), polling hasta encontrar
  // converted_contract_id y redirigir al informe completo (auto-login implícito
  // porque este tab ya tiene session tras procesar el token de verificación).
  useEffect(() => {
    if (loading) return;
    if (!analysisId) return; // Comportamiento estándar (timer + redirect a panel)

    setWaitingForContract(true);
    const startedAt = Date.now();
    let cancelled = false;

    const poll = async () => {
      try {
        const { data, error } = await supabase.rpc("get_anonymous_analysis", {
          analysis_uuid: analysisId,
        });
        if (cancelled) return;
        if (!error) {
          const row = Array.isArray(data) ? data[0] : data;
          const contractId = (row as any)?.converted_contract_id;
          if (contractId) {
            localStorage.removeItem("acroxia_pending_analysis_id");
            navigate(`/resultado/${contractId}`, { replace: true });
            return;
          }
        }
      } catch (e) {
        console.error("[EmailVerified] poll error:", e);
      }

      if (Date.now() - startedAt >= POLL_MAX_MS) {
        // Timeout: no apareció el contract en 30s. Caemos al comportamiento estándar.
        setWaitingForContract(false);
        return;
      }

      if (!cancelled) {
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [loading, analysisId, navigate]);

  // Timer estándar — solo activo cuando NO estamos esperando contract.
  useEffect(() => {
    if (loading) return;
    if (waitingForContract) return;
    if (analysisId) return; // si hay analysisId esperamos al polling, no al timer

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, navigate, redirectPath, waitingForContract, analysisId]);

  return (
    <>
      <SEOHead
        title="Cuenta verificada | ContratoAlquiler"
        description="Tu email ha sido verificado correctamente. Accede a todas las funcionalidades de ContratoAlquiler."
        canonical="https://contratoalquiler.com/verificado"
        noindex
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center py-32 px-4 bg-muted">
          <FadeIn>
            <Card className="w-full max-w-md text-center rounded-2xl shadow-2xl shadow-foreground/10">
              <CardContent className="pt-10 pb-10 space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">Cuenta verificada</h1>
                  <p className="text-muted-foreground">
                    {waitingForContract
                      ? "Estamos preparando tu informe completo… te llevamos en unos segundos."
                      : "Tu email ha sido verificado correctamente. Ya tienes acceso completo a todas las funcionalidades de ContratoAlquiler."}
                  </p>
                </div>

                {waitingForContract ? (
                  <div className="flex justify-center pt-2">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <Button onClick={() => navigate(redirectPath)} className="rounded-full px-8" size="lg">
                      {buttonLabel}
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Redirigiendo en {secondsLeft} segundo{secondsLeft === 1 ? "" : "s"}...
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default EmailVerified;

import { useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, CreditCard } from "lucide-react";

type UserType = "inquilino" | "propietario" | "profesional";

const benefits = [
  "Análisis con inteligencia artificial",
  "Detección de cláusulas ilegales",
  "Referencias legales específicas",
  "Cartas de reclamación automáticas",
];

const Register = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isFromCheckout = searchParams.get("checkout") === "success";
  const analysisId = searchParams.get("analysisId");

  const [prefilledEmail, setPrefilledEmail] = useState<string>("");
  const [prefilledUserType, setPrefilledUserType] = useState<UserType | undefined>(undefined);
  const [emailLookupTried, setEmailLookupTried] = useState(false);

  useEffect(() => {
    if (!analysisId || emailLookupTried) return;

    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_anonymous_analysis", { analysis_uuid: analysisId });
        if (cancelled) return;
        if (error) {
          console.warn("[Register] no se pudo cargar análisis:", error);
          return;
        }
        const row: any = Array.isArray(data) ? data[0] : data;
        if (row?.email && typeof row.email === "string" && !prefilledEmail) {
          setPrefilledEmail(row.email);
        }
        const persp = row?.analysis_result?.perspective;
        if (persp === "landlord") setPrefilledUserType("propietario");
        else if (persp === "tenant") setPrefilledUserType("inquilino");
      } finally {
        if (!cancelled) setEmailLookupTried(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysisId, prefilledEmail, emailLookupTried]);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Crear Cuenta Gratis | ContratoAlquiler</title>
        <meta
          name="description"
          content="Crea tu cuenta gratuita en ContratoAlquiler y accede al análisis completo de tu contrato. Protege tus derechos como inquilino."
        />
        <link rel="canonical" href="https://contratoalquiler.com/registro" />
        <meta property="og:title" content="Crear Cuenta Gratis | ContratoAlquiler" />
        <meta
          property="og:description"
          content="Regístrate y accede al análisis completo de tu contrato. Detecta cláusulas abusivas con IA."
        />
        <meta property="og:url" content="https://contratoalquiler.com/registro" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://contratoalquiler.com/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
            <FadeIn>
              <div className="hidden md:block space-y-6">
                <h1 className="font-serif text-4xl font-semibold text-charcoal">Protege tus derechos como inquilino</h1>
                <p className="text-charcoal/70">
                  Únete a miles de inquilinos que ya protegen sus contratos con inteligencia artificial.
                </p>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-charcoal/80">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card>
                <CardHeader className="space-y-1 text-center">
                  <CardTitle className="font-serif text-3xl">Crear cuenta</CardTitle>
                  <CardDescription>
                    {isFromCheckout
                      ? "Crea tu cuenta para acceder a tu informe completo"
                      : "Regístrate gratis y accede al análisis completo de tus contratos"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isFromCheckout && (
                    <Alert className="mb-4 border-green-500/50 bg-green-50">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>¡Pago completado!</strong> Crea tu cuenta para acceder al informe completo.
                        {prefilledEmail && <> Hemos prerrellenado tu email del pago.</>}
                      </AlertDescription>
                    </Alert>
                  )}
                  <AuthForm mode="register" prefilledEmail={prefilledEmail} prefilledUserType={prefilledUserType} />

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                      Inicia sesión
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Register;

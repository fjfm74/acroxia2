import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import SEOHead from "@/components/seo/SEOHead";
import { CheckCircle2 } from "lucide-react";

const REDIRECT_SECONDS = 10;

const EmailVerified = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const { redirectPath, buttonLabel } = useMemo(() => {
    if (profile?.user_type === "propietario") {
      return { redirectPath: "/propietario", buttonLabel: "Ir a mi panel de propietario" };
    }
    if (profile?.user_type === "profesional") {
      return { redirectPath: "/pro", buttonLabel: "Ir a mi panel profesional" };
    }
    return { redirectPath: "/dashboard", buttonLabel: "Ir a mi panel" };
  }, [profile]);

  useEffect(() => {
    if (loading) return;
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
  }, [loading, navigate, redirectPath]);

  return (
    <>
      <SEOHead
        title="Cuenta verificada | ACROXIA"
        description="Tu email ha sido verificado correctamente. Accede a todas las funcionalidades de ACROXIA."
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
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
                    Cuenta verificada
                  </h1>
                  <p className="text-muted-foreground">
                    Tu email ha sido verificado correctamente. Ya tienes acceso completo a todas las funcionalidades de ACROXIA.
                  </p>
                </div>

                <Button
                  onClick={() => navigate(redirectPath)}
                  className="rounded-full px-8"
                  size="lg"
                >
                  {buttonLabel}
                </Button>

                <p className="text-sm text-muted-foreground">
                  Redirigiendo en {secondsLeft} segundo{secondsLeft === 1 ? "" : "s"}...
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

export default EmailVerified;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { CheckCircle2 } from "lucide-react";

const EmailVerified = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [redirectPath, setRedirectPath] = useState("/dashboard");

  useEffect(() => {
    if (loading) return;

    if (profile?.user_type === "propietario") {
      setRedirectPath("/propietario");
    } else if (profile?.user_type === "profesional") {
      setRedirectPath("/pro");
    } else {
      setRedirectPath("/dashboard");
    }
  }, [profile, loading]);

  return (
    <>
      <Helmet>
        <title>Email Verificado | ACROXIA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
          <FadeIn>
            <Card className="w-full max-w-md text-center">
              <CardContent className="pt-10 pb-10 space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-4">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="font-serif text-3xl font-semibold text-foreground">
                    Tu cuenta ha sido verificada correctamente
                  </h1>
                  <p className="text-muted-foreground">
                    Ya puedes acceder a todas las funcionalidades de ACROXIA.
                  </p>
                </div>

                <Button
                  onClick={() => navigate(redirectPath)}
                  className="rounded-full px-8"
                  size="lg"
                >
                  Ir a mi panel
                </Button>
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

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";

const ConfirmBlogSubscription = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "already_confirmed">("loading");
  const [audience, setAudience] = useState<string | null>(null);
  const token = searchParams.get("token");

  useEffect(() => {
    const confirmSubscription = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        // Call backend function (bypasses RLS)
        const { data, error } = await supabase.functions.invoke("confirm-blog-subscription", {
          body: { token }
        });

        if (error) {
          console.error("Error confirming subscription:", error);
          setStatus("error");
          return;
        }

        if (data.status === "success") {
          setAudience(data.audience);
          setStatus("success");
        } else if (data.status === "already_confirmed") {
          setAudience(data.audience);
          setStatus("already_confirmed");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error confirming subscription:", error);
        setStatus("error");
      }
    };

    confirmSubscription();
  }, [token]);

  const audienceLabel = audience === "inquilino" ? "inquilinos" : "propietarios";
  const blogUrl = audience ? `/blog?audiencia=${audience}` : "/blog";

  return (
    <>
      <Helmet>
        <title>Confirmar suscripción | ACROXIA Blog</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-lg mx-auto text-center">
            <FadeIn>
              {status === "loading" && (
                <div className="py-20">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Confirmando tu suscripción...</p>
                </div>
              )}

              {status === "success" && (
                <div className="py-12">
                  <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                    ¡Suscripción confirmada!
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    A partir de ahora recibirás nuestros mejores artículos para {audienceLabel} directamente en tu bandeja de entrada.
                  </p>
                  <Button asChild className="rounded-full">
                    <Link to={blogUrl}>
                      Explorar el blog
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}

              {status === "already_confirmed" && (
                <div className="py-12">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-blue-600" />
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                    Ya estás suscrito
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    Tu suscripción ya estaba confirmada. Recibirás nuestros artículos para {audienceLabel} en tu email.
                  </p>
                  <Button asChild className="rounded-full">
                    <Link to={blogUrl}>
                      Ir al blog
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="py-12">
                  <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
                    Enlace no válido
                  </h1>
                  <p className="text-muted-foreground mb-8">
                    El enlace de confirmación no es válido o ha expirado. Por favor, vuelve a suscribirte desde el blog.
                  </p>
                  <Button asChild className="rounded-full">
                    <Link to="/blog">
                      Volver al blog
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
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

export default ConfirmBlogSubscription;

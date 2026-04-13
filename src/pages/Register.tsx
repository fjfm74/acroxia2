import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, CreditCard } from "lucide-react";

const benefits = [
  "1 análisis de contrato gratis",
  "Detección de cláusulas ilegales",
  "Referencias legales específicas",
  "Cartas de reclamación automáticas",
];

const Register = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const isFromCheckout = searchParams.get("checkout") === "success";

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Crear Cuenta Gratis | ACROXIA</title>
        <meta name="description" content="Crea tu cuenta gratuita en ACROXIA y recibe 1 análisis de contrato gratis. Protege tus derechos como inquilino." />
        <link rel="canonical" href="https://acroxia.com/registro" />
        <meta property="og:title" content="Crear Cuenta Gratis | ACROXIA" />
        <meta property="og:description" content="Regístrate y recibe 1 análisis de contrato gratis. Detecta cláusulas abusivas con IA." />
        <meta property="og:url" content="https://acroxia.com/registro" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
            <FadeIn>
              <div className="hidden md:block space-y-6">
                <h1 className="font-serif text-4xl font-semibold text-charcoal">
                  Protege tus derechos como inquilino
                </h1>
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
                      : "Regístrate gratis y recibe 1 análisis incluido"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isFromCheckout && (
                    <Alert className="mb-4 border-green-500/50 bg-green-50">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>¡Pago completado!</strong> Crea tu cuenta para acceder al informe completo y tus créditos de análisis.
                      </AlertDescription>
                    </Alert>
                  )}
                  <AuthForm mode="register" />
                  
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

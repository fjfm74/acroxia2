import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  "1 análisis de contrato gratis",
  "Detección de cláusulas ilegales",
  "Referencias legales específicas",
  "Cartas de reclamación automáticas",
];

const Register = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Crear Cuenta | ACROXIA</title>
        <meta name="description" content="Crea tu cuenta gratuita en ACROXIA y recibe 1 análisis de contrato gratis." />
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
                    Regístrate gratis y recibe 1 análisis incluido
                  </CardDescription>
                </CardHeader>
                <CardContent>
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

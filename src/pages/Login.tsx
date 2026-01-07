import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";

const Login = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión | ACROXIA</title>
        <meta name="description" content="Accede a tu cuenta de ACROXIA para analizar tus contratos de alquiler." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
          <FadeIn>
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1 text-center">
                <CardTitle className="font-serif text-3xl">Bienvenido</CardTitle>
                <CardDescription>
                  Inicia sesión para acceder a tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuthForm mode="login" />
                
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  ¿No tienes cuenta?{" "}
                  <Link to="/registro" className="text-primary hover:underline font-medium">
                    Regístrate gratis
                  </Link>
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

export default Login;

import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
      });
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el email. Verifica que la dirección sea correcta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <>
        <Helmet>
          <title>Email Enviado | ACROXIA</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
            <FadeIn>
              <Card className="w-full max-w-md text-center">
                <CardContent className="pt-10 pb-10">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="font-serif text-2xl font-semibold mb-2">
                    Revisa tu email
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Hemos enviado un enlace a <strong>{email}</strong> para restablecer tu contraseña.
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    ¿No lo ves? Revisa tu carpeta de spam.
                  </p>
                  <Link to="/login">
                    <Button variant="outline" className="rounded-full">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver al login
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </FadeIn>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Recuperar Contraseña | ACROXIA</title>
        <meta name="description" content="Recupera el acceso a tu cuenta de ACROXIA." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
          <FadeIn>
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1 text-center">
                <div className="mx-auto w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center mb-2">
                  <Mail className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="font-serif text-3xl">¿Olvidaste tu contraseña?</CardTitle>
                <CardDescription>
                  Introduce tu email y te enviaremos un enlace para restablecerla
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={loading}
                  >
                    {loading ? "Enviando..." : "Enviar enlace de recuperación"}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Volver al login
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

export default ForgotPassword;

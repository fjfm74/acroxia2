import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for access token in URL (from email link)
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const type = searchParams.get("type");
    
    if (type === "recovery" && accessToken) {
      // Set the session with the recovery token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: searchParams.get("refresh_token") || "",
      });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // Get user info to send confirmation email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Send password changed confirmation email
        await supabase.functions.invoke("send-email", {
          body: {
            type: "password_changed",
            to: user.email,
            data: {
              userName: user.user_metadata?.full_name || user.user_metadata?.name,
            },
          },
        });
      }

      setSuccess(true);
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Error updating password:", err);
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Helmet>
          <title>Contraseña Actualizada | ACROXIA</title>
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
                    ¡Contraseña actualizada!
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Redirigiendo al login...
                  </p>
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
        <title>Nueva Contraseña | ACROXIA</title>
        <meta name="description" content="Crea una nueva contraseña para tu cuenta de ACROXIA." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-20 px-4 bg-muted">
          <FadeIn>
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1 text-center">
                <div className="mx-auto w-12 h-12 bg-foreground/10 rounded-full flex items-center justify-center mb-2">
                  <Lock className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="font-serif text-3xl">Nueva contraseña</CardTitle>
                <CardDescription>
                  Crea una contraseña segura para tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      minLength={6}
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full rounded-full"
                    disabled={loading}
                  >
                    {loading ? "Actualizando..." : "Actualizar contraseña"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </FadeIn>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ResetPassword;

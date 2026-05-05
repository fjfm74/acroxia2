import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [resending, setResending] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Email verificado → renderizar children normalmente
  if ((user as any).email_confirmed_at) {
    return <>{children}</>;
  }

  // User logado pero sin email confirmado → bloqueamos con explicación clara,
  // sin redirect silencioso. Bug E del audit.
  const handleResend = async () => {
    if (!user.email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
      if (error) throw error;
      toast.success("Email reenviado. Revisa tu bandeja de entrada (también en spam).");
    } catch (err: any) {
      toast.error(err?.message || "No se pudo reenviar el email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-10 space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-amber-100 p-4">
              <Mail className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-2xl font-semibold text-foreground">Verifica tu email</h2>
            <p className="text-muted-foreground text-sm">
              Para acceder a esta sección necesitas verificar tu email primero. Te hemos enviado un mensaje a{" "}
              <strong>{user.email}</strong>.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleResend} disabled={resending} variant="outline">
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                "Reenviar email de verificación"
              )}
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProtectedRoute;

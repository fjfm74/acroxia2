import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsProfessional } from "@/hooks/useIsProfessional";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface ProfessionalRouteProps {
  children: React.ReactNode;
}

const ProfessionalRoute = ({ children }: ProfessionalRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isProfessional, loading: proLoading } = useIsProfessional();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (authLoading || proLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access if user is professional OR admin
  if (!isProfessional && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProfessionalRoute;

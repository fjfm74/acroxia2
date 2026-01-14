import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsLandlord } from "@/hooks/useIsLandlord";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface LandlordRouteProps {
  children: React.ReactNode;
}

const LandlordRoute = ({ children }: LandlordRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isLandlord, loading: landlordLoading } = useIsLandlord();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (authLoading || landlordLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access if user is landlord OR admin
  if (!isLandlord && !isAdmin) {
    return <Navigate to="/inquilino" replace />;
  }

  return <>{children}</>;
};

export default LandlordRoute;

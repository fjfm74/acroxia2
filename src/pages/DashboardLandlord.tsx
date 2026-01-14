import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import LandlordLayout from "@/components/landlord/LandlordLayout";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Clock, 
  Building2, 
  AlertTriangle,
  CalendarClock,
  FileSearch,
  Infinity,
  Settings,
  User,
  Home,
  Loader2
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

interface LandlordContract {
  id: string;
  file_name: string;
  property_address: string | null;
  tenant_name: string | null;
  signing_date: string | null;
  start_date: string | null;
  end_date: string | null;
  monthly_rent: number | null;
  status: string;
  created_at: string;
}

interface Stats {
  activeContracts: number;
  upcomingRenewals: number;
  credits: number;
}

const DashboardLandlord = () => {
  const { profile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [contracts, setContracts] = useState<LandlordContract[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeContracts: 0,
    upcomingRenewals: 0,
    credits: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: contractsData, error } = await supabase
          .from("landlord_contracts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const processedContracts = contractsData || [];
        setContracts(processedContracts);

        // Calculate stats
        const activeContracts = processedContracts.filter(
          (c) => c.status === "active" || c.status === "pending_renewal"
        ).length;

        const today = new Date();
        const upcomingRenewals = processedContracts.filter((c) => {
          if (!c.end_date) return false;
          const daysUntilEnd = differenceInDays(new Date(c.end_date), today);
          return daysUntilEnd >= 0 && daysUntilEnd <= 60;
        }).length;

        setStats({
          activeContracts,
          upcomingRenewals,
          credits: profile?.credits || 0,
        });
      } catch (error) {
        console.error("Error fetching landlord data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile]);

  const getStatusBadge = (contract: LandlordContract) => {
    if (contract.end_date) {
      const daysUntilEnd = differenceInDays(new Date(contract.end_date), new Date());
      if (daysUntilEnd < 0) {
        return <Badge variant="destructive">Expirado</Badge>;
      }
      if (daysUntilEnd <= 60) {
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Próxima renovación</Badge>;
      }
    }
    
    switch (contract.status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>;
      case "terminated":
        return <Badge variant="secondary">Terminado</Badge>;
      default:
        return <Badge variant="outline">{contract.status}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Panel Propietario | ACROXIA</title>
        <meta name="description" content="Gestiona tus contratos de alquiler como propietario." />
      </Helmet>

      <LandlordLayout>
        <FadeIn>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-14 w-14 rounded-xl bg-amber-100 shadow-md flex items-center justify-center">
                <Building2 className="h-7 w-7 text-amber-600" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
                  Panel Propietario
                </h1>
                <p className="text-muted-foreground text-sm">
                  Hola, {profile?.first_name || "Propietario"}
                </p>
              </div>
            </div>
            
            {/* Quick Access Links */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/inquilino">
                  <Home className="mr-2 h-4 w-4" />
                  Panel Inquilino
                </Link>
              </Button>
              {isAdmin && (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/pro">
                      <User className="mr-2 h-4 w-4" />
                      Panel Pro
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      Panel Admin
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Contratos activos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeContracts}</div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Próximas renovaciones</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{stats.upcomingRenewals}</div>
                <p className="text-xs text-muted-foreground">en los próximos 60 días</p>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Créditos disponibles</CardTitle>
                {isAdmin ? (
                  <Infinity className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isAdmin ? "∞" : stats.credits}</div>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? "sin límite (admin)" : "análisis restantes"}
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <FadeIn delay={0.25}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/propietario/analizar">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <FileSearch className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Analizar contrato</h3>
                    <p className="text-sm text-muted-foreground">Verifica tu contrato</p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </FadeIn>

          <FadeIn delay={0.3}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/propietario/crear-contrato">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Crear contrato</h3>
                    <p className="text-sm text-muted-foreground">Genera un nuevo contrato</p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </FadeIn>

          <FadeIn delay={0.35}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to="/propietario/contratos">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <FileText className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Mis contratos</h3>
                    <p className="text-sm text-muted-foreground">Ver todos tus contratos</p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </FadeIn>
        </div>

        {/* Recent Contracts */}
        <FadeIn delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle>Contratos recientes</CardTitle>
              <CardDescription>
                Tus contratos de alquiler más recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : contracts.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No tienes contratos aún</h3>
                  <p className="mt-2 text-muted-foreground">
                    Crea tu primer contrato o analiza uno existente
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Button asChild>
                      <Link to="/propietario/crear-contrato">
                        <Plus className="mr-2 h-4 w-4" />
                        Crear contrato
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/propietario/analizar">
                        <FileSearch className="mr-2 h-4 w-4" />
                        Analizar
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {contracts.slice(0, 5).map((contract) => (
                    <div
                      key={contract.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2 bg-amber-100/50 rounded-lg shrink-0">
                          <Building2 className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {contract.property_address || contract.file_name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {contract.tenant_name && (
                              <span>Inquilino: {contract.tenant_name}</span>
                            )}
                            {contract.signing_date && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(contract.signing_date), "d MMM yyyy", { locale: es })}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pl-14 sm:pl-0 sm:shrink-0">
                        {contract.monthly_rent && (
                          <span className="text-sm font-medium">
                            {contract.monthly_rent}€/mes
                          </span>
                        )}
                        {getStatusBadge(contract)}
                        <Button variant="outline" size="sm" asChild className="whitespace-nowrap">
                          <Link to={`/propietario/contratos/${contract.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {contracts.length > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" asChild>
                        <Link to="/propietario/contratos">Ver todos los contratos</Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </LandlordLayout>
    </>
  );
};

export default DashboardLandlord;

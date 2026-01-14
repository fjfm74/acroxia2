import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import LandlordLayout from "@/components/landlord/LandlordLayout";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Plus, 
  Search,
  Clock,
  Loader2,
  FileSearch,
  Trash2
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

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

const MyContractsPage = () => {
  const { profile } = useAuth();
  const [contracts, setContracts] = useState<LandlordContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<LandlordContract[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const { data, error } = await supabase
          .from("landlord_contracts")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setContracts(data || []);
        setFilteredContracts(data || []);
      } catch (error) {
        console.error("Error fetching contracts:", error);
        toast.error("Error al cargar los contratos");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredContracts(contracts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = contracts.filter(
      (c) =>
        c.property_address?.toLowerCase().includes(query) ||
        c.tenant_name?.toLowerCase().includes(query) ||
        c.file_name.toLowerCase().includes(query)
    );
    setFilteredContracts(filtered);
  }, [searchQuery, contracts]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este contrato?")) return;

    try {
      const { error } = await supabase
        .from("landlord_contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setContracts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Contrato eliminado");
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast.error("Error al eliminar el contrato");
    }
  };

  const getStatusBadge = (contract: LandlordContract) => {
    if (contract.end_date) {
      const daysUntilEnd = differenceInDays(new Date(contract.end_date), new Date());
      if (daysUntilEnd < 0) {
        return <Badge variant="destructive">Expirado</Badge>;
      }
      if (daysUntilEnd <= 60) {
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Renovar en {daysUntilEnd} días
          </Badge>
        );
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
        <title>Mis Contratos | Panel Propietario | ACROXIA</title>
        <meta name="description" content="Gestiona todos tus contratos de alquiler." />
      </Helmet>

      <LandlordLayout
        title="Mis Contratos"
        subtitle="Gestiona todos tus contratos de alquiler"
      >
        <div className="space-y-6">
          {/* Actions Bar */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por dirección o inquilino..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link to="/propietario/analizar">
                    <FileSearch className="mr-2 h-4 w-4" />
                    Analizar
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/propietario/crear-contrato">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo contrato
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Contracts List */}
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle>Todos tus contratos</CardTitle>
                <CardDescription>
                  {filteredContracts.length} contrato{filteredContracts.length !== 1 ? "s" : ""} encontrado{filteredContracts.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredContracts.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                      {searchQuery ? "No se encontraron contratos" : "No tienes contratos aún"}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {searchQuery
                        ? "Intenta con otro término de búsqueda"
                        : "Crea tu primer contrato para empezar"}
                    </p>
                    {!searchQuery && (
                      <Button asChild className="mt-4">
                        <Link to="/propietario/crear-contrato">
                          <Plus className="mr-2 h-4 w-4" />
                          Crear contrato
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredContracts.map((contract) => (
                      <div
                        key={contract.id}
                        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="p-2 bg-amber-100/50 rounded-lg shrink-0">
                            <Building2 className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {contract.property_address || contract.file_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                              {contract.tenant_name && (
                                <span>Inquilino: {contract.tenant_name}</span>
                              )}
                              {contract.monthly_rent && (
                                <>
                                  <span>•</span>
                                  <span>{contract.monthly_rent}€/mes</span>
                                </>
                              )}
                              {contract.signing_date && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Firma: {format(new Date(contract.signing_date), "d MMM yyyy", { locale: es })}
                                  </span>
                                </>
                              )}
                            </div>
                            {contract.end_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Vence: {format(new Date(contract.end_date), "d MMMM yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 pl-14 lg:pl-0 shrink-0">
                          {getStatusBadge(contract)}
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/propietario/contratos/${contract.id}`}>Ver</Link>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(contract.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </LandlordLayout>
    </>
  );
};

export default MyContractsPage;

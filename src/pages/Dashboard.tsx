import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Clock, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface Contract {
  id: string;
  file_name: string;
  status: string;
  created_at: string;
  analysis_results: {
    total_clauses: number;
    valid_clauses: number;
    suspicious_clauses: number;
    illegal_clauses: number;
  }[];
}

const Dashboard = () => {
  const { profile, user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          id,
          file_name,
          status,
          created_at,
          analysis_results (
            total_clauses,
            valid_clauses,
            suspicious_clauses,
            illegal_clauses
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setContracts(data as Contract[]);
      }
      setLoading(false);
    };

    fetchContracts();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completado</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Procesando</Badge>;
      case "failed":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Mi Panel | ACROXIA</title>
        <meta name="description" content="Gestiona tus análisis de contratos de alquiler." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-muted pt-28 pb-12">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                  <h1 className="font-serif text-3xl font-semibold text-charcoal">
                    Hola, {profile?.full_name || "Usuario"}
                  </h1>
                  <p className="text-charcoal/70 mt-1">
                    Gestiona tus análisis de contratos
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-base py-2 px-4">
                    <FileText className="mr-2 h-4 w-4" />
                    {profile?.credits || 0} créditos
                  </Badge>
                  <Button asChild>
                    <Link to="/analizar">
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo análisis
                    </Link>
                  </Button>
                </div>
              </div>
            </FadeIn>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <FadeIn delay={0.1}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Contratos analizados</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contracts.length}</div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.15}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Cláusulas revisadas</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {contracts.reduce((acc, c) => acc + (c.analysis_results[0]?.total_clauses || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.2}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Problemas detectados</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-600">
                      {contracts.reduce((acc, c) => {
                        const result = c.analysis_results[0];
                        return acc + (result?.illegal_clauses || 0) + (result?.suspicious_clauses || 0);
                      }, 0)}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            <FadeIn delay={0.25}>
              <Card>
                <CardHeader>
                  <CardTitle>Historial de análisis</CardTitle>
                  <CardDescription>
                    Todos tus contratos analizados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : contracts.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <h3 className="mt-4 text-lg font-medium">No tienes análisis aún</h3>
                      <p className="mt-2 text-muted-foreground">
                        Sube tu primer contrato para comenzar
                      </p>
                      <Button asChild className="mt-4">
                        <Link to="/analizar">
                          <Plus className="mr-2 h-4 w-4" />
                          Analizar contrato
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contracts.map((contract) => (
                        <div
                          key={contract.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{contract.file_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {new Date(contract.created_at).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {contract.analysis_results[0] && (
                              <div className="hidden md:flex items-center gap-3 text-sm">
                                <span className="text-green-600">
                                  {contract.analysis_results[0].valid_clauses} válidas
                                </span>
                                <span className="text-amber-600">
                                  {contract.analysis_results[0].suspicious_clauses} sospechosas
                                </span>
                                <span className="text-red-600">
                                  {contract.analysis_results[0].illegal_clauses} ilegales
                                </span>
                              </div>
                            )}
                            {getStatusBadge(contract.status)}
                            {contract.status === "completed" && (
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/resultado/${contract.id}`}>Ver informe</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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

export default Dashboard;

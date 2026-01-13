import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  RefreshCw, 
  FileText, 
  ExternalLink, 
  Check, 
  X, 
  Clock,
  AlertCircle,
  Download,
  Settings,
  History
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface BOEPublication {
  id: string;
  boe_id: string;
  title: string;
  publication_date: string;
  pdf_url: string | null;
  boe_url: string | null;
  section: string | null;
  department: string | null;
  summary: string | null;
  status: string;
  notified_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface MonitoringLog {
  id: string;
  check_time: string;
  source: string;
  success: boolean;
  error_message: string | null;
  publications_found: number;
  new_publications: number;
  retry_pending: boolean;
}

interface MonitoringConfig {
  enabled: boolean;
  notification_emails: string[];
  search_terms: string[];
  sections: string[];
}

const statusConfig = {
  pending_review: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Aprobado", color: "bg-green-100 text-green-800", icon: Check },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-800", icon: X },
  processed: { label: "Procesado", color: "bg-blue-100 text-blue-800", icon: FileText }
};

export default function AdminBOE() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRunningManual, setIsRunningManual] = useState(false);

  // Fetch publications
  const { data: publications, isLoading: loadingPublications } = useQuery({
    queryKey: ["boe-publications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("boe_publications")
        .select("*")
        .order("publication_date", { ascending: false });
      
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as BOEPublication[];
    }
  });

  // Fetch monitoring logs
  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ["boe-monitoring-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boe_monitoring_logs")
        .select("*")
        .order("check_time", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as MonitoringLog[];
    }
  });

  // Fetch config
  const { data: config } = useQuery({
    queryKey: ["boe-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "boe_monitoring_config")
        .single() as { data: { value: MonitoringConfig } | null; error: any };
      
      if (error) throw error;
      return data?.value as MonitoringConfig;
    }
  });

  // Update publication status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("boe_publications")
        .update({ 
          status, 
          reviewed_at: new Date().toISOString() 
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boe-publications"] });
      toast.success("Estado actualizado");
    },
    onError: (error) => {
      toast.error("Error al actualizar: " + error.message);
    }
  });

  // Run manual check
  const runManualCheck = async () => {
    setIsRunningManual(true);
    try {
      const { data, error } = await supabase.functions.invoke("monitor-boe", {
        body: { source: "manual_admin" }
      });
      
      if (error) throw error;
      
      toast.success(
        data.new_publications > 0 
          ? `Se encontraron ${data.new_publications} nuevas publicaciones`
          : "No se encontraron nuevas publicaciones"
      );
      
      queryClient.invalidateQueries({ queryKey: ["boe-publications"] });
      queryClient.invalidateQueries({ queryKey: ["boe-monitoring-logs"] });
    } catch (error: any) {
      toast.error("Error al ejecutar la consulta: " + error.message);
    } finally {
      setIsRunningManual(false);
    }
  };

  // Filter publications by search
  const filteredPublications = publications?.filter(pub => 
    searchQuery === "" || 
    pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.boe_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: publications?.length || 0,
    pending: publications?.filter(p => p.status === "pending_review").length || 0,
    approved: publications?.filter(p => p.status === "approved").length || 0,
    rejected: publications?.filter(p => p.status === "rejected").length || 0
  };

  return (
    <AdminLayout 
      title="Monitor BOE" 
      description="Sistema de monitorización de publicaciones del BOE sobre arrendamiento urbano"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total publicaciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pendientes de revisar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-green-600">{stats.approved}</div>
              <p className="text-sm text-muted-foreground">Aprobadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-red-600">{stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Rechazadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Buscar por título o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending_review">Pendientes</SelectItem>
                <SelectItem value="approved">Aprobados</SelectItem>
                <SelectItem value="rejected">Rechazados</SelectItem>
                <SelectItem value="processed">Procesados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={runManualCheck} 
            disabled={isRunningManual}
            className="rounded-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunningManual ? 'animate-spin' : ''}`} />
            {isRunningManual ? "Consultando..." : "Consultar ahora"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="publications">
          <TabsList>
            <TabsTrigger value="publications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Publicaciones
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="publications" className="mt-6">
            {loadingPublications ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Cargando publicaciones...</p>
              </div>
            ) : filteredPublications?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay publicaciones</h3>
                  <p className="text-muted-foreground mb-4">
                    No se han encontrado publicaciones del BOE. Ejecuta una consulta manual para buscar.
                  </p>
                  <Button onClick={runManualCheck} disabled={isRunningManual}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Consultar BOE ahora
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Publicación</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Sección</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPublications?.map((pub) => {
                      const statusInfo = statusConfig[pub.status as keyof typeof statusConfig] || statusConfig.pending_review;
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <TableRow key={pub.id}>
                          <TableCell>
                            <div className="max-w-md">
                              <p className="font-medium text-sm line-clamp-2">{pub.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{pub.boe_id}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(pub.publication_date), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {pub.section ? `Sección ${pub.section}` : "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusInfo.color} text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {pub.pdf_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(pub.pdf_url!, "_blank")}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {pub.boe_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(pub.boe_url!, "_blank")}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              {pub.status === "pending_review" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => updateStatusMutation.mutate({ id: pub.id, status: "approved" })}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => updateStatusMutation.mutate({ id: pub.id, status: "rejected" })}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            {loadingLogs ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha/Hora</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Encontradas</TableHead>
                      <TableHead>Nuevas</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.check_time), "dd/MM/yyyy HH:mm", { locale: es })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Éxito
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{log.publications_found}</TableCell>
                        <TableCell className="text-sm font-medium">{log.new_publications}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {log.error_message || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Monitor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Estado</h4>
                  <Badge className={config?.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {config?.enabled ? "Activo" : "Desactivado"}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Emails de notificación</h4>
                  <div className="flex flex-wrap gap-2">
                    {config?.notification_emails?.map((email, idx) => (
                      <Badge key={idx} variant="outline">{email}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Términos de búsqueda</h4>
                  <div className="flex flex-wrap gap-2">
                    {config?.search_terms?.map((term, idx) => (
                      <Badge key={idx} variant="secondary">{term}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Secciones monitorizadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {config?.sections?.map((section, idx) => (
                      <Badge key={idx} variant="outline">Sección {section}</Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Horarios de ejecución automática</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">09:00</Badge>
                    <Badge variant="outline">12:00</Badge>
                    <Badge variant="outline">22:00</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    El sistema consulta automáticamente el BOE 3 veces al día en estos horarios.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

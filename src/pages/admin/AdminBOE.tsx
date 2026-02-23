import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  RefreshCw, FileText, ExternalLink, Check, X, Clock,
  AlertCircle, Download, Settings, History, Link as LinkIcon, Loader2,
  Database, Zap
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
  processed_document_id: string | null;
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

interface MonitorState {
  last_checked: string;
  seen_ids: string[];
}

const statusConfig = {
  pending_review: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Aprobado", color: "bg-green-100 text-green-800", icon: Check },
  rejected: { label: "Rechazado", color: "bg-red-100 text-red-800", icon: X },
  processed: { label: "Procesado", color: "bg-blue-100 text-blue-800", icon: FileText }
};

export default function AdminBOE() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRunningManual, setIsRunningManual] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch publications
  const { data: publications, isLoading: loadingPublications } = useQuery({
    queryKey: ["boe-publications", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("boe_publications")
        .select("*")
        .order("publication_date", { ascending: false });
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
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

  // Fetch monitor state
  const { data: monitorState } = useQuery({
    queryKey: ["monitor-state"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("legal_monitor_state")
        .select("value, updated_at")
        .eq("key", "arrendamientos_monitor_v1")
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { value: MonitorState; updated_at: string } | null;
    }
  });

  // Update publication status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("boe_publications")
        .update({ status, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boe-publications"] });
      toast.success("Estado actualizado");
    },
    onError: (error) => toast.error("Error: " + error.message)
  });

  // Run manual check
  const runManualCheck = async () => {
    setIsRunningManual(true);
    setLastRunResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("monitor-boe", {
        body: { source: "manual_admin" }
      });
      if (error) throw error;
      setLastRunResult(data);
      toast.success(
        data.nuevos > 0 
          ? `${data.nuevos} nuevas publicaciones encontradas`
          : "Sin novedades"
      );
      queryClient.invalidateQueries({ queryKey: ["boe-publications"] });
      queryClient.invalidateQueries({ queryKey: ["boe-monitoring-logs"] });
      queryClient.invalidateQueries({ queryKey: ["monitor-state"] });
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setIsRunningManual(false);
    }
  };

  // Process approved publication into legal document
  const processPublicationMutation = useMutation({
    mutationFn: async (pub: BOEPublication) => {
      if (!pub.pdf_url) throw new Error("No hay PDF disponible");
      setProcessingId(pub.id);
      const pdfResponse = await fetch(pub.pdf_url);
      if (!pdfResponse.ok) throw new Error("Error al descargar el PDF");
      const pdfBlob = await pdfResponse.blob();
      const fileName = `boe-${pub.boe_id.replace(/[^a-zA-Z0-9]/g, "-")}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("legal-docs")
        .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw new Error(`Upload: ${uploadError.message}`);
      const { data: docData, error: docError } = await supabase
        .from("legal_documents")
        .insert({
          title: pub.title,
          description: pub.summary || `Publicación BOE: ${pub.boe_id}`,
          type: "boe" as const,
          jurisdiction: "estatal" as const,
          source: pub.boe_url || `https://www.boe.es/diario_boe/txt.php?id=${pub.boe_id}`,
          effective_date: pub.publication_date,
          file_path: fileName,
          is_active: true
        })
        .select()
        .single();
      if (docError) throw new Error(`Doc: ${docError.message}`);
      const { error: processError } = await supabase.functions.invoke(
        "process-legal-document",
        { body: { documentId: docData.id, filePath: fileName } }
      );
      if (processError) toast.warning("Documento creado pero pendiente de procesar con IA");
      const { error: updateError } = await supabase
        .from("boe_publications")
        .update({ status: "processed", processed_document_id: docData.id, reviewed_at: new Date().toISOString() })
        .eq("id", pub.id);
      if (updateError) throw new Error(`Update: ${updateError.message}`);
      return docData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boe-publications"] });
      toast.success(`Procesado: ${data.title.substring(0, 50)}...`);
      setProcessingId(null);
    },
    onError: (error: Error) => {
      toast.error("Error: " + error.message);
      setProcessingId(null);
    }
  });

  const filteredPublications = publications?.filter(pub => 
    searchQuery === "" || 
    pub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pub.boe_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: publications?.length || 0,
    pending: publications?.filter(p => p.status === "pending_review").length || 0,
    approved: publications?.filter(p => p.status === "approved").length || 0,
    rejected: publications?.filter(p => p.status === "rejected").length || 0,
    processed: publications?.filter(p => p.status === "processed").length || 0
  };

  return (
    <AdminLayout 
      title="Monitor BOE" 
      description="Monitor de novedades legales sobre arrendamientos (con deduplicación y estado persistente)"
    >
      <div className="space-y-6">
        {/* Monitor State Card */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Estado del monitor</p>
                  {monitorState ? (
                    <p className="text-xs text-muted-foreground">
                      Última revisión: {format(new Date(monitorState.value.last_checked), "dd/MM/yyyy", { locale: es })} · 
                      IDs rastreados: {monitorState.value.seen_ids?.length || 0} · 
                      Actualizado: {format(new Date(monitorState.updated_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin estado previo — la primera ejecución hará bootstrap de 45 días</p>
                  )}
                </div>
              </div>
              <Button 
                onClick={runManualCheck} 
                disabled={isRunningManual}
                className="rounded-full"
              >
                {isRunningManual ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isRunningManual ? "Ejecutando..." : "Ejecutar ahora"}
              </Button>
            </div>

            {/* Last run result */}
            {lastRunResult && (
              <div className="mt-4 p-3 rounded-lg bg-muted text-sm font-mono">
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(lastRunResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-yellow-600">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
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
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-semibold text-blue-600">{stats.processed}</div>
              <p className="text-sm text-muted-foreground">Procesadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
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
                    Ejecuta el monitor para buscar novedades del BOE.
                  </p>
                  <Button onClick={runManualCheck} disabled={isRunningManual} className="rounded-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Ejecutar ahora
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
                                <Button variant="ghost" size="sm" onClick={() => window.open(pub.pdf_url!, "_blank")}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {pub.boe_url && (
                                <Button variant="ghost" size="sm" onClick={() => window.open(pub.boe_url!, "_blank")}>
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                              {pub.status === "pending_review" && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => updateStatusMutation.mutate({ id: pub.id, status: "approved" })}>
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => updateStatusMutation.mutate({ id: pub.id, status: "rejected" })}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {pub.status === "approved" && (
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => processPublicationMutation.mutate(pub)}
                                  disabled={processingId === pub.id || !pub.pdf_url}>
                                  {processingId === pub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                  <span className="ml-1 text-xs">Procesar</span>
                                </Button>
                              )}
                              {pub.status === "processed" && pub.processed_document_id && (
                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => navigate(`/admin/documentos`)}>
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
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
                          <Badge variant="outline" className="text-xs">{log.source}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <Check className="h-3 w-3 mr-1" />Éxito
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />Error
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
                <CardTitle>Configuración del Monitor v2</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Términos de búsqueda</h4>
                  <div className="flex flex-wrap gap-2">
                    {["arrendamiento", "alquiler", "vivienda", "desahucio", "fianza", "inquilino", "mercado residencial tensionado", "irav", "arrendatario", "arrendador", "renta", "LAU"].map((term, idx) => (
                      <Badge key={idx} variant="secondary">{term}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Secciones monitorizadas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Sección I</Badge>
                    <Badge variant="outline">Sección III</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Parámetros</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Bootstrap:</strong> 45 días de histórico en primera ejecución</li>
                    <li>• <strong>Lookback overlap:</strong> 2 días de solape para no perder cambios</li>
                    <li>• <strong>Max IDs rastreados:</strong> 5.000</li>
                    <li>• <strong>Deduplicación:</strong> por identificador BOE (boe_id)</li>
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Ejecución automática</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">08:15 (Europe/Madrid)</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cron diario configurado. También puedes ejecutar manualmente desde el botón superior.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Notificaciones</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">nuriafrancis@gmail.com</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Solo se envía email cuando hay novedades. Sin novedades, se actualiza el estado sin notificar.
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

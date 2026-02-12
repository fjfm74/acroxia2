import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Upload, FileText, Trash2, Filter, CheckCircle, XCircle, RefreshCw, Eye, AlertTriangle, LinkIcon, MoreVertical, Loader2, Clock, Globe, BookOpen } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ChunkViewer from "@/components/admin/ChunkViewer";

interface LegalDocument {
  id: string;
  title: string;
  description: string | null;
  type: string;
  jurisdiction: string | null;
  territorial_entity: string | null;
  source: string | null;
  effective_date: string | null;
  is_active: boolean;
  created_at: string;
  chunks_count?: number;
  ai_summary?: string | null;
  keywords?: string[] | null;
  superseded_by_id?: string | null;
  supersedes_ids?: string[] | null;
  expiration_date?: string | null;
  processing_status?: string | null;
  processing_error?: string | null;
  processing_started_at?: string | null;
  processing_completed_at?: string | null;
  source_type?: string | null;
  source_url?: string | null;
}

interface DocumentRelation {
  id: string;
  source_document_id: string;
  target_document_id: string;
  relation_type: string;
  affected_articles: string[];
  description: string | null;
  detected_by: string;
}

const documentTypes = [
  { value: "ley", label: "Ley" },
  { value: "real_decreto", label: "Real Decreto" },
  { value: "decreto", label: "Decreto" },
  { value: "orden_ministerial", label: "Orden Ministerial" },
  { value: "boe", label: "BOE (Publicación)" },
  { value: "sentencia", label: "Sentencia" },
  { value: "jurisprudencia", label: "Jurisprudencia" },
  { value: "guia", label: "Guía" },
  { value: "otro", label: "Otro" },
];

const comunidadesAutonomas = [
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias",
  "Cantabria", "Castilla-La Mancha", "Castilla y León", "Cataluña",
  "Comunidad Valenciana", "Extremadura", "Galicia", "La Rioja",
  "Madrid", "Murcia", "Navarra", "País Vasco", "Ceuta", "Melilla"
];

const jurisdictions = [
  { value: "estatal", label: "Estatal" },
  { value: "autonomica", label: "Autonómica" },
  { value: "provincial", label: "Provincial" },
  { value: "local", label: "Local" },
  { value: "jurisprudencia", label: "Jurisprudencia" },
];

const sourceTypes = [
  { value: "pdf", label: "Archivo PDF", icon: FileText },
  { value: "epub", label: "Archivo EPUB", icon: BookOpen },
  { value: "url", label: "URL web", icon: Globe },
];

const relationTypeLabels: Record<string, { label: string; color: string }> = {
  deroga: { label: "Deroga", color: "bg-red-50 text-red-700 border-red-200" },
  modifica: { label: "Modifica", color: "bg-amber-50 text-amber-700 border-amber-200" },
  complementa: { label: "Complementa", color: "bg-blue-50 text-blue-700 border-blue-200" },
  amplia: { label: "Amplía", color: "bg-purple-50 text-purple-700 border-purple-200" },
  prorroga: { label: "Prorroga", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  desarrolla: { label: "Desarrolla", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  interpreta: { label: "Interpreta", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
};

const AdminDocuments = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("all");
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [viewingDocTitle, setViewingDocTitle] = useState<string>("");
  const [relations, setRelations] = useState<DocumentRelation[]>([]);
  const { toast } = useToast();

  const [newDoc, setNewDoc] = useState({
    title: "",
    description: "",
    type: "ley" as string,
    jurisdiction: "estatal" as string,
    territorial_entity: "",
    source: "",
    effective_date: "",
    source_type: "pdf" as string,
    source_url: "",
    file: null as File | null,
  });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      let query = supabase
        .from("legal_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedJurisdiction !== "all") {
        query = query.eq("jurisdiction", selectedJurisdiction as any);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch chunks count for each document
      const docsWithCounts = await Promise.all(
        (data || []).map(async (doc) => {
          const { count } = await supabase
            .from("legal_chunks")
            .select("*", { count: "exact", head: true })
            .eq("document_id", doc.id);
          return { ...doc, chunks_count: count || 0 };
        })
      );

      setDocuments(docsWithCounts);

      // Fetch relations
      const { data: relData } = await supabase
        .from("document_relations")
        .select("*");
      if (relData) setRelations(relData as DocumentRelation[]);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedJurisdiction]);

  // Polling: refresh every 3s if any document is pending/processing
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) => d.processing_status === "pending" || (d.processing_status && d.processing_status.startsWith("processing"))
    );

    if (hasProcessing) {
      pollingRef.current = setInterval(() => {
        fetchDocuments();
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [documents, fetchDocuments]);

  useEffect(() => {
    fetchDocuments();
  }, [selectedJurisdiction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = newDoc.source_type === "epub"
      ? ["application/epub+zip"]
      : ["application/pdf"];
    const validExts = newDoc.source_type === "epub" ? [".epub"] : [".pdf"];

    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (hasValidExt || validTypes.includes(file.type)) {
      setNewDoc({ ...newDoc, file });
    } else {
      toast({
        title: "Formato no válido",
        description: `Solo se aceptan archivos ${newDoc.source_type === "epub" ? "EPUB" : "PDF"}`,
        variant: "destructive",
      });
    }
  };

  const [duplicateWarning, setDuplicateWarning] = useState<{ type: 'title' | 'url'; existingTitle: string; existingId: string } | null>(null);
  const [pendingUpload, setPendingUpload] = useState(false);

  const checkDuplicates = async (): Promise<boolean> => {
    // Check by title
    const { data: titleMatch } = await supabase
      .from("legal_documents")
      .select("id, title")
      .ilike("title", newDoc.title)
      .limit(1);

    if (titleMatch && titleMatch.length > 0) {
      setDuplicateWarning({ type: 'title', existingTitle: titleMatch[0].title, existingId: titleMatch[0].id });
      return true;
    }

    // Check by URL
    if (newDoc.source_type === "url" && newDoc.source_url) {
      const { data: urlMatch } = await supabase
        .from("legal_documents")
        .select("id, title")
        .eq("source_url", newDoc.source_url)
        .limit(1);

      if (urlMatch && urlMatch.length > 0) {
        setDuplicateWarning({ type: 'url', existingTitle: urlMatch[0].title, existingId: urlMatch[0].id });
        return true;
      }
    }

    return false;
  };

  const uploadDocument = async (skipDuplicateCheck = false) => {
    if (!newDoc.title) {
      toast({ title: "Campos requeridos", description: "El título es obligatorio", variant: "destructive" });
      return;
    }

    if (newDoc.source_type === "url" && !newDoc.source_url) {
      toast({ title: "URL requerida", description: "Introduce la URL del documento", variant: "destructive" });
      return;
    }

    if (newDoc.source_type !== "url" && !newDoc.file) {
      toast({ title: "Archivo requerido", description: "Selecciona un archivo", variant: "destructive" });
      return;
    }

    // Check duplicates unless skipped
    if (!skipDuplicateCheck) {
      const hasDuplicate = await checkDuplicates();
      if (hasDuplicate) return;
    }

    setUploading(true);
    setDuplicateWarning(null);
    try {
      let fileName: string | null = null;

      // Upload file if not URL
      if (newDoc.source_type !== "url" && newDoc.file) {
        fileName = `${Date.now()}-${sanitizeFileName(newDoc.file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("legal-docs")
          .upload(fileName, newDoc.file);
        if (uploadError) throw uploadError;
      }

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from("legal_documents")
        .insert({
          title: newDoc.title,
          description: newDoc.description || null,
          type: newDoc.type as any,
          jurisdiction: newDoc.jurisdiction as any,
          territorial_entity: newDoc.territorial_entity || null,
          source: newDoc.source || null,
          effective_date: newDoc.effective_date || null,
          file_path: fileName,
          processing_status: "pending",
          source_type: newDoc.source_type,
          source_url: newDoc.source_type === "url" ? newDoc.source_url : null,
        })
        .select()
        .single();

      if (docError) throw docError;

      toast({
        title: "Documento subido",
        description: "El procesamiento con IA avanzada puede tardar entre 1 y 3 minutos...",
      });

      setDialogOpen(false);
      setNewDoc({
        title: "", description: "", type: "ley", jurisdiction: "estatal",
        territorial_entity: "", source: "", effective_date: "",
        source_type: "pdf", source_url: "", file: null,
      });
      fetchDocuments();

      // Fire-and-forget
      supabase.functions.invoke("process-legal-document", {
        body: {
          documentId: docData.id,
          filePath: fileName,
          sourceType: newDoc.source_type,
          sourceUrl: newDoc.source_type === "url" ? newDoc.source_url : null,
        },
      }).catch((err) => {
        console.error("Edge function invocation error:", err);
      });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({ title: "Error al subir", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleDocumentStatus = async (doc: LegalDocument) => {
    try {
      const { error } = await supabase
        .from("legal_documents")
        .update({ is_active: !doc.is_active })
        .eq("id", doc.id);
      if (error) throw error;
      toast({
        title: doc.is_active ? "Documento desactivado" : "Documento activado",
        description: `"${doc.title}" ${doc.is_active ? "ya no se usará" : "ahora se usará"} en los análisis`,
      });
      fetchDocuments();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    }
  };

  const deleteDocument = async (doc: LegalDocument) => {
    try {
      await supabase.from("document_relations").delete().or(`source_document_id.eq.${doc.id},target_document_id.eq.${doc.id}`);
      await supabase.from("legal_chunks").delete().eq("document_id", doc.id);
      const { error } = await supabase.from("legal_documents").delete().eq("id", doc.id);
      if (error) throw error;
      toast({ title: "Documento eliminado", description: `"${doc.title}" ha sido eliminado` });
      fetchDocuments();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  };

  const reprocessDocument = async (doc: LegalDocument) => {
    try {
      const { data: docData } = await supabase
        .from("legal_documents")
        .select("file_path, source_type, source_url, processing_error")
        .eq("id", doc.id)
        .single();

      if (!docData) throw new Error("Documento no encontrado");
      if (docData.source_type !== "url" && !docData.file_path) throw new Error("No se encontró el archivo");

      // Check if this is a RESUME (timeout) vs full reprocess
      const isTimeoutResume = docData.processing_error?.includes("Tiempo límite alcanzado");

      if (isTimeoutResume) {
        // RESUME: Do NOT delete chunks or processing_error - the edge function needs them
        await supabase.from("legal_documents")
          .update({ processing_status: "pending" })
          .eq("id", doc.id);
        toast({ title: "Reanudando procesamiento...", description: "Continuando desde donde se quedó..." });
      } else {
        // FULL REPROCESS: Delete everything and start fresh
        await supabase.from("document_relations").delete().eq("source_document_id", doc.id);
        await supabase.from("legal_chunks").delete().eq("document_id", doc.id);
        await supabase.from("legal_documents")
          .update({ processing_status: "pending", processing_error: null })
          .eq("id", doc.id);
        toast({ title: "Reprocesando...", description: "El procesamiento puede tardar entre 1 y 3 minutos..." });
      }

      fetchDocuments();

      supabase.functions.invoke("process-legal-document", {
        body: {
          documentId: doc.id,
          filePath: docData.file_path,
          sourceType: docData.source_type || "pdf",
          sourceUrl: docData.source_url,
        },
      }).catch((err) => console.error("Reprocess error:", err));
    } catch (error: any) {
      toast({ title: "Error al reprocesar", description: error.message, variant: "destructive" });
    }
  };

  const [reprocessingAll, setReprocessingAll] = useState(false);

  const reconcileRelations = async () => {
    setReprocessingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke("reconcile-relations", {
        body: {},
      });
      if (error) throw error;
      toast({
        title: "Reconciliación completada",
        description: data?.message || `${data?.new_relations_found || 0} nuevas relaciones detectadas. ${data?.chunks_marked_superseded || 0} chunks obsoletos.`,
      });
      fetchDocuments();
    } catch (err) {
      console.error("Error reconciling:", err);
      toast({ title: "Error", description: "No se pudieron reconciliar las relaciones", variant: "destructive" });
    }
    setReprocessingAll(false);
  };

  const getJurisdictionLabel = (value: string | null) =>
    jurisdictions.find((j) => j.value === value)?.label || value || "N/A";

  const getDocRelations = (docId: string) =>
    relations.filter(r => r.source_document_id === docId || r.target_document_id === docId);

  const getRelationLabel = (rel: DocumentRelation, currentDocId: string) => {
    const isSource = rel.source_document_id === currentDocId;
    const otherDocId = isSource ? rel.target_document_id : rel.source_document_id;
    const otherDoc = documents.find(d => d.id === otherDocId);
    const otherTitle = otherDoc?.title || "Desconocido";
    const typeInfo = relationTypeLabels[rel.relation_type] || { label: rel.relation_type, color: "bg-muted text-muted-foreground" };
    return { label: typeInfo.label, color: typeInfo.color, otherTitle, isSource };
  };

  const isDocProcessing = (doc: LegalDocument) =>
    doc.processing_status === "pending" || (doc.processing_status && doc.processing_status.startsWith("processing"));

  const getProcessingLabel = (status: string | null | undefined) => {
    if (!status) return null;
    if (status === "pending") return "Pendiente";
    if (status === "completed") return null;
    if (status === "error") return null;
    // Extract progress info like "processing (bloque 3/7)"
    const match = status.match(/processing\s*\((.+)\)/);
    return match ? match[1] : "Procesando...";
  };

  const getSourceIcon = (sourceType: string | null | undefined) => {
    if (sourceType === "url") return <Globe className="h-3 w-3" />;
    if (sourceType === "epub") return <BookOpen className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <>
      <Helmet>
        <title>Documentos Legales | ACROXIA Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout
        title="Documentos Legales"
        description="Gestiona la base de conocimiento legal para el sistema RAG"
      >
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por jurisdicción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {jurisdictions.map((j) => (
                  <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={reconcileRelations}
              disabled={reprocessingAll || documents.length < 2}
              className="rounded-full w-full sm:w-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${reprocessingAll ? "animate-spin" : ""}`} />
              {reprocessingAll ? "Reconciliando..." : "Reconciliar relaciones"}
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full w-full sm:w-auto sm:ml-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-serif">Subir Documento Legal</DialogTitle>
                  <DialogDescription>
                    Sube un PDF, EPUB o pega una URL para añadirlo a la base de conocimiento
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Source type selector */}
                  <div className="space-y-2">
                    <Label>Tipo de fuente</Label>
                    <div className="flex gap-2">
                      {sourceTypes.map((st) => (
                        <Button
                          key={st.value}
                          variant={newDoc.source_type === st.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewDoc({ ...newDoc, source_type: st.value, file: null, source_url: "" })}
                          className="rounded-full flex-1"
                        >
                          <st.icon className="h-3 w-3 mr-1" />
                          {st.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-title">Título *</Label>
                    <Input
                      id="doc-title"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      placeholder="Ej: Ley de Arrendamientos Urbanos"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={newDoc.type} onValueChange={(value) => setNewDoc({ ...newDoc, type: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Jurisdicción</Label>
                      <Select value={newDoc.jurisdiction} onValueChange={(value) => setNewDoc({ ...newDoc, jurisdiction: value, territorial_entity: "" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {jurisdictions.map((j) => (
                            <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newDoc.jurisdiction === "autonomica" && (
                    <div className="space-y-2">
                      <Label>Comunidad Autónoma</Label>
                      <Select value={newDoc.territorial_entity} onValueChange={(value) => setNewDoc({ ...newDoc, territorial_entity: value })}>
                        <SelectTrigger><SelectValue placeholder="Selecciona una comunidad" /></SelectTrigger>
                        <SelectContent>
                          {comunidadesAutonomas.map((ca) => (
                            <SelectItem key={ca} value={ca}>{ca}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newDoc.jurisdiction === "provincial" && (
                    <div className="space-y-2">
                      <Label htmlFor="doc-province">Provincia</Label>
                      <Input id="doc-province" value={newDoc.territorial_entity} onChange={(e) => setNewDoc({ ...newDoc, territorial_entity: e.target.value })} placeholder="Ej: Barcelona, Valencia..." />
                    </div>
                  )}

                  {newDoc.jurisdiction === "local" && (
                    <div className="space-y-2">
                      <Label htmlFor="doc-municipality">Ayuntamiento</Label>
                      <Input id="doc-municipality" value={newDoc.territorial_entity} onChange={(e) => setNewDoc({ ...newDoc, territorial_entity: e.target.value })} placeholder="Ej: Ayuntamiento de Madrid" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="doc-source">Fuente</Label>
                    <Input id="doc-source" value={newDoc.source} onChange={(e) => setNewDoc({ ...newDoc, source: e.target.value })} placeholder="Ej: BOE, DOGC, etc." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-date">Fecha efectiva</Label>
                    <Input id="doc-date" type="date" value={newDoc.effective_date} onChange={(e) => setNewDoc({ ...newDoc, effective_date: e.target.value })} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-description">Descripción</Label>
                    <Textarea id="doc-description" value={newDoc.description} onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })} placeholder="Breve descripción del documento" rows={2} />
                  </div>

                  {/* Conditional: URL input or file input */}
                  {newDoc.source_type === "url" ? (
                    <div className="space-y-2">
                      <Label htmlFor="doc-url">URL del documento *</Label>
                      <Input
                        id="doc-url"
                        type="url"
                        value={newDoc.source_url}
                        onChange={(e) => setNewDoc({ ...newDoc, source_url: e.target.value })}
                        placeholder="https://www.boe.es/buscar/act.php?id=..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="doc-file">
                        Archivo {newDoc.source_type === "epub" ? "EPUB" : "PDF"} *
                      </Label>
                      <Input
                        id="doc-file"
                        type="file"
                        accept={newDoc.source_type === "epub" ? ".epub" : ".pdf"}
                        onChange={handleFileChange}
                      />
                      {newDoc.file && (
                        <p className="text-sm text-muted-foreground">
                          Seleccionado: {newDoc.file.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {duplicateWarning && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800">Posible duplicado detectado</p>
                        <p className="text-amber-700">
                          {duplicateWarning.type === 'title'
                            ? `Ya existe un documento con título similar: "${duplicateWarning.existingTitle}"`
                            : `Ya existe un documento con la misma URL: "${duplicateWarning.existingTitle}"`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setDuplicateWarning(null)} className="rounded-full text-xs">
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={() => uploadDocument(true)} disabled={uploading} className="rounded-full text-xs">
                        Subir de todos modos
                      </Button>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); setDuplicateWarning(null); }} className="rounded-full">
                    Cancelar
                  </Button>
                  <Button onClick={() => uploadDocument()} disabled={uploading} className="rounded-full">
                    {uploading ? "Subiendo..." : "Subir y procesar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando documentos...</div>
        ) : documents.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No hay documentos legales todavía</p>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>Subir el primer documento</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const docRelations = getDocRelations(doc.id);
              const processingLabel = getProcessingLabel(doc.processing_status);

              return (
                <Card key={doc.id} className="border-border">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-muted-foreground">{getSourceIcon(doc.source_type)}</span>
                          <h3 className="font-medium text-sm sm:text-base line-clamp-2 sm:line-clamp-1">{doc.title}</h3>
                          <Badge variant={doc.is_active ? "default" : "secondary"} className="text-xs">
                            {doc.is_active ? "Activo" : "Inactivo"}
                          </Badge>

                          {/* Processing status badge */}
                          {doc.processing_status === "pending" && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">
                              <Clock className="h-3 w-3 mr-1" />Pendiente
                            </Badge>
                          )}
                          {doc.processing_status && doc.processing_status.startsWith("processing") && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              {processingLabel || "Procesando..."}
                            </Badge>
                          )}
                          {doc.processing_status === "error" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />Error
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{doc.processing_error || "Error desconocido"}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {doc.processing_status === "completed" && doc.chunks_count && doc.chunks_count > 0 && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />Procesado
                            </Badge>
                          )}
                          {doc.superseded_by_id && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />Obsoleto
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {getJurisdictionLabel(doc.jurisdiction)}
                            {doc.territorial_entity && ` (${doc.territorial_entity})`}
                          </Badge>
                          <span className="hidden sm:inline">•</span>
                          <span>{doc.chunks_count} fragmentos</span>
                          {doc.keywords && doc.keywords.length > 0 && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">{doc.keywords.length} palabras clave</span>
                            </>
                          )}
                        </div>

                        {/* Relations */}
                        {docRelations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {docRelations.map((rel) => {
                              const { label, color, otherTitle, isSource } = getRelationLabel(rel, doc.id);
                              return (
                                <Tooltip key={rel.id}>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className={`text-xs ${color}`}>
                                      <LinkIcon className="h-3 w-3 mr-1" />
                                      {isSource ? label : `${label} por`}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="font-medium">{isSource ? `${label}: ${otherTitle}` : `${label} por: ${otherTitle}`}</p>
                                    {rel.description && <p className="text-xs mt-1">{rel.description}</p>}
                                    {rel.affected_articles && rel.affected_articles.length > 0 && (
                                      <p className="text-xs mt-1">Artículos: {rel.affected_articles.join(", ")}</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        )}

                        {doc.processing_status === "error" && doc.processing_error && (
                          <p className="text-xs text-destructive mt-1">{doc.processing_error}</p>
                        )}
                        {doc.ai_summary && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2 italic">{doc.ai_summary}</p>
                        )}
                      </div>

                      {/* Mobile Actions */}
                      <div className="lg:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setViewingDocId(doc.id); setViewingDocTitle(doc.title); }}>
                              <Eye className="h-4 w-4 mr-2" />Ver chunks
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => reprocessDocument(doc)} disabled={!!isDocProcessing(doc)}>
                              <RefreshCw className="h-4 w-4 mr-2" />Reprocesar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleDocumentStatus(doc)}>
                              {doc.is_active ? <><XCircle className="h-4 w-4 mr-2" />Desactivar</> : <><CheckCircle className="h-4 w-4 mr-2" />Activar</>}
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción eliminará "{doc.title}" y todos sus fragmentos.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteDocument(doc)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Desktop Actions */}
                      <div className="hidden lg:flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setViewingDocId(doc.id); setViewingDocTitle(doc.title); }} title="Ver chunks">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => reprocessDocument(doc)} title="Reprocesar" disabled={!!isDocProcessing(doc)}>
                          <RefreshCw className={`h-4 w-4 ${doc.processing_status === "error" ? "text-destructive" : "text-muted-foreground"}`} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleDocumentStatus(doc)}>
                          {doc.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción eliminará "{doc.title}" y todos sus fragmentos indexados.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteDocument(doc)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <ChunkViewer
          documentId={viewingDocId}
          documentTitle={viewingDocTitle}
          onClose={() => setViewingDocId(null)}
        />
      </AdminLayout>
    </>
  );
};

export default AdminDocuments;

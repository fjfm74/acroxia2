import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Upload, FileText, Trash2, Filter, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

// Sanitiza nombres de archivo para evitar errores de Supabase Storage
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
  const { toast } = useToast();

  const [newDoc, setNewDoc] = useState({
    title: "",
    description: "",
    type: "ley" as string,
    jurisdiction: "estatal" as string,
    territorial_entity: "",
    source: "",
    effective_date: "",
    file: null as File | null,
  });

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from("legal_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedJurisdiction !== "all") {
        query = query.eq("jurisdiction", selectedJurisdiction as "autonomica" | "estatal" | "jurisprudencia" | "local" | "provincial");
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
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedJurisdiction]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setNewDoc({ ...newDoc, file });
    } else {
      toast({
        title: "Formato no válido",
        description: "Solo se aceptan archivos PDF",
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async () => {
    if (!newDoc.title || !newDoc.file) {
      toast({
        title: "Campos requeridos",
        description: "Título y archivo son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${sanitizeFileName(newDoc.file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("legal-docs")
        .upload(fileName, newDoc.file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from("legal_documents")
        .insert({
          title: newDoc.title,
          description: newDoc.description || null,
          type: newDoc.type as "ley" | "real_decreto" | "decreto" | "orden_ministerial" | "boe" | "sentencia" | "jurisprudencia" | "guia" | "otro",
          jurisdiction: newDoc.jurisdiction as "autonomica" | "estatal" | "jurisprudencia" | "local" | "provincial",
          territorial_entity: newDoc.territorial_entity || null,
          source: newDoc.source || null,
          effective_date: newDoc.effective_date || null,
          file_path: fileName,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Process document with edge function
      const { error: processError } = await supabase.functions.invoke(
        "process-legal-document",
        {
          body: {
            documentId: docData.id,
            filePath: fileName,
          },
        }
      );

      if (processError) {
        console.error("Error processing document:", processError);
        toast({
          title: "Documento subido",
          description: "El archivo se subió pero hubo un error al procesarlo. Puede reintentarse.",
        });
      } else {
        toast({
          title: "Documento procesado",
          description: "El documento se ha indexado correctamente",
        });
      }

      setDialogOpen(false);
      setNewDoc({
        title: "",
        description: "",
        type: "ley",
        jurisdiction: "estatal",
        territorial_entity: "",
        source: "",
        effective_date: "",
        file: null,
      });
      fetchDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error al subir",
        description: error.message || "No se pudo subir el documento",
        variant: "destructive",
      });
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
      console.error("Error updating document:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (doc: LegalDocument) => {
    try {
      // Delete chunks first
      await supabase.from("legal_chunks").delete().eq("document_id", doc.id);

      // Delete document record
      const { error } = await supabase
        .from("legal_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast({
        title: "Documento eliminado",
        description: `"${doc.title}" ha sido eliminado`,
      });

      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
    }
  };

  const reprocessDocument = async (doc: LegalDocument) => {
    try {
      // Get file path from the document
      const { data: docData, error: docError } = await supabase
        .from("legal_documents")
        .select("file_path")
        .eq("id", doc.id)
        .single();

      if (docError || !docData?.file_path) {
        throw new Error("No se encontró el archivo asociado");
      }

      // Delete existing chunks first
      await supabase.from("legal_chunks").delete().eq("document_id", doc.id);

      toast({
        title: "Reprocesando...",
        description: "El documento se está procesando",
      });

      // Process document with edge function
      const { error: processError } = await supabase.functions.invoke(
        "process-legal-document",
        {
          body: {
            documentId: doc.id,
            filePath: docData.file_path,
          },
        }
      );

      if (processError) {
        throw processError;
      }

      toast({
        title: "Documento reprocesado",
        description: "Los fragmentos se han indexado correctamente",
      });

      fetchDocuments();
    } catch (error: any) {
      console.error("Error reprocessing document:", error);
      toast({
        title: "Error al reprocesar",
        description: error.message || "No se pudo reprocesar el documento",
        variant: "destructive",
      });
    }
  };

  const getJurisdictionLabel = (value: string | null) => {
    return jurisdictions.find((j) => j.value === value)?.label || value || "N/A";
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
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por jurisdicción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {jurisdictions.map((j) => (
                  <SelectItem key={j.value} value={j.value}>
                    {j.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <Upload className="h-4 w-4 mr-2" />
                Subir Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-serif">Subir Documento Legal</DialogTitle>
                <DialogDescription>
                  Sube un PDF para añadirlo a la base de conocimiento
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
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
                    <Select
                      value={newDoc.type}
                      onValueChange={(value) => setNewDoc({ ...newDoc, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Jurisdicción</Label>
                    <Select
                      value={newDoc.jurisdiction}
                      onValueChange={(value) => setNewDoc({ ...newDoc, jurisdiction: value, territorial_entity: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jurisdictions.map((j) => (
                          <SelectItem key={j.value} value={j.value}>
                            {j.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Campo condicional de entidad territorial */}
                {newDoc.jurisdiction === "autonomica" && (
                  <div className="space-y-2">
                    <Label>Comunidad Autónoma</Label>
                    <Select
                      value={newDoc.territorial_entity}
                      onValueChange={(value) => setNewDoc({ ...newDoc, territorial_entity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una comunidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {comunidadesAutonomas.map((ca) => (
                          <SelectItem key={ca} value={ca}>
                            {ca}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newDoc.jurisdiction === "provincial" && (
                  <div className="space-y-2">
                    <Label htmlFor="doc-province">Provincia</Label>
                    <Input
                      id="doc-province"
                      value={newDoc.territorial_entity}
                      onChange={(e) => setNewDoc({ ...newDoc, territorial_entity: e.target.value })}
                      placeholder="Ej: Barcelona, Valencia..."
                    />
                  </div>
                )}

                {newDoc.jurisdiction === "local" && (
                  <div className="space-y-2">
                    <Label htmlFor="doc-municipality">Ayuntamiento</Label>
                    <Input
                      id="doc-municipality"
                      value={newDoc.territorial_entity}
                      onChange={(e) => setNewDoc({ ...newDoc, territorial_entity: e.target.value })}
                      placeholder="Ej: Ayuntamiento de Madrid"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="doc-source">Fuente</Label>
                  <Input
                    id="doc-source"
                    value={newDoc.source}
                    onChange={(e) => setNewDoc({ ...newDoc, source: e.target.value })}
                    placeholder="Ej: BOE, DOGC, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-date">Fecha efectiva</Label>
                  <Input
                    id="doc-date"
                    type="date"
                    value={newDoc.effective_date}
                    onChange={(e) => setNewDoc({ ...newDoc, effective_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-description">Descripción</Label>
                  <Textarea
                    id="doc-description"
                    value={newDoc.description}
                    onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                    placeholder="Breve descripción del documento"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doc-file">Archivo PDF *</Label>
                  <Input
                    id="doc-file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  {newDoc.file && (
                    <p className="text-sm text-muted-foreground">
                      Seleccionado: {newDoc.file.name}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="rounded-full"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={uploadDocument}
                  disabled={uploading}
                  className="rounded-full"
                >
                  {uploading ? "Subiendo..." : "Subir y procesar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando documentos...
          </div>
        ) : documents.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No hay documentos legales todavía
              </p>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                Subir el primer documento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{doc.title}</h3>
                        <Badge variant={doc.is_active ? "default" : "secondary"}>
                          {doc.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">
                          {getJurisdictionLabel(doc.jurisdiction)}
                          {doc.territorial_entity && ` (${doc.territorial_entity})`}
                        </Badge>
                        <span>•</span>
                        <span>{doc.chunks_count} fragmentos indexados</span>
                        {doc.effective_date && (
                          <>
                            <span>•</span>
                            <span>
                              Vigente desde{" "}
                              {format(new Date(doc.effective_date), "d MMM yyyy", { locale: es })}
                            </span>
                          </>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.chunks_count === 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => reprocessDocument(doc)}
                          title="Reprocesar documento"
                        >
                          <RefreshCw className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleDocumentStatus(doc)}
                      >
                        {doc.is_active ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará "{doc.title}" y todos sus fragmentos indexados.
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteDocument(doc)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default AdminDocuments;

import { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { 
  Upload, 
  Download, 
  Search, 
  Filter, 
  MoreVertical, 
  Trash2,
  Mail,
  Building2,
  Users,
  MailX,
  TrendingUp,
  Plus,
  X
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MarketingContact {
  id: string;
  email: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  segment: string;
  source: string;
  consent_type: string;
  tags: string[] | null;
  last_contacted_at: string | null;
  contact_count: number | null;
  email_opens: number | null;
  email_clicks: number | null;
  unsubscribed: boolean | null;
  unsubscribed_at: string | null;
  notes: string | null;
  created_at: string | null;
}

interface Stats {
  total: number;
  bySegment: Record<string, number>;
  unsubscribed: number;
  contacted: number;
}

const SEGMENTS = [
  { value: "gestoria", label: "Gestoría" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "abogado", label: "Abogado" },
  { value: "administrador_fincas", label: "Administrador de Fincas" },
  { value: "otro", label: "Otro" },
];

const SOURCES = [
  { value: "purchased_db", label: "Base de datos comprada" },
  { value: "manual_import", label: "Importación manual" },
  { value: "website_form", label: "Formulario web" },
  { value: "event", label: "Evento" },
];

const AdminMarketingContacts = () => {
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, bySegment: {}, unsubscribed: 0, contacted: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Form state for adding single contact
  const [newContact, setNewContact] = useState({
    email: "",
    company_name: "",
    contact_name: "",
    phone: "",
    segment: "gestoria",
    source: "manual_import",
    notes: "",
  });

  // Import preview state
  const [importPreview, setImportPreview] = useState<{
    data: Array<Record<string, string>>;
    headers: string[];
    mapping: Record<string, string>;
  } | null>(null);

  const fetchContacts = async () => {
    try {
      let query = supabase
        .from("marketing_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (segmentFilter !== "all") {
        query = query.eq("segment", segmentFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setContacts(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const bySegment: Record<string, number> = {};
      let unsubscribed = 0;
      let contacted = 0;

      data?.forEach((contact) => {
        bySegment[contact.segment] = (bySegment[contact.segment] || 0) + 1;
        if (contact.unsubscribed) unsubscribed++;
        if (contact.contact_count && contact.contact_count > 0) contacted++;
      });

      setStats({ total, bySegment, unsubscribed, contacted });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contactos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [segmentFilter]);

  const filteredContacts = contacts.filter((contact) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      contact.email.toLowerCase().includes(term) ||
      contact.company_name?.toLowerCase().includes(term) ||
      contact.contact_name?.toLowerCase().includes(term)
    );
  });

  const addContact = async () => {
    if (!newContact.email.trim()) {
      toast({
        title: "Email requerido",
        description: "El email es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from("marketing_contacts").insert({
        email: newContact.email.trim().toLowerCase(),
        company_name: newContact.company_name || null,
        contact_name: newContact.contact_name || null,
        phone: newContact.phone || null,
        segment: newContact.segment,
        source: newContact.source,
        notes: newContact.notes || null,
        consent_type: "legitimate_interest",
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Email duplicado",
            description: "Este email ya existe en la base de datos",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Contacto añadido",
        description: `${newContact.email} se ha añadido correctamente`,
      });

      setAddDialogOpen(false);
      setNewContact({
        email: "",
        company_name: "",
        contact_name: "",
        phone: "",
        segment: "gestoria",
        source: "manual_import",
        notes: "",
      });
      fetchContacts();
    } catch (error: any) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el contacto",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const deleteContact = async (contact: MarketingContact) => {
    try {
      const { error } = await supabase
        .from("marketing_contacts")
        .delete()
        .eq("id", contact.id);

      if (error) throw error;

      toast({
        title: "Contacto eliminado",
        description: `${contact.email} ha sido eliminado`,
      });

      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Archivo vacío",
          description: "El archivo no contiene datos",
          variant: "destructive",
        });
        return;
      }

      // Parse headers (first line)
      const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
      
      // Parse data rows
      const data = lines.slice(1).map((line) => {
        const values = line.split(/[,;]/).map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });

      // Auto-detect column mapping
      const mapping: Record<string, string> = {
        email: headers.find((h) => h.includes("email") || h.includes("correo")) || "",
        company_name: headers.find((h) => h.includes("empresa") || h.includes("company") || h.includes("nombre empresa")) || "",
        contact_name: headers.find((h) => h.includes("nombre") || h.includes("name") || h.includes("contacto")) || "",
        phone: headers.find((h) => h.includes("telefono") || h.includes("phone") || h.includes("tel")) || "",
      };

      setImportPreview({ data, headers, mapping });
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const executeImport = async () => {
    if (!importPreview) return;

    const { data, mapping } = importPreview;
    
    if (!mapping.email) {
      toast({
        title: "Email requerido",
        description: "Debes mapear la columna de email",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of data) {
        const email = row[mapping.email]?.trim().toLowerCase();
        if (!email || !email.includes("@")) {
          errorCount++;
          continue;
        }

        const { error } = await supabase.from("marketing_contacts").insert({
          email,
          company_name: row[mapping.company_name] || null,
          contact_name: row[mapping.contact_name] || null,
          phone: row[mapping.phone] || null,
          segment: "gestoria",
          source: "purchased_db",
          consent_type: "legitimate_interest",
        });

        if (error) {
          if (error.code !== "23505") {
            console.error("Import error:", error);
          }
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast({
        title: "Importación completada",
        description: `${successCount} contactos importados, ${errorCount} errores/duplicados`,
      });

      setImportDialogOpen(false);
      setImportPreview(null);
      fetchContacts();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description: "Error durante la importación",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const exportContacts = () => {
    const csvContent = [
      ["Email", "Empresa", "Contacto", "Teléfono", "Segmento", "Fuente", "Creado"].join(","),
      ...filteredContacts.map((c) =>
        [
          c.email,
          c.company_name || "",
          c.contact_name || "",
          c.phone || "",
          c.segment,
          c.source,
          c.created_at ? format(new Date(c.created_at), "yyyy-MM-dd") : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `marketing-contacts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const getSegmentBadge = (segment: string) => {
    const colors: Record<string, string> = {
      gestoria: "bg-blue-100 text-blue-800",
      inmobiliaria: "bg-green-100 text-green-800",
      abogado: "bg-purple-100 text-purple-800",
      administrador_fincas: "bg-orange-100 text-orange-800",
      otro: "bg-gray-100 text-gray-800",
    };
    return colors[segment] || colors.otro;
  };

  return (
    <>
      <Helmet>
        <title>Marketing B2B | ACROXIA Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout
        title="Contactos Marketing B2B"
        description="Gestiona contactos profesionales para campañas de marketing"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total contactos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.bySegment.gestoria || 0}</p>
                  <p className="text-xs text-muted-foreground">Gestorías</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.contacted}</p>
                  <p className="text-xs text-muted-foreground">Contactados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <MailX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.unsubscribed}</p>
                  <p className="text-xs text-muted-foreground">Bajas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, empresa o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los segmentos</SelectItem>
              {SEGMENTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">Añadir Contacto</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo contacto profesional a la base de datos
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="contacto@empresa.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={newContact.company_name}
                      onChange={(e) => setNewContact({ ...newContact, company_name: e.target.value })}
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre de contacto</Label>
                    <Input
                      id="name"
                      value={newContact.contact_name}
                      onChange={(e) => setNewContact({ ...newContact, contact_name: e.target.value })}
                      placeholder="Nombre y apellidos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Segmento</Label>
                      <Select
                        value={newContact.segment}
                        onValueChange={(v) => setNewContact({ ...newContact, segment: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SEGMENTS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Fuente</Label>
                      <Select
                        value={newContact.source}
                        onValueChange={(v) => setNewContact({ ...newContact, source: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={newContact.notes}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      placeholder="Notas adicionales..."
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddDialogOpen(false)}
                    className="rounded-full"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={addContact} disabled={adding} className="rounded-full">
                    {adding ? "Añadiendo..." : "Añadir contacto"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Importar Contactos</DialogTitle>
                  <DialogDescription>
                    Sube un archivo CSV con los contactos a importar
                  </DialogDescription>
                </DialogHeader>

                {!importPreview ? (
                  <div className="py-8">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Haz clic para seleccionar un archivo CSV
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Columnas esperadas: email, empresa, nombre, teléfono
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {importPreview.data.length} contactos detectados
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setImportPreview(null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Columna Email *</Label>
                        <Select
                          value={importPreview.mapping.email}
                          onValueChange={(v) =>
                            setImportPreview({
                              ...importPreview,
                              mapping: { ...importPreview.mapping, email: v },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar columna" />
                          </SelectTrigger>
                          <SelectContent>
                            {importPreview.headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Columna Empresa</Label>
                        <Select
                          value={importPreview.mapping.company_name}
                          onValueChange={(v) =>
                            setImportPreview({
                              ...importPreview,
                              mapping: { ...importPreview.mapping, company_name: v },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar columna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Ninguna --</SelectItem>
                            {importPreview.headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Columna Nombre</Label>
                        <Select
                          value={importPreview.mapping.contact_name}
                          onValueChange={(v) =>
                            setImportPreview({
                              ...importPreview,
                              mapping: { ...importPreview.mapping, contact_name: v },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar columna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Ninguna --</SelectItem>
                            {importPreview.headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Columna Teléfono</Label>
                        <Select
                          value={importPreview.mapping.phone}
                          onValueChange={(v) =>
                            setImportPreview({
                              ...importPreview,
                              mapping: { ...importPreview.mapping, phone: v },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar columna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Ninguna --</SelectItem>
                            {importPreview.headers.map((h) => (
                              <SelectItem key={h} value={h}>
                                {h}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                      <strong>Base legal:</strong> Los contactos se importarán con base legal de "interés legítimo" 
                      según el Art. 6.1.f del RGPD. Asegúrate de que tienes derecho a contactar a estas empresas.
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportDialogOpen(false);
                      setImportPreview(null);
                    }}
                    className="rounded-full"
                  >
                    Cancelar
                  </Button>
                  {importPreview && (
                    <Button onClick={executeImport} disabled={importing} className="rounded-full">
                      {importing ? "Importando..." : `Importar ${importPreview.data.length} contactos`}
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={exportContacts} className="rounded-full">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Contacts List */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Cargando contactos...
          </div>
        ) : filteredContacts.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || segmentFilter !== "all"
                  ? "No se encontraron contactos con esos filtros"
                  : "No hay contactos de marketing. Importa un CSV o añade contactos manualmente."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="lg:hidden space-y-3">
              {filteredContacts.map((contact) => (
                <Card key={contact.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {contact.company_name || contact.email}
                          </span>
                          <Badge className={`text-xs ${getSegmentBadge(contact.segment)}`}>
                            {SEGMENTS.find((s) => s.value === contact.segment)?.label}
                          </Badge>
                          {contact.unsubscribed && (
                            <Badge variant="destructive" className="text-xs">Baja</Badge>
                          )}
                        </div>
                        {contact.company_name && (
                          <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                        )}
                        {contact.contact_name && (
                          <p className="text-xs text-muted-foreground">{contact.contact_name}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {contact.created_at && format(new Date(contact.created_at), "d MMM yyyy", { locale: es })}
                          {contact.contact_count && contact.contact_count > 0 && (
                            <span className="ml-2">· {contact.contact_count} emails</span>
                          )}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {contact.email} será eliminado permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteContact(contact)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View - Table */}
            <Card className="hidden lg:block border-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa / Email</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Segmento</TableHead>
                      <TableHead>Fuente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contact.company_name || contact.email}</p>
                            {contact.company_name && (
                              <p className="text-xs text-muted-foreground">{contact.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{contact.contact_name || "-"}</p>
                            {contact.phone && (
                              <p className="text-xs text-muted-foreground">{contact.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSegmentBadge(contact.segment)}>
                            {SEGMENTS.find((s) => s.value === contact.segment)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {SOURCES.find((s) => s.value === contact.source)?.label}
                        </TableCell>
                        <TableCell>
                          {contact.unsubscribed ? (
                            <Badge variant="destructive">Baja</Badge>
                          ) : contact.contact_count && contact.contact_count > 0 ? (
                            <Badge variant="secondary">{contact.contact_count} emails</Badge>
                          ) : (
                            <Badge variant="outline">Sin contactar</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {contact.email} será eliminado permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteContact(contact)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Info Card */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Sobre los contactos B2B</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Esta base de datos está diseñada para contactos profesionales (gestorías, inmobiliarias, etc.) 
              que pueden ser contactados bajo la base legal del <strong>interés legítimo</strong> (Art. 6.1.f RGPD).
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Puedes importar bases de datos compradas de profesionales del sector</li>
              <li>Los contactos pueden darse de baja en cualquier momento</li>
              <li>Se registra el historial de emails enviados y bajas</li>
              <li>Segmenta por tipo de profesional para campañas específicas</li>
            </ul>
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
};

export default AdminMarketingContacts;

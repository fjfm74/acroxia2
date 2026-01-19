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
  Sparkles,
  User,
  Plus,
  X,
  Eye,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ContactSourceIcon, ContactSource } from "@/components/admin/ContactSourceBadge";
import ContactDetailPanel from "@/components/admin/ContactDetailPanel";

interface UnifiedContact {
  email: string;
  name: string | null;
  phone: string | null;
  sources: ContactSource[];
  canMarket: boolean;
  userType: string | null;
  lastActivity: string | null;
  profileData?: {
    id: string;
    createdAt: string;
    credits: number;
    marketingConsent: boolean;
    userType: string | null;
  };
  newsletterData?: {
    id: string;
    createdAt: string;
    audience: string;
    confirmed: boolean;
    unsubscribed: boolean;
  };
  b2bData?: {
    id: string;
    createdAt: string;
    segment: string;
    companyName: string | null;
    source: string;
    unsubscribed: boolean;
    tags: string[] | null;
    notes: string | null;
  };
  leadData?: {
    id: string;
    createdAt: string;
    source: string | null;
    contractStatus: string | null;
    converted: boolean;
  };
}

interface Stats {
  total: number;
  clients: number;
  newsletter: number;
  b2b: number;
  leads: number;
}

const SEGMENTS = [
  { value: "gestoria", label: "Gestoría" },
  { value: "inmobiliaria", label: "Inmobiliaria" },
  { value: "abogado", label: "Abogado" },
  { value: "administrador_fincas", label: "Administrador de Fincas" },
  { value: "otro", label: "Otro" },
];

const SOURCES_FILTER = [
  { value: "all", label: "Todas las fuentes" },
  { value: "cliente", label: "Clientes" },
  { value: "newsletter", label: "Newsletter" },
  { value: "b2b", label: "B2B" },
  { value: "lead", label: "Leads" },
];

const AdminContactsCRM = () => {
  const [contacts, setContacts] = useState<UnifiedContact[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, clients: 0, newsletter: 0, b2b: 0, leads: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [marketingFilter, setMarketingFilter] = useState<string>("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedContact, setSelectedContact] = useState<UnifiedContact | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Form state for adding single B2B contact
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

  const fetchAllContacts = async () => {
    setLoading(true);
    try {
      // Fetch all 4 tables in parallel
      const [profilesRes, subscribersRes, marketingRes, leadsRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("blog_subscribers").select("*"),
        supabase.from("marketing_contacts").select("*"),
        supabase.from("leads").select("*"),
      ]);

      // Build contact map by email
      const contactMap = new Map<string, UnifiedContact>();

      // Process profiles (clients)
      profilesRes.data?.forEach((profile) => {
        const email = profile.email.toLowerCase();
        const existing = contactMap.get(email) || createEmptyContact(email);
        existing.sources.push("cliente");
        existing.name = existing.name || profile.full_name || profile.first_name;
        existing.phone = existing.phone || profile.phone;
        existing.userType = existing.userType || profile.user_type;
        existing.canMarket = existing.canMarket || (profile.marketing_consent ?? false);
        existing.lastActivity = getLatestDate(existing.lastActivity, profile.updated_at);
        existing.profileData = {
          id: profile.id,
          createdAt: profile.created_at,
          credits: profile.credits,
          marketingConsent: profile.marketing_consent ?? false,
          userType: profile.user_type,
        };
        contactMap.set(email, existing);
      });

      // Process newsletter subscribers
      subscribersRes.data?.forEach((sub) => {
        const email = sub.email.toLowerCase();
        const existing = contactMap.get(email) || createEmptyContact(email);
        existing.sources.push("newsletter");
        const canReceive = (sub.confirmed ?? false) && !(sub.unsubscribed ?? false);
        existing.canMarket = existing.canMarket || canReceive;
        existing.lastActivity = getLatestDate(existing.lastActivity, sub.created_at);
        existing.newsletterData = {
          id: sub.id,
          createdAt: sub.created_at ?? "",
          audience: sub.audience,
          confirmed: sub.confirmed ?? false,
          unsubscribed: sub.unsubscribed ?? false,
        };
        contactMap.set(email, existing);
      });

      // Process B2B marketing contacts
      marketingRes.data?.forEach((contact) => {
        const email = contact.email.toLowerCase();
        const existing = contactMap.get(email) || createEmptyContact(email);
        existing.sources.push("b2b");
        existing.name = existing.name || contact.contact_name;
        existing.phone = existing.phone || contact.phone;
        const canReceive = !(contact.unsubscribed ?? false);
        existing.canMarket = existing.canMarket || canReceive;
        existing.lastActivity = getLatestDate(existing.lastActivity, contact.updated_at);
        existing.b2bData = {
          id: contact.id,
          createdAt: contact.created_at ?? "",
          segment: contact.segment,
          companyName: contact.company_name,
          source: contact.source,
          unsubscribed: contact.unsubscribed ?? false,
          tags: contact.tags,
          notes: contact.notes,
        };
        contactMap.set(email, existing);
      });

      // Process leads
      leadsRes.data?.forEach((lead) => {
        const email = lead.email.toLowerCase();
        const existing = contactMap.get(email) || createEmptyContact(email);
        existing.sources.push("lead");
        const canReceive = !(lead.unsubscribed ?? false);
        existing.canMarket = existing.canMarket || canReceive;
        existing.lastActivity = getLatestDate(existing.lastActivity, lead.created_at);
        existing.leadData = {
          id: lead.id,
          createdAt: lead.created_at ?? "",
          source: lead.source,
          contractStatus: lead.contract_status,
          converted: lead.converted_to_user_id !== null,
        };
        contactMap.set(email, existing);
      });

      const allContacts = Array.from(contactMap.values());
      
      // Sort by last activity
      allContacts.sort((a, b) => {
        const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
        const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
        return dateB - dateA;
      });

      setContacts(allContacts);

      // Calculate stats
      setStats({
        total: allContacts.length,
        clients: profilesRes.data?.length || 0,
        newsletter: subscribersRes.data?.filter(s => s.confirmed && !s.unsubscribed)?.length || 0,
        b2b: marketingRes.data?.filter(m => !m.unsubscribed)?.length || 0,
        leads: leadsRes.data?.filter(l => !l.converted_to_user_id)?.length || 0,
      });
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

  const createEmptyContact = (email: string): UnifiedContact => ({
    email,
    name: null,
    phone: null,
    sources: [],
    canMarket: false,
    userType: null,
    lastActivity: null,
  });

  const getLatestDate = (date1: string | null, date2: string | null): string | null => {
    if (!date1) return date2;
    if (!date2) return date1;
    return new Date(date1) > new Date(date2) ? date1 : date2;
  };

  useEffect(() => {
    fetchAllContacts();
  }, []);

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        contact.email.toLowerCase().includes(term) ||
        contact.name?.toLowerCase().includes(term) ||
        contact.b2bData?.companyName?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }

    // Source filter
    if (sourceFilter !== "all") {
      if (!contact.sources.includes(sourceFilter as ContactSource)) return false;
    }

    // Marketing filter
    if (marketingFilter === "can_market" && !contact.canMarket) return false;
    if (marketingFilter === "no_market" && contact.canMarket) return false;

    return true;
  });

  // Add B2B contact
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
            description: "Este email ya existe en marketing_contacts",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Contacto añadido",
        description: `${newContact.email} se ha añadido como contacto B2B`,
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
      fetchAllContacts();
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

  // Delete B2B contact
  const deleteB2BContact = async (contact: UnifiedContact) => {
    if (!contact.b2bData) return;
    try {
      const { error } = await supabase
        .from("marketing_contacts")
        .delete()
        .eq("id", contact.b2bData.id);

      if (error) throw error;

      toast({
        title: "Contacto B2B eliminado",
        description: `${contact.email} ha sido eliminado de marketing_contacts`,
      });

      fetchAllContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto",
        variant: "destructive",
      });
    }
  };

  // CSV Import handlers
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

      const headers = lines[0].split(/[,;]/).map((h) => h.trim().toLowerCase());
      const data = lines.slice(1).map((line) => {
        const values = line.split(/[,;]/).map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = values[i] || "";
        });
        return row;
      });

      const mapping: Record<string, string> = {
        email: headers.find((h) => h.includes("email") || h.includes("correo")) || "",
        company_name: headers.find((h) => h.includes("empresa") || h.includes("company")) || "",
        contact_name: headers.find((h) => h.includes("nombre") || h.includes("name")) || "",
        phone: headers.find((h) => h.includes("telefono") || h.includes("phone")) || "",
      };

      setImportPreview({ data, headers, mapping });
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      fetchAllContacts();
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
      ["Email", "Nombre", "Teléfono", "Tipo", "Fuentes", "Puede Marketing"].join(","),
      ...filteredContacts.map((c) =>
        [
          c.email,
          c.name || "",
          c.phone || "",
          c.userType || "",
          c.sources.join(";"),
          c.canMarket ? "Sí" : "No",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `crm-contacts-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <>
      <Helmet>
        <title>CRM Contactos | ACROXIA Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout
        title="CRM de Contactos"
        description="Gestiona todos tus contactos desde un solo lugar"
      >
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total únicos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.clients}</p>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.newsletter}</p>
                  <p className="text-xs text-muted-foreground">Newsletter</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.b2b}</p>
                  <p className="text-xs text-muted-foreground">B2B</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats.leads}</p>
                  <p className="text-xs text-muted-foreground">Leads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nombre o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                {SOURCES_FILTER.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={marketingFilter} onValueChange={setMarketingFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Marketing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="can_market">Acepta marketing</SelectItem>
                <SelectItem value="no_market">No acepta</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Añadir B2B
            </Button>

            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar CSV
            </Button>

            <Button variant="outline" onClick={exportContacts}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Source Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <ContactSourceIcon source="cliente" /> Cliente
          </span>
          <span className="flex items-center gap-1">
            <ContactSourceIcon source="newsletter" /> Newsletter
          </span>
          <span className="flex items-center gap-1">
            <ContactSourceIcon source="b2b" /> B2B
          </span>
          <span className="flex items-center gap-1">
            <ContactSourceIcon source="lead" /> Lead
          </span>
        </div>

        {/* Contacts Table */}
        <Card className="border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando contactos...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No se encontraron contactos
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fuentes</TableHead>
                        <TableHead>Marketing</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow
                          key={contact.email}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <TableCell className="font-medium">{contact.email}</TableCell>
                          <TableCell>{contact.name || "-"}</TableCell>
                          <TableCell>
                            {contact.userType ? (
                              <Badge variant="secondary" className="capitalize">
                                {contact.userType}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {contact.sources.map((source) => (
                                <ContactSourceIcon key={source} source={source} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {contact.canMarket ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                ✓ Sí
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedContact(contact)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalle
                                </DropdownMenuItem>
                                {contact.b2bData && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Eliminar B2B
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar contacto B2B?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Se eliminará de marketing_contacts. Si existe en otras fuentes, seguirá apareciendo.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteB2BContact(contact)}>
                                          Eliminar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-border">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.email}
                      className="p-4 cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{contact.email}</p>
                          <p className="text-sm text-muted-foreground">{contact.name || "Sin nombre"}</p>
                        </div>
                        <div className="flex gap-1">
                          {contact.sources.map((source) => (
                            <ContactSourceIcon key={source} source={source} />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        {contact.userType && (
                          <Badge variant="secondary" className="capitalize text-xs">
                            {contact.userType}
                          </Badge>
                        )}
                        {contact.canMarket ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Marketing ✓</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">No marketing</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mt-4">
          Mostrando {filteredContacts.length} de {contacts.length} contactos únicos
        </p>
      </AdminLayout>

      {/* Add B2B Contact Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir contacto B2B</DialogTitle>
            <DialogDescription>
              Añade un contacto profesional a la base de datos de marketing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="contacto@empresa.es"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-company">Empresa</Label>
                <Input
                  id="add-company"
                  value={newContact.company_name}
                  onChange={(e) => setNewContact({ ...newContact, company_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-name">Nombre contacto</Label>
                <Input
                  id="add-name"
                  value={newContact.contact_name}
                  onChange={(e) => setNewContact({ ...newContact, contact_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="add-phone">Teléfono</Label>
                <Input
                  id="add-phone"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="add-segment">Segmento</Label>
                <Select
                  value={newContact.segment}
                  onValueChange={(v) => setNewContact({ ...newContact, segment: v })}
                >
                  <SelectTrigger id="add-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((seg) => (
                      <SelectItem key={seg.value} value={seg.value}>
                        {seg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="add-notes">Notas</Label>
              <Textarea
                id="add-notes"
                value={newContact.notes}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={addContact} disabled={adding}>
              {adding ? "Añadiendo..." : "Añadir contacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Importar contactos B2B desde CSV</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con los contactos a importar. Se guardarán en marketing_contacts.
            </DialogDescription>
          </DialogHeader>

          {!importPreview ? (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Arrastra un archivo CSV o haz clic para seleccionar
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm">
                <strong>{importPreview.data.length}</strong> registros encontrados
              </p>

              <div className="space-y-3">
                <p className="text-sm font-medium">Mapeo de columnas:</p>
                {["email", "company_name", "contact_name", "phone"].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <Label className="w-32 text-sm capitalize">
                      {field.replace("_", " ")}
                      {field === "email" && " *"}
                    </Label>
                    <Select
                      value={importPreview.mapping[field] || ""}
                      onValueChange={(v) =>
                        setImportPreview({
                          ...importPreview,
                          mapping: { ...importPreview.mapping, [field]: v },
                        })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccionar columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- No mapear --</SelectItem>
                        {importPreview.headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setImportPreview(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={executeImport} disabled={importing} className="flex-1">
                  {importing ? "Importando..." : "Importar contactos"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Detail Panel */}
      <ContactDetailPanel contact={selectedContact} onClose={() => setSelectedContact(null)} />
    </>
  );
};

export default AdminContactsCRM;

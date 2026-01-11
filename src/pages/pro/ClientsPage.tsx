import { useState, useEffect } from "react";
import { useIsProfessional } from "@/hooks/useIsProfessional";
import { supabase } from "@/integrations/supabase/client";
import ProLayout from "@/components/pro/ProLayout";
import ClientForm from "@/components/pro/ClientForm";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, User, FileText, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  contractCount: number;
  createdAt: string;
}

const ClientsPage = () => {
  const { organization } = useIsProfessional();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    if (!organization) return;

    try {
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      const { data: contractsData } = await supabase
        .from("contracts")
        .select("client_id")
        .eq("organization_id", organization.id);

      const clientsWithCounts = (clientsData || []).map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        notes: client.notes,
        contractCount: contractsData?.filter((c) => c.client_id === client.id).length || 0,
        createdAt: client.created_at,
      }));

      setClients(clientsWithCounts);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [organization]);

  const handleDelete = async (clientId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;

    try {
      const { error } = await supabase.from("clients").delete().eq("id", clientId);
      if (error) throw error;
      toast.success("Cliente eliminado");
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Error al eliminar el cliente");
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase()) ||
      client.phone?.includes(search)
  );

  return (
    <ProLayout title="Clientes" subtitle="Gestiona tus clientes y sus contratos">
      <FadeIn>
        <Card className="bg-background rounded-2xl shadow-lg border-0">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-muted border-0"
                />
              </div>
              <Button
                onClick={() => {
                  setEditingClient(null);
                  setFormOpen(true);
                }}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo cliente
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Cargando...
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {search ? "No se encontraron clientes" : "Aún no tienes clientes"}
                </p>
                {!search && (
                  <Button
                    onClick={() => setFormOpen(true)}
                    className="bg-foreground text-background hover:bg-foreground/90 rounded-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir tu primer cliente
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Contratos</TableHead>
                      <TableHead>Fecha alta</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              {client.notes && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {client.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {client.email && <p>{client.email}</p>}
                            {client.phone && (
                              <p className="text-muted-foreground">{client.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-muted">
                            <FileText className="h-3 w-3 mr-1" />
                            {client.contractCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(client.createdAt), "d MMM yyyy", {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(client)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(client.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {organization && (
        <ClientForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditingClient(null);
          }}
          organizationId={organization.id}
          onSuccess={fetchClients}
          client={editingClient || undefined}
        />
      )}
    </ProLayout>
  );
};

export default ClientsPage;

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Mail, Trash2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  target_audience: string;
  status: string;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
  sent_at: string | null;
}

interface AdminCampaignsListProps {
  onEdit: (id: string) => void;
  onNew: () => void;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  scheduled: { label: "Programada", variant: "outline" },
  sending: { label: "Enviando...", variant: "default" },
  sent: { label: "Enviada", variant: "default" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

const audienceLabels: Record<string, string> = {
  inquilino: "Inquilinos",
  propietario: "Propietarios",
  profesional: "Profesionales",
  all: "Todos",
};

const AdminCampaignsList = ({ onEdit, onNew }: AdminCampaignsListProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    setLoading(true);
    let query = supabase
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching campaigns:", error);
    } else {
      setCampaigns((data as Campaign[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase.from("email_campaigns").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campaña eliminada" });
      fetchCampaigns();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="sent">Enviadas</SelectItem>
            <SelectItem value="sending">Enviando</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={onNew} className="rounded-full">
          <Plus className="h-4 w-4 mr-2" />
          Nueva campaña
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando campañas...</div>
      ) : campaigns.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No hay campañas todavía</p>
            <Button onClick={onNew} className="mt-4 rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Crear primera campaña
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Audiencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Enviados</TableHead>
                <TableHead className="hidden lg:table-cell">Apertura</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const openRate = c.total_sent > 0 ? ((c.total_opened / c.total_sent) * 100).toFixed(0) : "-";
                const st = statusLabels[c.status] || { label: c.status, variant: "secondary" as const };
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onEdit(c.id)}
                  >
                    <TableCell>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.subject}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{audienceLabels[c.target_audience] || c.target_audience}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {c.total_sent > 0 ? `${c.total_sent.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {openRate !== "-" ? `${openRate}%` : "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {c.sent_at
                        ? format(new Date(c.sent_at), "d MMM yyyy", { locale: es })
                        : format(new Date(c.created_at), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      {c.status === "draft" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar campaña</AlertDialogTitle>
                              <AlertDialogDescription>
                                ¿Seguro que quieres eliminar "{c.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCampaign(c.id)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignsList;

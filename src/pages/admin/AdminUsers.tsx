import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { UserPlus, Trash2, Shield } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
  email: string;
  full_name: string | null;
}

const AdminUsers = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAdmins = async () => {
    try {
      // Get admin roles with profile info
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("id, user_id, created_at")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      // Get profile info for each admin
      const adminsWithProfiles = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", role.user_id)
            .single();

          return {
            ...role,
            email: profile?.email || "N/A",
            full_name: profile?.full_name || null,
          };
        })
      );

      setAdmins(adminsWithProfiles);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los administradores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: "Email requerido",
        description: "Introduce el email del usuario",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", newAdminEmail.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        toast({
          title: "Usuario no encontrado",
          description: "No existe ningún usuario registrado con ese email",
          variant: "destructive",
        });
        return;
      }

      // Check if already admin
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.id)
        .eq("role", "admin")
        .single();

      if (existingRole) {
        toast({
          title: "Ya es administrador",
          description: "Este usuario ya tiene rol de administrador",
          variant: "destructive",
        });
        return;
      }

      // Add admin role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({
          user_id: profile.id,
          role: "admin",
        });

      if (insertError) throw insertError;

      toast({
        title: "Administrador añadido",
        description: `${profile.email} ahora es administrador`,
      });

      setDialogOpen(false);
      setNewAdminEmail("");
      fetchAdmins();
    } catch (error: any) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el administrador",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const removeAdmin = async (admin: AdminUser) => {
    // Prevent self-removal
    if (admin.user_id === user?.id) {
      toast({
        title: "Acción no permitida",
        description: "No puedes eliminarte a ti mismo como administrador",
        variant: "destructive",
      });
      return;
    }

    // Prevent removing last admin
    if (admins.length <= 1) {
      toast({
        title: "Acción no permitida",
        description: "Debe haber al menos un administrador en el sistema",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", admin.id);

      if (error) throw error;

      toast({
        title: "Administrador eliminado",
        description: `${admin.email} ya no es administrador`,
      });

      fetchAdmins();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el administrador",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Usuarios Admin | ACROXIA Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout
        title="Usuarios Administradores"
        description="Gestiona quién tiene acceso al panel de administración"
      >
        <div className="flex justify-end mb-6">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Añadir Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Añadir Administrador</DialogTitle>
                <DialogDescription>
                  Introduce el email de un usuario registrado para darle acceso de administrador
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email del usuario</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                  />
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
                  onClick={addAdmin}
                  disabled={adding}
                  className="rounded-full"
                >
                  {adding ? "Añadiendo..." : "Añadir admin"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Cargando administradores...
              </div>
            ) : admins.length === 0 ? (
              <div className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay administradores configurados
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {admin.full_name || "Sin nombre"}
                          {admin.user_id === user?.id && (
                            <span className="text-xs text-muted-foreground">(tú)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(admin.created_at), "d MMM yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={admin.user_id === user?.id || admins.length <= 1}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar administrador?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {admin.email} perderá el acceso al panel de administración.
                                Esta acción se puede revertir añadiéndolo de nuevo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeAdmin(admin)}>
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="font-serif text-lg">Sobre los roles de administrador</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Los administradores tienen acceso completo al panel de administración, incluyendo:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Crear, editar y eliminar posts del blog</li>
              <li>Subir y gestionar documentos legales</li>
              <li>Añadir o eliminar otros administradores</li>
              <li>Ver estadísticas del sistema</li>
            </ul>
            <p className="pt-2">
              <strong>Nota:</strong> No es posible eliminarse a uno mismo ni eliminar al último administrador del sistema.
            </p>
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
};

export default AdminUsers;

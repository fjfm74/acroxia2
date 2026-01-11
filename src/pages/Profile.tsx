import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, CreditCard, Shield, Trash2, Calendar, Mail, Coins, Lock, ExternalLink, Infinity, Phone } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch subscription data
  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          full_name: `${firstName} ${lastName}`.trim() || null
        })
        .eq("id", user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success("Contraseña actualizada correctamente");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDialogOpen(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Error al cambiar la contraseña");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      toast.error("Por favor, escribe ELIMINAR para confirmar");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      
      if (error) throw error;
      
      toast.success("Cuenta eliminada correctamente");
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Error al eliminar la cuenta");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPlanName = (planType?: string) => {
    switch (planType) {
      case "annual": return "Suscripción Anual";
      case "professional": return "Profesional";
      case "gestoria": return "Gestoría";
      default: return "Plan Gratuito";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activo</Badge>;
      case "canceled":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Cancelado</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      default:
        return <Badge variant="secondary">Sin suscripción</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Mi Perfil - ACROXIA</title>
        <meta name="description" content="Gestiona tu perfil, suscripción y configuración de cuenta en ACROXIA." />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-muted pt-28 pb-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <FadeIn>
            <div className="mb-10">
              <h1 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-2">
                Mi Perfil
              </h1>
              <p className="text-muted-foreground">
                Gestiona tu información personal y configuración de cuenta
              </p>
            </div>
          </FadeIn>

          <div className="space-y-6">
            {/* Datos Personales */}
            <FadeIn delay={0.1}>
              <Card className="rounded-2xl shadow-lg border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Datos Personales</CardTitle>
                      <CardDescription>Tu información de cuenta</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Nombre</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Apellidos</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Tus apellidos"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground truncate">{profile?.email}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono (opcional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+34 600 000 000"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Miembro desde {user?.created_at 
                          ? format(new Date(user.created_at), "MMMM yyyy", { locale: es })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving || (firstName === profile?.first_name && lastName === profile?.last_name && phone === (profile?.phone || ""))}
                    className="rounded-full"
                  >
                    {isSaving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Plan y Suscripción */}
            <FadeIn delay={0.2}>
              <Card className="rounded-2xl shadow-lg border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <CreditCard className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Plan y Suscripción</CardTitle>
                      <CardDescription>Tu plan actual y créditos disponibles</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Plan actual</span>
                        {getStatusBadge(subscription?.status)}
                      </div>
                      <p className="text-lg font-medium">{getPlanName(subscription?.plan_type)}</p>
                      {subscription?.current_period_end && (
                        <p className="text-sm text-muted-foreground">
                          Renovación: {format(new Date(subscription.current_period_end), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Créditos disponibles</span>
                      </div>
                      <p className="text-3xl font-semibold">
                        {isAdmin ? (
                          <span className="flex items-center gap-2">
                            <Infinity className="h-6 w-6" />
                            Ilimitados
                          </span>
                        ) : (
                          profile?.credits || 0
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isAdmin ? "Los administradores no consumen créditos" : "Cada análisis consume 1 crédito"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild variant="outline" className="rounded-full w-full sm:w-auto">
                      <Link to="/precios">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Cambiar plan
                      </Link>
                    </Button>
                    {subscription?.status === "active" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" className="rounded-full text-muted-foreground w-full sm:w-auto">
                            Cancelar suscripción
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4 sm:mx-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tu suscripción permanecerá activa hasta el final del período actual. 
                              Después no se renovará automáticamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">Volver</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => toast.info("Función disponible próximamente")}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                            >
                              Cancelar suscripción
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Seguridad */}
            <FadeIn delay={0.3}>
              <Card className="rounded-2xl shadow-lg border-border/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Seguridad</CardTitle>
                      <CardDescription>Gestiona tu contraseña y acceso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full">
                        <Lock className="mr-2 h-4 w-4" />
                        Cambiar contraseña
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cambiar contraseña</DialogTitle>
                        <DialogDescription>
                          Introduce tu nueva contraseña. Debe tener al menos 6 caracteres.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">Nueva contraseña</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleChangePassword} 
                          disabled={isChangingPassword || !newPassword || !confirmPassword}
                        >
                          {isChangingPassword ? "Actualizando..." : "Actualizar contraseña"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </FadeIn>

            {/* Zona de Peligro */}
            <FadeIn delay={0.4}>
              <Card className="rounded-2xl shadow-lg border-destructive/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-destructive">Zona de Peligro</CardTitle>
                      <CardDescription>Acciones irreversibles</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                    <h4 className="font-medium text-destructive mb-2">Eliminar cuenta</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
                      Esta acción no se puede deshacer.
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="rounded-full">
                          Eliminar mi cuenta
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="mx-4 sm:mx-auto">
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-4">
                            <p>
                              Esta acción eliminará permanentemente tu cuenta y todos los datos asociados, 
                              incluyendo contratos y análisis. Esta acción no se puede deshacer.
                            </p>
                            <div className="space-y-2">
                              <Label htmlFor="deleteConfirm">
                                Escribe <span className="font-mono font-semibold">ELIMINAR</span> para confirmar:
                              </Label>
                              <Input
                                id="deleteConfirm"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="ELIMINAR"
                              />
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel onClick={() => setDeleteConfirmText("")} className="w-full sm:w-auto">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== "ELIMINAR" || isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                          >
                            {isDeleting ? "Eliminando..." : "Eliminar cuenta"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Profile;

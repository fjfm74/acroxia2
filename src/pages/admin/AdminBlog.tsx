import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, CalendarClock, Loader2, Users, Home } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { MoreVertical } from "lucide-react";
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

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: "draft" | "published";
  audience: "inquilino" | "propietario";
  created_at: string;
  published_at: string | null;
}

type AudienceFilter = "all" | "inquilino" | "propietario";

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulingEnabled, setSchedulingEnabled] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(true);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("all");
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from("blog_posts")
        .select("id, slug, title, category, status, audience, created_at, published_at")
        .order("created_at", { ascending: false });

      if (audienceFilter !== "all") {
        query = query.eq("audience", audienceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts((data || []) as BlogPost[]);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "daily_post_scheduling")
        .maybeSingle();

      if (error) throw error;
      const configValue = data?.value as { enabled?: boolean } | null;
      setSchedulingEnabled(configValue?.enabled === true);
    } catch (error) {
      console.error("Error fetching scheduling status:", error);
    } finally {
      setSchedulingLoading(false);
    }
  };

  const toggleScheduling = async () => {
    setSchedulingLoading(true);
    const newValue = !schedulingEnabled;
    
    try {
      const { error } = await supabase
        .from("site_config")
        .upsert({ 
          key: "daily_post_scheduling", 
          value: { enabled: newValue },
          updated_at: new Date().toISOString()
        }, { onConflict: "key" });

      if (error) throw error;

      setSchedulingEnabled(newValue);
      toast({
        title: newValue ? "Programación activada" : "Programación desactivada",
        description: newValue 
          ? "Se generarán posts diarios para inquilinos (9:00) y propietarios (10:00)" 
          : "No se generarán posts automáticamente",
      });
    } catch (error) {
      console.error("Error toggling scheduling:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la programación",
        variant: "destructive",
      });
    } finally {
      setSchedulingLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchSchedulingStatus();
  }, [audienceFilter]);

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const updates: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === "published" && !post.published_at) {
      updates.published_at = new Date().toISOString();
    }

    try {
      const { error } = await supabase
        .from("blog_posts")
        .update(updates)
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: newStatus === "published" ? "Post publicado" : "Post despublicado",
        description: `"${post.title}" ahora está ${newStatus === "published" ? "visible" : "oculto"}`,
      });

      fetchPosts();
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const deletePost = async (post: BlogPost) => {
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Post eliminado",
        description: `"${post.title}" ha sido eliminado`,
      });

      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el post",
        variant: "destructive",
      });
    }
  };

  const getAudienceBadge = (audience: string) => {
    if (audience === "propietario") {
      return (
        <Badge variant="outline" className="text-xs gap-1">
          <Home className="h-3 w-3" />
          Propietario
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs gap-1">
        <Users className="h-3 w-3" />
        Inquilino
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>Gestión de Blog | ACROXIA Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout 
        title="Gestión de Blog" 
        description="Crea y administra los posts del blog"
      >
        {/* Header Actions */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Scheduling Toggle */}
            <Card className="border-border">
              <CardContent className="p-4 flex items-center gap-4">
                <CalendarClock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor="scheduling-toggle" className="font-medium cursor-pointer">
                    Programación diaria
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Genera posts a las 9:00 (inquilinos) y 10:00 (propietarios)
                  </p>
                </div>
                {schedulingLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Switch
                    id="scheduling-toggle"
                    checked={schedulingEnabled}
                    onCheckedChange={toggleScheduling}
                  />
                )}
              </CardContent>
            </Card>

            <Button asChild className="rounded-full">
              <Link to="/admin/blog/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Post
              </Link>
            </Button>
          </div>

          {/* Audience Filter Tabs */}
          <Tabs value={audienceFilter} onValueChange={(v) => setAudienceFilter(v as AudienceFilter)}>
            <TabsList className="bg-muted">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Todos
              </TabsTrigger>
              <TabsTrigger value="inquilino" className="text-xs sm:text-sm gap-1">
                <Users className="h-3 w-3 hidden sm:inline" />
                Inquilinos
              </TabsTrigger>
              <TabsTrigger value="propietario" className="text-xs sm:text-sm gap-1">
                <Home className="h-3 w-3 hidden sm:inline" />
                Propietarios
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Cargando posts...
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {audienceFilter === "all" 
                  ? "No hay posts todavía"
                  : `No hay posts para ${audienceFilter === "inquilino" ? "inquilinos" : "propietarios"}`
                }
              </p>
              <Button asChild variant="outline">
                <Link to="/admin/blog/nuevo">Crear el primer post</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile View - Cards */}
            <div className="lg:hidden space-y-3">
              {posts.map((post) => (
                <Card key={post.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2">{post.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {getAudienceBadge(post.audience || "inquilino")}
                          <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                          <Badge 
                            variant={post.status === "published" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {post.status === "published" ? "Publicado" : "Borrador"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(post.created_at), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleStatus(post)}>
                            {post.status === "published" ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Despublicar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Publicar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/blog/editar/${post.id}`}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El post "{post.title}" será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePost(post)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      <TableHead>Título</TableHead>
                      <TableHead>Audiencia</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-[250px] truncate">
                          {post.title}
                        </TableCell>
                        <TableCell>
                          {getAudienceBadge(post.audience || "inquilino")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{post.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={post.status === "published" ? "default" : "outline"}
                          >
                            {post.status === "published" ? "Publicado" : "Borrador"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(post.created_at), "d MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleStatus(post)}
                              title={post.status === "published" ? "Despublicar" : "Publicar"}
                            >
                              {post.status === "published" ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/admin/blog/editar/${post.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar post?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El post "{post.title}" será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePost(post)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </AdminLayout>
    </>
  );
};

export default AdminBlog;

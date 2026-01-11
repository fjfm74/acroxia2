import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
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
  created_at: string;
  published_at: string | null;
}

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, category, status, created_at, published_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
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

  useEffect(() => {
    fetchPosts();
  }, []);

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    const updates: any = { status: newStatus };
    
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
        <div className="flex justify-end mb-6">
          <Button asChild className="rounded-full">
            <Link to="/admin/blog/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Post
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Cargando posts...
          </div>
        ) : posts.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No hay posts todavía</p>
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
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-[300px] truncate">
                          {post.title}
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

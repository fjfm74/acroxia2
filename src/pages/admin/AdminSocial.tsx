import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Instagram, Facebook, Linkedin, Twitter, Trash2, Edit, Clock, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";
type Status = "draft" | "ready" | "published";

const platformIcons: Record<Platform, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  tiktok: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  facebook: <Facebook className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
};

const statusLabels: Record<Status, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  ready: { label: "Listo", variant: "default" },
  published: { label: "Publicado", variant: "outline" },
};

const AdminSocial = () => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["social-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_posts")
        .select("*, blog_posts(title)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Contenido eliminado",
        description: "El post social ha sido eliminado correctamente.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el contenido.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout
      title="Social Media"
      description="Crea y gestiona contenido para redes sociales con IA"
    >
      <div className="flex justify-end mb-6">
        <Link to="/admin/social/nuevo">
          <Button className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Crear contenido
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Cargando...
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-background rounded-xl border border-border p-4 flex items-center gap-4"
            >
              {/* Platform icon */}
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {platformIcons[post.platform as Platform]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium truncate">{post.title}</h3>
                  <Badge variant={statusLabels[post.status as Status].variant}>
                    {statusLabels[post.status as Status].label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">{post.platform}</span>
                  <span>•</span>
                  <span className="capitalize">{post.content_type.replace("_", " ")}</span>
                  {post.blog_posts && (
                    <>
                      <span>•</span>
                      <span>Desde: {post.blog_posts.title}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                {post.scheduled_for && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(post.scheduled_for).toLocaleDateString()}</span>
                  </div>
                )}
                {post.status === "published" && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link to={`/admin/social/editar/${post.id}`}>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar contenido?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán todas las imágenes asociadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(post.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletingId === post.id ? "Eliminando..." : "Eliminar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/50 rounded-2xl">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Instagram className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Sin contenido social</h3>
          <p className="text-muted-foreground mb-6">
            Crea tu primer post para redes sociales con IA
          </p>
          <Link to="/admin/social/nuevo">
            <Button className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              Crear contenido
            </Button>
          </Link>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSocial;

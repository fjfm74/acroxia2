import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";
import ReactMarkdown from "react-markdown";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string | null;
  slug: string;
}

interface ScheduledPost {
  id: string;
  status: string;
  blog_post_id: string;
}

type PageStatus = "loading" | "pending" | "approving" | "approved" | "rejected" | "already_processed" | "error";

export default function AprobarPost() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<PageStatus>("loading");
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState<string>("");
  const [previousStatus, setPreviousStatus] = useState<string>("");

  useEffect(() => {
    if (token) {
      fetchPost();
    }
  }, [token]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("approve-post", {
        body: { token, action: "get" }
      });

      if (error) throw error;

      if (data.error) {
        if (data.status) {
          setPreviousStatus(data.status);
          setPost(data.post);
          setStatus("already_processed");
        } else {
          setError(data.error);
          setStatus("error");
        }
        return;
      }

      setPost(data.post);
      setStatus("pending");
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("No se pudo cargar el post");
      setStatus("error");
    }
  };

  const handleApprove = async () => {
    setStatus("approving");
    try {
      const { data, error } = await supabase.functions.invoke("approve-post", {
        body: { token, action: "approve" }
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
        setStatus("error");
        return;
      }

      setStatus("approved");
    } catch (err) {
      console.error("Error approving:", err);
      setError("Error al aprobar el post");
      setStatus("error");
    }
  };

  const handleReject = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("approve-post", {
        body: { token, action: "reject" }
      });

      if (error) throw error;

      setStatus("rejected");
    } catch (err) {
      console.error("Error rejecting:", err);
      setError("Error al rechazar el post");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <h1 className="font-serif text-3xl font-semibold text-foreground">ACROXIA</h1>
            </Link>
            <p className="text-muted-foreground mt-2">Sistema de aprobación de posts</p>
          </div>
        </FadeIn>

        {status === "loading" && (
          <FadeIn>
            <Card className="text-center py-16">
              <CardContent>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Cargando post...</p>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {status === "error" && (
          <FadeIn>
            <Card className="text-center py-16 border-destructive/20">
              <CardContent>
                <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
                <h2 className="mt-4 text-xl font-semibold text-foreground">Error</h2>
                <p className="mt-2 text-muted-foreground">{error}</p>
                <Button asChild className="mt-6">
                  <Link to="/">Volver al inicio</Link>
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {status === "already_processed" && (
          <FadeIn>
            <Card className="text-center py-16">
              <CardContent>
                {previousStatus === "approved" ? (
                  <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
                ) : (
                  <XCircle className="h-16 w-16 mx-auto text-amber-600" />
                )}
                <h2 className="mt-4 text-xl font-semibold text-foreground">
                  Post ya {previousStatus === "approved" ? "aprobado" : "rechazado"}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {previousStatus === "approved" 
                    ? "Este post ya fue aprobado y publicado anteriormente."
                    : "Este post fue rechazado y permanece como borrador."}
                </p>
                {post && previousStatus === "approved" && (
                  <Button asChild className="mt-6">
                    <Link to={`/blog/${post.slug}`}>
                      Ver post publicado <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {status === "approved" && (
          <FadeIn>
            <Card className="text-center py-16 border-green-200 bg-green-50/50">
              <CardContent>
                <CheckCircle2 className="h-20 w-20 mx-auto text-green-600" />
                <h2 className="mt-4 text-2xl font-serif font-semibold text-foreground">¡Post Publicado!</h2>
                <p className="mt-2 text-muted-foreground">El artículo ya está visible en el blog.</p>
                {post && (
                  <Button asChild className="mt-6 rounded-full">
                    <Link to={`/blog/${post.slug}`}>
                      Ver post <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {status === "rejected" && (
          <FadeIn>
            <Card className="text-center py-16 border-amber-200 bg-amber-50/50">
              <CardContent>
                <XCircle className="h-20 w-20 mx-auto text-amber-600" />
                <h2 className="mt-4 text-2xl font-serif font-semibold text-foreground">Post Rechazado</h2>
                <p className="mt-2 text-muted-foreground">
                  El post permanece como borrador. Puedes editarlo desde el panel de administración.
                </p>
                <Button asChild variant="outline" className="mt-6 rounded-full">
                  <Link to="/admin/blog">Ir al panel de administración</Link>
                </Button>
              </CardContent>
            </Card>
          </FadeIn>
        )}

        {(status === "pending" || status === "approving") && post && (
          <FadeIn>
            <Card className="overflow-hidden">
              {post.image && (
                <div className="aspect-video w-full overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{post.category}</Badge>
                  <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                    Pendiente de aprobación
                  </Badge>
                </div>
                <CardTitle className="font-serif text-2xl md:text-3xl">{post.title}</CardTitle>
                <p className="text-muted-foreground mt-2 text-lg">{post.excerpt}</p>
              </CardHeader>
              
              <CardContent>
                <div className="prose prose-lg max-w-none mb-8 max-h-[500px] overflow-y-auto border rounded-lg p-6 bg-muted/30">
                  <ReactMarkdown>{post.content}</ReactMarkdown>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t">
                  <Button 
                    onClick={handleApprove}
                    disabled={status === "approving"}
                    className="rounded-full px-8"
                    size="lg"
                  >
                    {status === "approving" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" />
                        Aprobar y Publicar
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={handleReject}
                    variant="outline"
                    disabled={status === "approving"}
                    className="rounded-full px-8"
                    size="lg"
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Rechazar
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  También puedes <Link to="/admin/blog" className="underline hover:text-foreground">editar el borrador</Link> desde el panel de administración.
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </div>
    </div>
  );
}

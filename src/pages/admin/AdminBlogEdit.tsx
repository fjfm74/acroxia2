import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { Sparkles, Wand2, Save, Eye, RefreshCw, ImageIcon, Loader2, Share2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const categories = [
  "Cláusulas",
  "Fianzas",
  "Derechos",
  "Subidas de renta",
  "Legislación",
  "Consejos",
];

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

const AdminBlogEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [originalStatus, setOriginalStatus] = useState<string>("draft");
  
  const [post, setPost] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    image: "",
    read_time: "5 min",
    meta_description: "",
    keywords: [] as string[],
  });

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching post:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar el post",
          variant: "destructive",
        });
        navigate("/admin/blog");
        return;
      }

      if (!data) {
        toast({
          title: "Post no encontrado",
          description: "El post que buscas no existe",
          variant: "destructive",
        });
        navigate("/admin/blog");
        return;
      }

      setPost({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || "",
        content: data.content,
        category: data.category,
        image: data.image || "",
        read_time: data.read_time || "5 min",
        meta_description: data.meta_description || "",
        keywords: data.keywords || [],
      });
      setOriginalStatus(data.status);
      setLoading(false);
    };

    fetchPost();
  }, [id, navigate, toast]);

  const generateWithAI = async (mode: "auto" | "custom") => {
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-blog-post", {
        body: {
          mode,
          prompt: mode === "custom" ? customPrompt : undefined,
        },
      });

      if (response.error) throw response.error;

      const generated = response.data;
      setPost({
        title: generated.title,
        slug: generateSlug(generated.title),
        excerpt: generated.excerpt,
        content: generated.content,
        category: generated.category,
        image: generated.image || post.image,
        read_time: generated.read_time || "5 min",
        meta_description: generated.meta_description || generated.excerpt,
        keywords: generated.keywords || [],
      });

      toast({
        title: "Post regenerado",
        description: "Revisa el contenido antes de guardar",
      });
    } catch (error: any) {
      console.error("Error generating post:", error);
      toast({
        title: "Error al generar",
        description: error.message || "No se pudo generar el post",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const regenerateImage = async () => {
    if (!post.title) {
      toast({
        title: "Título requerido",
        description: "Añade un título para generar una imagen contextual",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await supabase.functions.invoke("generate-blog-image", {
        body: {
          title: post.title,
          excerpt: post.excerpt,
          category: post.category,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.image_url) {
        setPost({ ...post, image: response.data.image_url });
        toast({
          title: "Imagen generada",
          description: "Se ha creado una nueva imagen para el post",
        });
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      toast({
        title: "Error al generar imagen",
        description: error.message || "No se pudo generar la imagen",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const savePost = async (publish: boolean) => {
    if (!post.title || !post.content || !post.category) {
      toast({
        title: "Campos requeridos",
        description: "Título, contenido y categoría son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const newStatus = publish ? "published" : "draft";
      const { error } = await supabase
        .from("blog_posts")
        .update({
          title: post.title,
          slug: post.slug || generateSlug(post.title),
          excerpt: post.excerpt,
          content: post.content,
          category: post.category,
          image: post.image || null,
          read_time: post.read_time,
          meta_description: post.meta_description,
          keywords: post.keywords,
          status: newStatus,
          published_at: publish && originalStatus !== "published" 
            ? new Date().toISOString() 
            : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: publish ? "Post publicado" : "Cambios guardados",
        description: publish 
          ? "El post ya está visible en el blog" 
          : "Los cambios se han guardado correctamente",
      });

      navigate("/admin/blog");
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el post",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const createSocialContent = () => {
    if (!id) return;
    navigate(`/admin/social/nuevo?blog_id=${id}`);
  };

  if (loading) {
    return (
      <AdminLayout title="Editar Post" description="Cargando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Editar Post | ACROXIA Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout 
        title="Editar Post" 
        description="Modifica el contenido del post"
      >
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* AI Generation Panel */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <Card className="border-border">
              <CardHeader className="pb-3 lg:pb-6">
                <CardTitle className="flex items-center gap-2 font-serif text-base lg:text-lg">
                  <Sparkles className="h-5 w-5" />
                  Regenerar con IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => generateWithAI("auto")}
                  disabled={generating}
                  className="w-full rounded-full"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {generating ? "Generando..." : "Regenerar Automático"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Reescribirá el contenido con un nuevo enfoque
                </p>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">o</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="prompt">Tu tema específico</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Ej: Reescribe enfocándote en consejos prácticos para inquilinos..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={() => generateWithAI("custom")}
                    disabled={generating || !customPrompt.trim()}
                    variant="outline"
                    className="w-full rounded-full"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Regenerar con mi tema
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Panel - hidden on mobile */}
            {post.content && (
              <Card className="border-border hidden lg:block">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 font-serif text-lg">
                    <Eye className="h-4 w-4" />
                    Vista previa
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <h2 className="font-serif text-lg">{post.title}</h2>
                  <p className="text-muted-foreground text-sm">{post.excerpt}</p>
                  <div className="max-h-[300px] overflow-y-auto">
                    <ReactMarkdown>{`${post.content.slice(0, 1000)}...`}</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Editor Panel */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <Card className="border-border">
              <CardContent className="p-6 space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={post.title}
                      onChange={(e) => setPost({ 
                        ...post, 
                        title: e.target.value,
                        slug: generateSlug(e.target.value)
                      })}
                      placeholder="Título del post"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <Input
                        id="slug"
                        value={post.slug}
                        onChange={(e) => setPost({ ...post, slug: e.target.value })}
                        placeholder="url-del-post"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoría</Label>
                      <Select
                        value={post.category}
                        onValueChange={(value) => setPost({ ...post, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Extracto</Label>
                    <Textarea
                      id="excerpt"
                      value={post.excerpt}
                      onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                      placeholder="Resumen corto del post"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Imagen destacada
                    </Label>
                    
                    {/* Image Preview */}
                    {post.image && (
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        <img 
                          src={post.image} 
                          alt="Vista previa de imagen destacada" 
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400&auto=format&fit=crop";
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Regenerate Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={regenerateImage}
                      disabled={generatingImage || !post.title}
                      className="w-full rounded-full"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${generatingImage ? "animate-spin" : ""}`} />
                      {generatingImage ? "Generando imagen..." : "Buscar otra imagen (IA)"}
                    </Button>
                    
                    {/* Manual URL Input */}
                    <Input
                      id="image"
                      value={post.image}
                      onChange={(e) => setPost({ ...post, image: e.target.value })}
                      placeholder="O introduce URL manualmente..."
                      className="text-sm"
                    />
                  </div>

                  <Tabs defaultValue="edit" className="w-full">
                    <TabsList>
                      <TabsTrigger value="edit">Editar</TabsTrigger>
                      <TabsTrigger value="preview">Vista previa</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit" className="mt-4">
                      <Textarea
                        value={post.content}
                        onChange={(e) => setPost({ ...post, content: e.target.value })}
                        placeholder="Contenido del post en Markdown..."
                        rows={20}
                        className="font-mono text-sm"
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="mt-4">
                      <div className="prose prose-sm max-w-none min-h-[400px] p-4 border rounded-lg bg-background">
                        <ReactMarkdown components={{ p: ({ children }) => <p>{children}</p> }}>{post.content}</ReactMarkdown>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="read_time">Tiempo de lectura</Label>
                      <Input
                        id="read_time"
                        value={post.read_time}
                        onChange={(e) => setPost({ ...post, read_time: e.target.value })}
                        placeholder="5 min"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta_description">Meta descripción (SEO)</Label>
                      <Input
                        id="meta_description"
                        value={post.meta_description}
                        onChange={(e) => setPost({ ...post, meta_description: e.target.value })}
                        placeholder="Descripción para buscadores"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={createSocialContent}
                    className="rounded-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Crear contenido social
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => savePost(false)}
                    disabled={saving}
                    className="rounded-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar cambios
                  </Button>
                  <Button
                    onClick={() => savePost(true)}
                    disabled={saving}
                    className="rounded-full"
                  >
                    {originalStatus === "published" ? "Actualizar" : "Publicar ahora"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminBlogEdit;

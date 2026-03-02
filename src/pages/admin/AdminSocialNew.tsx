import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Loader2, ArrowLeft, Save, Plus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PlatformSelector from "@/components/admin/social/PlatformSelector";
import ContentTypeSelector from "@/components/admin/social/ContentTypeSelector";
import SlideEditor, { Slide } from "@/components/admin/social/SlideEditor";
import CaptionEditor from "@/components/admin/social/CaptionEditor";
import HashtagEditor from "@/components/admin/social/HashtagEditor";
import SocialPreviewMockup from "@/components/admin/social/SocialPreviewMockup";
import PublishActions from "@/components/admin/social/PublishActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";
type ContentType = "post" | "carousel" | "story" | "reel_script" | "thread";
type Audience = "inquilino" | "propietario";

interface BlogSource {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string | null;
  meta_description: string | null;
  keywords: string[] | null;
  audience: Audience;
  read_time: string;
  status: string;
}

const VALID_CONTENT_TYPES_BY_PLATFORM: Record<Platform, ContentType[]> = {
  instagram: ["post", "carousel", "story", "reel_script"],
  tiktok: ["reel_script"],
  facebook: ["post", "carousel", "story", "reel_script"],
  linkedin: ["post", "carousel", "thread"],
  twitter: ["post", "thread"],
};

const getDefaultContentType = (platform: Platform): ContentType => VALID_CONTENT_TYPES_BY_PLATFORM[platform][0];

const applyFeaturedImageToSlides = (baseSlides: Slide[], featuredImage?: string | null): Slide[] => {
  if (!featuredImage || baseSlides.length === 0) return baseSlides;

  return baseSlides.map((slide, index) => {
    if (index === 0 || slide.type === "cover") {
      return { ...slide, image_url: featuredImage };
    }
    return { ...slide, image_url: undefined };
  });
};

const AdminSocialNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const blogIdFromUrl = searchParams.get("blog_id");

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [contentType, setContentType] = useState<ContentType>("carousel");
  const [caption, setCaption] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [customAudience, setCustomAudience] = useState<Audience>("inquilino");
  const [selectedBlogId, setSelectedBlogId] = useState(blogIdFromUrl || "");
  const [generatingSlideImage, setGeneratingSlideImage] = useState<number | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"blog" | "topic">(blogIdFromUrl ? "blog" : "topic");

  const { data: blogPosts } = useQuery({
    queryKey: ["blog-posts-social-source"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, category, excerpt, content, image, meta_description, keywords, audience, read_time, status")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as BlogSource[];
    },
  });

  const selectedBlogPost = useMemo(
    () => blogPosts?.find((post) => post.id === selectedBlogId) ?? null,
    [blogPosts, selectedBlogId],
  );

  useEffect(() => {
    const allowed = VALID_CONTENT_TYPES_BY_PLATFORM[platform];
    if (!allowed.includes(contentType)) {
      setContentType(getDefaultContentType(platform));
    }
  }, [platform, contentType]);

  const generateContent = async () => {
    if (activeTab === "blog" && !selectedBlogId) {
      toast({ title: "Error", description: "Selecciona un post del blog", variant: "destructive" });
      return;
    }
    if (activeTab === "blog" && !selectedBlogPost) {
      toast({ title: "Error", description: "No se ha podido cargar el post seleccionado", variant: "destructive" });
      return;
    }
    if (activeTab === "topic" && !customTopic.trim()) {
      toast({ title: "Error", description: "Escribe un tema personalizado", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-content", {
        body: {
          mode: activeTab === "blog" ? "from_blog" : "from_topic",
          blog_post: activeTab === "blog" ? selectedBlogPost : null,
          custom_topic: customTopic,
          audience: activeTab === "blog" ? selectedBlogPost?.audience : customAudience,
          platform,
          content_type: contentType,
        },
      });

      if (error) throw error;

      const generatedSlides = Array.isArray(data.slides) ? (data.slides as Slide[]) : [];
      const finalSlides =
        activeTab === "blog" ? applyFeaturedImageToSlides(generatedSlides, selectedBlogPost?.image) : generatedSlides;

      setCaption(data.caption || "");
      setSlides(finalSlides);
      setHashtags(data.hashtags || []);

      if (!title && selectedBlogPost) {
        setTitle(`${platform.charAt(0).toUpperCase() + platform.slice(1)} - ${selectedBlogPost.title.slice(0, 60)}`);
      } else if (!title && customTopic) {
        setTitle(`${platform.charAt(0).toUpperCase() + platform.slice(1)} - ${customTopic.slice(0, 60)}`);
      }

      toast({ title: "Contenido generado", description: "Revisa y edita el contenido antes de guardar." });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar el contenido",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSlideImage = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    setGeneratingSlideImage(slideIndex);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-image", {
        body: {
          prompt: slide.visual_suggestion || slide.headline,
          slide_number: slide.slide_number,
          post_id: crypto.randomUUID(),
          platform,
          content_type: contentType,
          title: activeTab === "blog" ? selectedBlogPost?.title || title : title || customTopic,
          audience: activeTab === "blog" ? selectedBlogPost?.audience || customAudience : customAudience,
        },
      });

      if (error) throw error;

      const updatedSlides = [...slides];
      updatedSlides[slideIndex] = { ...slide, image_url: data.image_url };
      setSlides(updatedSlides);

      toast({ title: "Imagen generada" });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo generar la imagen",
        variant: "destructive",
      });
    } finally {
      setGeneratingSlideImage(null);
    }
  };

  const savePost = async (status: "draft" | "ready") => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Añade un título", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const imageUrls = slides.filter((s) => s.image_url).map((s) => s.image_url as string);

      const { error } = await supabase.from("social_posts").insert([
        {
          title,
          platform,
          content_type: contentType,
          caption,
          slides: JSON.parse(JSON.stringify(slides)),
          hashtags,
          image_urls: imageUrls,
          source_blog_id: activeTab === "blog" ? selectedBlogId || null : null,
          status,
          author_id: user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: status === "ready" ? "Contenido listo" : "Borrador guardado",
        description:
          status === "ready" ? "El contenido está listo para publicar" : "Puedes continuar editando más tarde",
      });
      navigate("/admin/social");
    } catch (error) {
      console.error("Error saving post:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el contenido",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addSlide = () => {
    const newSlide: Slide = {
      slide_number: slides.length + 1,
      type: "content",
      headline: "",
      body: "",
      visual_suggestion: "",
    };
    setSlides([...slides, newSlide]);
  };

  const updateSlide = (index: number, slide: Slide) => {
    const updated = [...slides];
    updated[index] = slide;
    setSlides(updated);
  };

  const deleteSlide = (index: number) => {
    const updated = slides.filter((_, i) => i !== index);
    updated.forEach((s, i) => {
      s.slide_number = i + 1;
    });
    setSlides(updated);
  };

  return (
    <AdminLayout title="Crear contenido social" description="Genera posts para redes sociales con IA">
      <Button variant="ghost" onClick={() => navigate("/admin/social")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Social Media
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          <div className="space-y-2">
            <Label htmlFor="title">Título interno</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Instagram - Guía alquiler 2026"
            />
          </div>

          <PlatformSelector value={platform} onChange={setPlatform} />

          <ContentTypeSelector value={contentType} onChange={setContentType} platform={platform} />

          <div className="bg-muted/50 rounded-xl p-6 space-y-4">
            <h3 className="font-medium">Fuente del contenido</h3>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "blog" | "topic")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="blog">Desde un post del blog</TabsTrigger>
                <TabsTrigger value="topic">Tema personalizado</TabsTrigger>
              </TabsList>
              <TabsContent value="blog" className="pt-4">
                <Select value={selectedBlogId} onValueChange={setSelectedBlogId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un post del blog..." />
                  </SelectTrigger>
                  <SelectContent>
                    {blogPosts?.map((post) => (
                      <SelectItem key={post.id} value={post.id}>
                        {post.title} {post.status !== "published" ? `(${post.status})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBlogPost && (
                  <div className="mt-3 rounded-lg border border-border bg-background/80 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{selectedBlogPost.title}</p>
                    <p>
                      {selectedBlogPost.category} · Audiencia {selectedBlogPost.audience} · {selectedBlogPost.read_time}
                    </p>
                    {selectedBlogPost.image && (
                      <p className="mt-1">La portada social reutilizara la imagen destacada del post.</p>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="topic" className="pt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="custom-topic">Tema</Label>
                    <Textarea
                      id="custom-topic"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Describe el tema sobre el que quieres crear contenido..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Audiencia</Label>
                    <Select value={customAudience} onValueChange={(value) => setCustomAudience(value as Audience)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inquilino">Inquilinos</SelectItem>
                        <SelectItem value="propietario">Propietarios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={generateContent} disabled={isGenerating} className="w-full rounded-full">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando contenido...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generar con IA
                </>
              )}
            </Button>
          </div>

          {caption && (
            <div className="space-y-4">
              <h3 className="font-medium">Caption</h3>
              <CaptionEditor value={caption} onChange={setCaption} platform={platform} />
              <HashtagEditor hashtags={hashtags} onChange={setHashtags} platform={platform} />
            </div>
          )}

          {(caption || slides.length > 0) && (
            <PublishActions platform={platform} title={title} caption={caption} hashtags={hashtags} slides={slides} />
          )}

          {slides.length > 0 && (contentType === "carousel" || contentType === "story" || contentType === "thread") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Slides ({slides.length})</h3>
                <Button variant="outline" size="sm" onClick={addSlide}>
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir slide
                </Button>
              </div>
              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <SlideEditor
                    key={index}
                    slide={slide}
                    onChange={(updated) => updateSlide(index, updated)}
                    onDelete={() => deleteSlide(index)}
                    onGenerateImage={() => generateSlideImage(index)}
                    isGeneratingImage={generatingSlideImage === index}
                    canDelete={slides.length > 1}
                  />
                ))}
              </div>
            </div>
          )}

          {slides.length === 1 && (contentType === "post" || contentType === "reel_script") && (
            <div className="space-y-4">
              <h3 className="font-medium">Imagen</h3>
              <SlideEditor
                slide={slides[0]}
                onChange={(updated) => updateSlide(0, updated)}
                onDelete={() => {}}
                onGenerateImage={() => generateSlideImage(0)}
                isGeneratingImage={generatingSlideImage === 0}
                canDelete={false}
              />
            </div>
          )}

          {(caption || slides.length > 0) && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => savePost("draft")} disabled={isSaving} className="rounded-full">
                <Save className="h-4 w-4 mr-2" />
                Guardar borrador
              </Button>
              <Button onClick={() => savePost("ready")} disabled={isSaving} className="rounded-full">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Marcar como listo"
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <h3 className="font-medium text-center">Vista previa</h3>
            {slides.length > 0 || caption ? (
              <SocialPreviewMockup platform={platform} slides={slides} caption={caption} hashtags={hashtags} />
            ) : (
              <div className="bg-muted/50 rounded-xl p-8 text-center text-sm text-muted-foreground">
                Genera contenido para ver la vista previa
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSocialNew;

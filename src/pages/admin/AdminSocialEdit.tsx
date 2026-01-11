import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ArrowLeft, Save, Plus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PlatformSelector from "@/components/admin/social/PlatformSelector";
import ContentTypeSelector from "@/components/admin/social/ContentTypeSelector";
import SlideEditor, { Slide } from "@/components/admin/social/SlideEditor";
import CaptionEditor from "@/components/admin/social/CaptionEditor";
import HashtagEditor from "@/components/admin/social/HashtagEditor";
import SocialPreviewMockup from "@/components/admin/social/SocialPreviewMockup";
import PublishActions from "@/components/admin/social/PublishActions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";
type ContentType = "post" | "carousel" | "story" | "reel_script" | "thread";
type Status = "draft" | "ready" | "published";

const AdminSocialEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  // Form state
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [contentType, setContentType] = useState<ContentType>("carousel");
  const [caption, setCaption] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("draft");
  const [generatingSlideImage, setGeneratingSlideImage] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("social_posts")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        setTitle(data.title);
        setPlatform(data.platform as Platform);
        setContentType(data.content_type as ContentType);
        setCaption(data.caption || "");
        setSlides((data.slides as unknown as Slide[]) || []);
        setHashtags(data.hashtags || []);
        setStatus(data.status as Status);
      } catch (error) {
        console.error("Error fetching post:", error);
        toast({ title: "Error", description: "No se pudo cargar el contenido", variant: "destructive" });
        navigate("/admin/social");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate, toast]);

  // Generate image for a slide
  const generateSlideImage = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    setGeneratingSlideImage(slideIndex);
    try {
      const { data, error } = await supabase.functions.invoke("generate-social-image", {
        body: {
          prompt: slide.visual_suggestion || slide.headline,
          slide_number: slide.slide_number,
          post_id: id,
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
        variant: "destructive" 
      });
    } finally {
      setGeneratingSlideImage(null);
    }
  };

  // Save post
  const savePost = async (newStatus?: Status) => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Añade un título", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const imageUrls = slides
        .filter(s => s.image_url)
        .map(s => s.image_url as string);

      const { error } = await supabase
        .from("social_posts")
        .update({
          title,
          platform,
          content_type: contentType,
          caption,
          slides: JSON.parse(JSON.stringify(slides)),
          hashtags,
          image_urls: imageUrls,
          status: newStatus || status,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Cambios guardados" });
      if (newStatus) navigate("/admin/social");
    } catch (error) {
      console.error("Error saving post:", error);
      toast({ 
        title: "Error", 
        description: "No se pudo guardar el contenido", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add new slide
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

  // Update slide
  const updateSlide = (index: number, slide: Slide) => {
    const updated = [...slides];
    updated[index] = slide;
    setSlides(updated);
  };

  // Delete slide
  const deleteSlide = (index: number) => {
    const updated = slides.filter((_, i) => i !== index);
    updated.forEach((s, i) => { s.slide_number = i + 1; });
    setSlides(updated);
  };


  if (isLoading) {
    return (
      <AdminLayout title="Editar contenido social" description="">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Editar contenido social"
      description={`Editando: ${title}`}
    >
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/social")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a Social Media
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left column: Editor */}
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título interno</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Instagram - Guía alquiler 2026"
            />
          </div>

          {/* Platform selector */}
          <PlatformSelector value={platform} onChange={setPlatform} />

          {/* Content type selector */}
          <ContentTypeSelector 
            value={contentType} 
            onChange={setContentType} 
            platform={platform}
          />

          {/* Caption editor */}
          <div className="space-y-4">
            <h3 className="font-medium">Caption</h3>
            <CaptionEditor value={caption} onChange={setCaption} platform={platform} />
            <HashtagEditor hashtags={hashtags} onChange={setHashtags} platform={platform} />
          </div>

          {/* Publish actions */}
          <PublishActions
            platform={platform}
            title={title}
            caption={caption}
            hashtags={hashtags}
            slides={slides}
          />

          {/* Slides editor */}
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

          {/* Single post/reel image */}
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

          {/* Save buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => savePost()}
              disabled={isSaving}
              className="rounded-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </Button>
            {status === "draft" && (
              <Button
                onClick={() => savePost("ready")}
                disabled={isSaving}
                className="rounded-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Marcar como listo"
                )}
              </Button>
            )}
            {status === "ready" && (
              <Button
                onClick={() => savePost("published")}
                disabled={isSaving}
                className="rounded-full bg-green-600 hover:bg-green-700"
              >
                Marcar como publicado
              </Button>
            )}
          </div>
        </div>

        {/* Right column: Preview - hidden on mobile */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <h3 className="font-medium text-center">Vista previa</h3>
            <SocialPreviewMockup
              platform={platform}
              slides={slides}
              caption={caption}
              hashtags={hashtags}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSocialEdit;

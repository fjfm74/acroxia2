import { useState } from "react";
import { Download, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Slide } from "./SlideEditor";

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";

interface PublishActionsProps {
  platform: Platform;
  title: string;
  caption: string;
  hashtags: string[];
  slides: Slide[];
}

const platformLinks: Record<Platform, { app: string; web: string; label: string; icon: string }> = {
  instagram: {
    app: "instagram://app",
    web: "https://instagram.com",
    label: "Abrir Instagram",
    icon: "📷",
  },
  tiktok: {
    app: "snssdk1128://",
    web: "https://tiktok.com",
    label: "Abrir TikTok",
    icon: "🎵",
  },
  facebook: {
    app: "fb://",
    web: "https://facebook.com",
    label: "Abrir Facebook",
    icon: "👍",
  },
  linkedin: {
    app: "linkedin://",
    web: "https://linkedin.com/feed",
    label: "Abrir LinkedIn",
    icon: "💼",
  },
  twitter: {
    app: "twitter://post",
    web: "https://twitter.com/compose/tweet",
    label: "Abrir X",
    icon: "𝕏",
  },
};

const PublishActions = ({ platform, title, caption, hashtags, slides }: PublishActionsProps) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const imagesWithUrl = slides.filter(s => s.image_url);
  const hasImages = imagesWithUrl.length > 0;
  const hasContent = caption.length > 0 || hashtags.length > 0;

  // Download all images as ZIP
  const downloadAllImages = async () => {
    if (!hasImages) {
      toast({ 
        title: "Sin imágenes", 
        description: "Genera imágenes primero para poder descargarlas", 
        variant: "destructive" 
      });
      return;
    }

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      // Download each image and add to ZIP
      await Promise.all(
        imagesWithUrl.map(async (slide, index) => {
          try {
            const response = await fetch(slide.image_url!);
            const blob = await response.blob();
            const extension = blob.type.includes("png") ? "png" : "jpg";
            zip.file(`slide-${slide.slide_number || index + 1}.${extension}`, blob);
          } catch (error) {
            console.error(`Error downloading slide ${index + 1}:`, error);
          }
        })
      );

      const content = await zip.generateAsync({ type: "blob" });
      const safeName = (title || "carrusel").replace(/[^a-z0-9]/gi, "-").toLowerCase();
      saveAs(content, `${safeName}-imagenes.zip`);

      toast({ 
        title: "Descarga completada", 
        description: `${imagesWithUrl.length} imagen${imagesWithUrl.length > 1 ? "es" : ""} descargada${imagesWithUrl.length > 1 ? "s" : ""}` 
      });
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast({ 
        title: "Error", 
        description: "No se pudieron descargar las imágenes", 
        variant: "destructive" 
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy caption + hashtags to clipboard
  const copyAll = async () => {
    const formattedHashtags = hashtags.length > 0 
      ? hashtags.map(h => `#${h}`).join(" ") 
      : "";
    
    const fullCaption = caption + (formattedHashtags ? "\n\n" + formattedHashtags : "");
    
    try {
      await navigator.clipboard.writeText(fullCaption);
      setCopied(true);
      toast({ 
        title: "Copiado al portapapeles",
        description: `${caption.length} caracteres${hashtags.length > 0 ? ` + ${hashtags.length} hashtags` : ""}`
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "No se pudo copiar al portapapeles", 
        variant: "destructive" 
      });
    }
  };

  // Open social app with fallback to web
  const openSocialApp = () => {
    const links = platformLinks[platform];
    
    // Try to open native app
    const appWindow = window.open(links.app, "_blank");
    
    // Fallback to web after timeout
    setTimeout(() => {
      if (!appWindow || appWindow.closed) {
        window.open(links.web, "_blank");
      }
    }, 500);

    toast({ 
      title: `Abriendo ${platform}`,
      description: "Pega el caption copiado en tu nuevo post"
    });
  };

  if (!hasContent && !hasImages) {
    return null;
  }

  return (
    <div className="bg-muted/50 rounded-xl p-6 space-y-4">
      <h3 className="font-medium">Acciones de publicación</h3>
      
      <div className="flex flex-wrap gap-3">
        {/* Copy all button */}
        <Button
          variant={copied ? "default" : "outline"}
          onClick={copyAll}
          disabled={!hasContent}
          className={cn(
            "rounded-full transition-colors",
            copied && "bg-green-600 hover:bg-green-600 text-white"
          )}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              ¡Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copiar todo
            </>
          )}
        </Button>

        {/* Download ZIP button */}
        <Button
          variant="outline"
          onClick={downloadAllImages}
          disabled={isDownloading || !hasImages}
          className="rounded-full"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Descargar ZIP ({imagesWithUrl.length})
            </>
          )}
        </Button>

        {/* Open social app button */}
        <Button
          variant="outline"
          onClick={openSocialApp}
          className="rounded-full"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {platformLinks[platform].label}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Tip: Copia el caption, descarga las imágenes y pégalas directamente en {platform}.
      </p>
    </div>
  );
};

export default PublishActions;

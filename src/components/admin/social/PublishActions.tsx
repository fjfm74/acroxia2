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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const words = normalized.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const tentative = current ? `${current} ${word}` : word;
    if (tentative.length <= maxCharsPerLine) {
      current = tentative;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?-]?\s*$/, "")}...`;
  }

  return lines;
}

function getAccent(slide?: Slide): string {
  if (slide?.type === "cta") return "#2A7A63";
  if (slide?.type === "cover") return "#1D4ED8";
  return "#1F2937";
}

function buildSlideSvg(slide?: Slide, embeddedImage?: string): string {
  const safeImage = embeddedImage ? escapeXml(embeddedImage) : "";
  const headlineLines = wrapText(slide?.headline || "Slide sin contenido", 22, 3);
  const bodyLines = wrapText(slide?.body || "", 34, 4);

  const isCover = slide?.type === "cover";
  const isCta = slide?.type === "cta";

  const headlineFontSize = isCta ? 74 : 70;
  const bodyFontSize = 30;

  const headlineStartY = 380;
  const bodyStartY = headlineStartY + headlineLines.length * (headlineFontSize + 8) + 36;

  const headlineTspans = headlineLines
    .map((line, index) => `<tspan x="540" dy="${index === 0 ? 0 : headlineFontSize + 8}">${escapeXml(line)}</tspan>`)
    .join("");

  const bodyTspans = bodyLines
    .map((line, index) => `<tspan x="540" dy="${index === 0 ? 0 : bodyFontSize + 14}">${escapeXml(line)}</tspan>`)
    .join("");

  if (isCover && safeImage) {
    return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
      <rect width="1080" height="1080" fill="#F5F1EB" />
      <image href="${safeImage}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMidYMid slice" />
    </svg>`;
  }

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <rect width="1080" height="1080" fill="#F3EFEB" />

    <text
      x="540"
      y="${headlineStartY}"
      text-anchor="middle"
      font-family="Georgia, serif"
      font-size="${headlineFontSize}"
      font-weight="700"
      fill="#1A1A1A"
    >
      ${headlineTspans}
    </text>

    ${
      bodyLines.length > 0
        ? `<text
            x="540"
            y="${bodyStartY}"
            text-anchor="middle"
            font-family="Helvetica, Arial, sans-serif"
            font-size="${bodyFontSize}"
            font-weight="400"
            fill="#7A716B"
          >
            ${bodyTspans}
          </text>`
        : ""
    }
  </svg>`;
}

async function blobToDataUri(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se ha podido leer la imagen"));
    reader.readAsDataURL(blob);
  });
}

async function renderSlideToBlob(slide?: Slide): Promise<Blob> {
  let embeddedImage = "";

  if (slide?.image_url) {
    try {
      const response = await fetch(slide.image_url);
      const blob = await response.blob();
      embeddedImage = await blobToDataUri(blob);
    } catch (error) {
      console.error("Error embedding slide background:", error);
    }
  }

  const svg = buildSlideSvg(slide, embeddedImage);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("No se ha podido renderizar la diapositiva"));
      image.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("No se ha podido crear el canvas de exportacion");
    }

    context.drawImage(image, 0, 0, 1080, 1080);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("No se ha podido exportar la diapositiva"));
          return;
        }
        resolve(blob);
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

const PublishActions = ({ platform, title, caption, hashtags, slides }: PublishActionsProps) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasSlides = slides.length > 0;
  const hasContent = caption.length > 0 || hashtags.length > 0;
  const normalizedHashtags = hashtags.map((h) => h.replace(/^#+/, "")).filter(Boolean);

  const downloadAllImages = async () => {
    if (!hasSlides) {
      toast({
        title: "Sin slides",
        description: "Genera contenido primero para poder descargarlo",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const zip = new JSZip();

      await Promise.all(
        slides.map(async (slide, index) => {
          try {
            const blob = await renderSlideToBlob(slide);
            zip.file(`slide-${slide.slide_number || index + 1}.png`, blob);
          } catch (error) {
            console.error(`Error downloading slide ${index + 1}:`, error);
          }
        }),
      );

      const content = await zip.generateAsync({ type: "blob" });
      const safeName = (title || "carrusel").replace(/[^a-z0-9]/gi, "-").toLowerCase();
      saveAs(content, `${safeName}-imagenes.zip`);

      toast({
        title: "Descarga completada",
        description: `${slides.length} slide${slides.length > 1 ? "s" : ""} descargado${slides.length > 1 ? "s" : ""}`,
      });
    } catch (error) {
      console.error("Error creating ZIP:", error);
      toast({
        title: "Error",
        description: "No se pudieron descargar las diapositivas",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const copyAll = async () => {
    const formattedHashtags = normalizedHashtags.length > 0 ? normalizedHashtags.map((h) => `#${h}`).join(" ") : "";

    const fullCaption = caption + (formattedHashtags ? "\n\n" + formattedHashtags : "");

    try {
      await navigator.clipboard.writeText(fullCaption);
      setCopied(true);
      toast({
        title: "Copiado al portapapeles",
        description: `${caption.length} caracteres${normalizedHashtags.length > 0 ? ` + ${normalizedHashtags.length} hashtags` : ""}`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const openSocialApp = () => {
    const links = platformLinks[platform];

    const appWindow = window.open(links.app, "_blank");

    setTimeout(() => {
      if (!appWindow || appWindow.closed) {
        window.open(links.web, "_blank");
      }
    }, 500);

    toast({
      title: `Abriendo ${platform}`,
      description: "Pega el caption copiado en tu nuevo post",
    });
  };

  if (!hasContent && !hasSlides) {
    return null;
  }

  return (
    <div className="bg-muted/50 rounded-xl p-6 space-y-4">
      <h3 className="font-medium">Acciones de publicación</h3>

      <div className="flex flex-wrap gap-3">
        <Button
          variant={copied ? "default" : "outline"}
          onClick={copyAll}
          disabled={!hasContent}
          className={cn("rounded-full transition-colors", copied && "bg-green-600 hover:bg-green-600 text-white")}
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

        <Button
          variant="outline"
          onClick={downloadAllImages}
          disabled={isDownloading || !hasSlides}
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
              Descargar ZIP ({slides.length})
            </>
          )}
        </Button>

        <Button variant="outline" onClick={openSocialApp} className="rounded-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          {platformLinks[platform].label}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Tip: Copia el caption y descarga las diapositivas finales tal y como se ven en la vista previa.
      </p>
    </div>
  );
};

export default PublishActions;

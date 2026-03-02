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
  const safeBody = escapeXml(slide?.body?.trim() || "");
  const safeImage = embeddedImage ? escapeXml(embeddedImage) : "";
  const accent = getAccent(slide);
  const eyebrow = slide?.type === "cover" ? "ACROXIA" : slide?.type === "cta" ? "SIGUIENTE PASO" : "CLAVE";

  const headlineLines = wrapText(slide?.headline || "Slide sin contenido", 18, 4);
  const bodyLines = wrapText(slide?.body || "", 30, 4);

  const headlineFontSize = headlineLines.length >= 4 ? 68 : headlineLines.length === 3 ? 76 : 84;
  const bodyFontSize = 34;
  const headlineStartY = safeImage ? 690 : 360;
  const bodyStartY = headlineStartY + headlineLines.length * (headlineFontSize + 10) + 28;

  const headlineTspans = headlineLines
    .map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : headlineFontSize + 10}">${escapeXml(line)}</tspan>`)
    .join("");

  const bodyTspans = bodyLines
    .map((line, index) => `<tspan x="96" dy="${index === 0 ? 0 : bodyFontSize + 10}">${escapeXml(line)}</tspan>`)
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F8F4EE" />
        <stop offset="100%" stop-color="#E9E1D6" />
      </linearGradient>
      <linearGradient id="imageOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(15,23,42,0.08)" />
        <stop offset="55%" stop-color="rgba(15,23,42,0.18)" />
        <stop offset="100%" stop-color="rgba(15,23,42,0.72)" />
      </linearGradient>
      <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.96)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.90)" />
      </linearGradient>
    </defs>

    <rect width="1080" height="1080" fill="url(#bgGradient)" />

    ${safeImage ? `<image href="${safeImage}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMidYMid slice" />` : ""}
    ${safeImage ? `<rect width="1080" height="1080" fill="url(#imageOverlay)" />` : ""}

    ${!safeImage ? `<circle cx="900" cy="180" r="220" fill="rgba(29,78,216,0.08)" />` : ""}
    ${!safeImage ? `<circle cx="220" cy="920" r="300" fill="rgba(42,122,99,0.08)" />` : ""}

    <rect x="64" y="64" rx="28" ry="28" width="260" height="56" fill="rgba(255,255,255,0.82)" />
    <text x="96" y="100" font-family="Georgia, serif" font-size="24" font-weight="700" fill="${accent}" letter-spacing="2">${eyebrow}</text>

    <rect x="64" y="${safeImage ? 620 : 290}" rx="42" ry="42" width="952" height="${safeImage ? 352 : 420}" fill="url(#panelGradient)" />

    <text x="96" y="${headlineStartY}" font-family="Georgia, serif" font-size="${headlineFontSize}" font-weight="700" fill="#111827">
      ${headlineTspans}
    </text>

    ${safeBody ? `<text x="96" y="${bodyStartY}" font-family="Helvetica, Arial, sans-serif" font-size="34" font-weight="500" fill="#374151">${bodyTspans}</text>` : ""}

    <rect x="64" y="1000" rx="18" ry="18" width="190" height="10" fill="${accent}" opacity="0.9" />
    <text x="840" y="1014" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="rgba(17,24,39,0.72)">acroxia.es</text>
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

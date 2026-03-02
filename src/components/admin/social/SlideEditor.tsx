import { Trash2, Sparkles, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface Slide {
  slide_number: number;
  type: "cover" | "content" | "cta";
  headline: string;
  body?: string;
  visual_suggestion: string;
  image_url?: string;
}

interface SlideEditorProps {
  slide: Slide;
  onChange: (slide: Slide) => void;
  onDelete: () => void;
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
  canDelete: boolean;
}

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

function buildSlideSvg(slide?: Slide): string {
  const safeBody = escapeXml(slide?.body?.trim() || "");
  const safeImage = slide?.image_url ? escapeXml(slide.image_url) : "";
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

    ${safeBody ? `<text x="96" y="${bodyStartY}" font-family="Helvetica, Arial, sans-serif" font-size="${bodyFontSize}" font-weight="500" fill="#374151">${bodyTspans}</text>` : ""}

    <rect x="64" y="1000" rx="18" ry="18" width="190" height="10" fill="${accent}" opacity="0.9" />
    <text x="840" y="1014" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="rgba(17,24,39,0.72)">acroxia.es</text>
  </svg>`;
}

function getSlideDataUri(slide?: Slide): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildSlideSvg(slide))}`;
}

const SlideEditor = ({
  slide,
  onChange,
  onDelete,
  onGenerateImage,
  isGeneratingImage,
  canDelete,
}: SlideEditorProps) => {
  const typeLabels = {
    cover: "Portada",
    content: "Contenido",
    cta: "CTA",
  };

  return (
    <div className="bg-background rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <span className="text-sm font-medium">Slide {slide.slide_number}</span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              slide.type === "cover" && "bg-purple-100 text-purple-700",
              slide.type === "content" && "bg-blue-100 text-blue-700",
              slide.type === "cta" && "bg-green-100 text-green-700",
            )}
          >
            {typeLabels[slide.type]}
          </span>
        </div>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border">
            <img
              src={getSlideDataUri(slide)}
              alt={`Slide ${slide.slide_number}`}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onGenerateImage}
            disabled={isGeneratingImage}
            className="w-full"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {slide.image_url ? "Regenerar fondo" : "Generar fondo"}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">La descarga exporta esta diapositiva tal y como se ve aqui.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Titular</label>
            <Input
              value={slide.headline}
              onChange={(e) => onChange({ ...slide, headline: e.target.value })}
              placeholder="Titular del slide..."
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{slide.headline.length}/50 caracteres</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Cuerpo (opcional)</label>
            <Textarea
              value={slide.body || ""}
              onChange={(e) => onChange({ ...slide, body: e.target.value })}
              placeholder="Texto de apoyo..."
              rows={3}
              className="mt-1 resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">{(slide.body || "").length}/100 caracteres</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Brief visual del fondo</label>
            <Textarea
              value={slide.visual_suggestion}
              onChange={(e) => onChange({ ...slide, visual_suggestion: e.target.value })}
              placeholder="Describe la escena o el estilo del fondo..."
              rows={2}
              className="mt-1 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditor;

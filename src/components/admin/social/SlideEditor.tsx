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
  const safeImage = slide?.image_url ? escapeXml(slide.image_url) : "";
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

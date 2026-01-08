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

const SlideEditor = ({ 
  slide, 
  onChange, 
  onDelete, 
  onGenerateImage,
  isGeneratingImage,
  canDelete 
}: SlideEditorProps) => {
  const typeLabels = {
    cover: "Portada",
    content: "Contenido",
    cta: "CTA"
  };

  return (
    <div className="bg-background rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          <span className="text-sm font-medium">
            Slide {slide.slide_number}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            slide.type === "cover" && "bg-purple-100 text-purple-700",
            slide.type === "content" && "bg-blue-100 text-blue-700",
            slide.type === "cta" && "bg-green-100 text-green-700"
          )}>
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
        {/* Left: Image preview */}
        <div className="space-y-2">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border">
            {slide.image_url ? (
              <img 
                src={slide.image_url} 
                alt={`Slide ${slide.slide_number}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {slide.visual_suggestion || "Sin imagen"}
                </p>
              </div>
            )}
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
                {slide.image_url ? "Regenerar imagen" : "Generar imagen"}
              </>
            )}
          </Button>
        </div>

        {/* Right: Text content */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Titular</label>
            <Input
              value={slide.headline}
              onChange={(e) => onChange({ ...slide, headline: e.target.value })}
              placeholder="Titular del slide..."
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {slide.headline.length}/50 caracteres
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              {(slide.body || "").length}/100 caracteres
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Sugerencia visual</label>
            <Textarea
              value={slide.visual_suggestion}
              onChange={(e) => onChange({ ...slide, visual_suggestion: e.target.value })}
              placeholder="Descripción de la imagen..."
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

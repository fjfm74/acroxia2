import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";

interface CaptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  platform: Platform;
}

const platformLimits: Record<Platform, number> = {
  instagram: 2200,
  tiktok: 4000,
  facebook: 63206,
  linkedin: 3000,
  twitter: 280,
};

const CaptionEditor = ({ value, onChange, platform }: CaptionEditorProps) => {
  const limit = platformLimits[platform];
  const percentage = (value.length / limit) * 100;
  const isNearLimit = percentage > 80;
  const isOverLimit = value.length > limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Caption</label>
        <span className={cn(
          "text-xs",
          isOverLimit ? "text-destructive font-medium" : 
          isNearLimit ? "text-amber-600" : "text-muted-foreground"
        )}>
          {value.length.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe el caption de tu post..."
        rows={8}
        className={cn(
          "resize-none font-sans",
          isOverLimit && "border-destructive focus-visible:ring-destructive"
        )}
      />

      {/* Character limit bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all",
            isOverLimit ? "bg-destructive" : 
            isNearLimit ? "bg-amber-500" : "bg-foreground"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {isOverLimit && (
        <p className="text-xs text-destructive">
          Excedes el límite de caracteres para {platform}
        </p>
      )}
    </div>
  );
};

export default CaptionEditor;

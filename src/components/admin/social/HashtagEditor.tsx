import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";

interface HashtagEditorProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  platform: Platform;
}

const platformRecommendations: Record<Platform, { max: number; recommended: string }> = {
  instagram: { max: 30, recommended: "15-20" },
  tiktok: { max: 100, recommended: "5-10" },
  facebook: { max: 30, recommended: "10-15" },
  linkedin: { max: 10, recommended: "3-5" },
  twitter: { max: 10, recommended: "2-3" },
};

const HashtagEditor = ({ hashtags, onChange, platform }: HashtagEditorProps) => {
  const [inputValue, setInputValue] = useState("");
  const { max, recommended } = platformRecommendations[platform];
  const isAtLimit = hashtags.length >= max;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHashtag();
    }
  };

  const addHashtag = () => {
    const tag = inputValue.trim().replace(/^#/, "").toLowerCase();
    if (tag && !hashtags.includes(tag) && hashtags.length < max) {
      onChange([...hashtags, tag]);
      setInputValue("");
    }
  };

  const removeHashtag = (tag: string) => {
    onChange(hashtags.filter((h) => h !== tag));
  };

  const copyAllHashtags = () => {
    const text = hashtags.map((h) => `#${h}`).join(" ");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Hashtags</label>
        <span className={cn(
          "text-xs",
          isAtLimit ? "text-destructive" : "text-muted-foreground"
        )}>
          {hashtags.length}/{max} (recomendado: {recommended})
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addHashtag}
          placeholder="Escribe un hashtag y pulsa Enter..."
          disabled={isAtLimit}
          className="flex-1"
        />
        {hashtags.length > 0 && (
          <button
            type="button"
            onClick={copyAllHashtags}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            Copiar todos
          </button>
        )}
      </div>

      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeHashtag(tag)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default HashtagEditor;

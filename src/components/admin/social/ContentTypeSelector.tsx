import { Image, Layers, Circle, Video, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type ContentType = "post" | "carousel" | "story" | "reel_script" | "thread";
type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";

interface ContentTypeSelectorProps {
  value: ContentType;
  onChange: (type: ContentType) => void;
  platform: Platform;
}

const contentTypes: { 
  id: ContentType; 
  name: string; 
  description: string;
  icon: React.ReactNode;
  platforms: Platform[];
}[] = [
  { 
    id: "post", 
    name: "Post único", 
    description: "Imagen con caption",
    icon: <Image className="h-5 w-5" />,
    platforms: ["instagram", "facebook", "linkedin", "twitter"]
  },
  { 
    id: "carousel", 
    name: "Carrusel", 
    description: "5-10 slides deslizables",
    icon: <Layers className="h-5 w-5" />,
    platforms: ["instagram", "facebook", "linkedin"]
  },
  { 
    id: "story", 
    name: "Stories", 
    description: "Contenido efímero 24h",
    icon: <Circle className="h-5 w-5" />,
    platforms: ["instagram", "facebook"]
  },
  { 
    id: "reel_script", 
    name: "Script Reel/Video", 
    description: "Guión para video corto",
    icon: <Video className="h-5 w-5" />,
    platforms: ["instagram", "tiktok", "facebook"]
  },
  { 
    id: "thread", 
    name: "Hilo", 
    description: "Serie de posts conectados",
    icon: <MessageSquare className="h-5 w-5" />,
    platforms: ["twitter", "linkedin"]
  },
];

const ContentTypeSelector = ({ value, onChange, platform }: ContentTypeSelectorProps) => {
  const availableTypes = contentTypes.filter(type => type.platforms.includes(platform));

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Tipo de contenido</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left",
              value === type.id
                ? "border-foreground bg-muted"
                : "border-border hover:border-muted-foreground"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              value === type.id ? "bg-foreground text-background" : "bg-muted"
            )}>
              {type.icon}
            </div>
            <div>
              <p className="font-medium text-sm">{type.name}</p>
              <p className="text-xs text-muted-foreground">{type.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContentTypeSelector;

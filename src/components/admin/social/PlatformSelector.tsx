import { Instagram, Facebook, Linkedin, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";

interface PlatformSelectorProps {
  value: Platform;
  onChange: (platform: Platform) => void;
}

const platforms: { id: Platform; name: string; icon: React.ReactNode; color: string }[] = [
  { 
    id: "instagram", 
    name: "Instagram", 
    icon: <Instagram className="h-5 w-5" />,
    color: "hover:border-pink-500 data-[selected=true]:border-pink-500 data-[selected=true]:bg-pink-50"
  },
  { 
    id: "tiktok", 
    name: "TikTok", 
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    color: "hover:border-foreground data-[selected=true]:border-foreground data-[selected=true]:bg-muted"
  },
  { 
    id: "facebook", 
    name: "Facebook", 
    icon: <Facebook className="h-5 w-5" />,
    color: "hover:border-blue-600 data-[selected=true]:border-blue-600 data-[selected=true]:bg-blue-50"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    icon: <Linkedin className="h-5 w-5" />,
    color: "hover:border-blue-700 data-[selected=true]:border-blue-700 data-[selected=true]:bg-blue-50"
  },
  { 
    id: "twitter", 
    name: "X / Twitter", 
    icon: <Twitter className="h-5 w-5" />,
    color: "hover:border-foreground data-[selected=true]:border-foreground data-[selected=true]:bg-muted"
  },
];

const PlatformSelector = ({ value, onChange }: PlatformSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Plataforma</label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            type="button"
            data-selected={value === platform.id}
            onClick={() => onChange(platform.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border transition-all",
              platform.color
            )}
          >
            {platform.icon}
            <span className="text-xs font-medium">{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlatformSelector;

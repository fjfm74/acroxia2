import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Slide } from "./SlideEditor";

type Platform = "instagram" | "tiktok" | "facebook" | "linkedin" | "twitter";

interface SocialPreviewMockupProps {
  platform: Platform;
  slides: Slide[];
  caption: string;
  hashtags: string[];
}

const SocialPreviewMockup = ({ platform, slides, caption, hashtags }: SocialPreviewMockupProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (platform !== "instagram") {
    return (
      <div className="bg-muted rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Vista previa disponible solo para Instagram
        </p>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const formattedCaption = caption + (hashtags.length > 0 ? "\n\n" + hashtags.map(h => `#${h}`).join(" ") : "");

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden max-w-[380px] mx-auto shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
              <span className="text-xs font-bold">A</span>
            </div>
          </div>
          <span className="text-sm font-semibold">acroxia_es</span>
        </div>
        <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Image/Carousel */}
      <div className="relative aspect-square bg-muted">
        {slide?.image_url ? (
          <img 
            src={slide.image_url} 
            alt={slide.headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="font-serif text-xl font-semibold mb-2">{slide?.headline || "Titular"}</p>
            {slide?.body && (
              <p className="text-sm text-muted-foreground">{slide.body}</p>
            )}
          </div>
        )}

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentSlide 
                    ? "bg-blue-500 w-2" 
                    : "bg-white/60"
                )}
              />
            ))}
          </div>
        )}

        {/* Navigation arrows */}
        {slides.length > 1 && (
          <>
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide(currentSlide - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-md"
              >
                <span className="text-xs">‹</span>
              </button>
            )}
            {currentSlide < slides.length - 1 && (
              <button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow-md"
              >
                <span className="text-xs">›</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6" />
        </div>

        {/* Likes */}
        <p className="text-sm font-semibold mb-1">1,234 Me gusta</p>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold">acroxia_es </span>
          <span className="whitespace-pre-wrap">
            {formattedCaption.length > 150 
              ? formattedCaption.slice(0, 150) + "... más"
              : formattedCaption
            }
          </span>
        </div>

        {/* Time */}
        <p className="text-xs text-muted-foreground mt-2">Hace 2 horas</p>
      </div>
    </div>
  );
};

export default SocialPreviewMockup;

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
  const safeImage = embeddedImage ? escapeXml(embeddedImage) : slide?.image_url ? escapeXml(slide.image_url) : "";
  const accent = getAccent(slide);

  const headlineLines = wrapText(slide?.headline || "Slide sin contenido", 18, 4);
  const bodyLines = wrapText(slide?.body || "", 30, 4);

  const headlineFontSize = headlineLines.length >= 4 ? 68 : headlineLines.length === 3 ? 76 : 84;
  const bodyFontSize = 34;
  const headlineStartY = safeImage ? 720 : 360;
  const bodyStartY = headlineStartY + headlineLines.length * (headlineFontSize + 10) + 28;

  const headlineTspans = headlineLines
    .map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : headlineFontSize + 10}">${escapeXml(line)}</tspan>`)
    .join("");

  const bodyTspans = bodyLines
    .map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : bodyFontSize + 10}">${escapeXml(line)}</tspan>`)
    .join("");

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F8F4EE" />
        <stop offset="100%" stop-color="#E9E1D6" />
      </linearGradient>
      <linearGradient id="imageOverlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(255,255,255,0.02)" />
        <stop offset="58%" stop-color="rgba(255,255,255,0.08)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.24)" />
      </linearGradient>
    </defs>

    <rect width="1080" height="1080" fill="url(#bgGradient)" />

    ${safeImage ? `<image href="${safeImage}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMidYMid slice" />` : ""}
    ${safeImage ? `<rect width="1080" height="1080" fill="url(#imageOverlay)" />` : ""}

    <text x="72" y="${headlineStartY}" font-family="Georgia, serif" font-size="${headlineFontSize}" font-weight="700" fill="#0F172A">
      ${headlineTspans}
    </text>

    ${safeBody ? `<text x="72" y="${bodyStartY}" font-family="Helvetica, Arial, sans-serif" font-size="${bodyFontSize}" font-weight="500" fill="#334155">${bodyTspans}</text>` : ""}

    <rect x="72" y="998" rx="18" ry="18" width="160" height="8" fill="${accent}" opacity="0.9" />
    <text x="850" y="1012" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="700" fill="#334155">acroxia.es</text>
  </svg>`;
}

function getSlideDataUri(slide?: Slide): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildSlideSvg(slide))}`;
}

const SocialPreviewMockup = ({ platform, slides, caption, hashtags }: SocialPreviewMockupProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const normalizedHashtags = hashtags.map((h) => h.replace(/^#+/, "")).filter(Boolean);

  if (platform !== "instagram") {
    return (
      <div className="bg-muted rounded-xl p-8 text-center">
        <p className="text-sm text-muted-foreground">Vista previa disponible solo para Instagram</p>
      </div>
    );
  }

  const slide = slides[currentSlide];
  const formattedCaption =
    caption + (normalizedHashtags.length > 0 ? "\n\n" + normalizedHashtags.map((h) => `#${h}`).join(" ") : "");

  return (
    <div className="bg-background border border-border rounded-2xl overflow-hidden max-w-[380px] mx-auto shadow-lg">
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

      <div className="relative aspect-square bg-muted">
        <img
          src={getSlideDataUri(slide)}
          alt={slide?.headline || "Slide social"}
          className="w-full h-full object-cover"
        />

        {slides.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  index === currentSlide ? "bg-blue-500 w-2" : "bg-white/60",
                )}
              />
            ))}
          </div>
        )}

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

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6" />
        </div>

        <p className="text-sm font-semibold mb-1">1,234 Me gusta</p>

        <div className="text-sm">
          <span className="font-semibold">acroxia_es </span>
          <span className="whitespace-pre-wrap">
            {formattedCaption.length > 150 ? `${formattedCaption.slice(0, 150)}... más` : formattedCaption}
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-2">Hace 2 horas</p>
      </div>
    </div>
  );
};

export default SocialPreviewMockup;

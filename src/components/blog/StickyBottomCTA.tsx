import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, FileSearch } from "lucide-react";

const STORAGE_KEY = "acroxia_sticky_cta_closed";

const StickyBottomCTA = () => {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(() => !!sessionStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (closed) return;

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setVisible(scrollPercent > 0.4);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [closed]);

  const handleClose = () => {
    setClosed(true);
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  if (closed || !visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-foreground text-background">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <FileSearch className="h-5 w-5 flex-shrink-0 opacity-70" />
            <p className="text-sm font-medium truncate">
              ¿Tiene tu contrato cláusulas como estas? Analízalo gratis
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              asChild
              size="sm"
              className="bg-background text-foreground hover:bg-background/90 rounded-full text-xs px-4"
            >
              <Link to="/analizar-gratis">Analizar ahora</Link>
            </Button>
            <button
              onClick={handleClose}
              className="p-1 hover:opacity-70 transition-opacity"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyBottomCTA;

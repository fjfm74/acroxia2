import { Link } from "react-router-dom";
import { ArrowRight, Search, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogContextualCTAProps {
  audience?: string;
  variant?: "inline" | "prominent";
}

const BlogContextualCTA = ({ audience = "inquilino", variant = "inline" }: BlogContextualCTAProps) => {
  const isLandlord = audience === "propietario";

  if (isLandlord) {
    return (
      <aside className={`rounded-2xl border-l-4 border-foreground ${variant === "prominent" ? "bg-foreground text-background p-8" : "bg-muted/60 p-6 border border-border"}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center flex-shrink-0">
            <FileCheck className={`w-5 h-5 ${variant === "prominent" ? "text-background" : "text-foreground"}`} />
          </div>
          <div className="flex-grow">
            <p className={`font-semibold mb-1 ${variant === "prominent" ? "text-background" : "text-foreground"}`}>
              ¿Tu contrato cumple la LAU 2026?
            </p>
            <p className={`text-sm ${variant === "prominent" ? "text-background/70" : "text-muted-foreground"}`}>
              Verifica que tus contratos cumplen la normativa vigente y protege tu inversión.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className={`rounded-full px-5 flex-shrink-0 ${variant === "prominent" ? "bg-background text-foreground hover:bg-background/90" : ""}`}
          >
            <Link to="/propietarios">
              Ver herramientas
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`rounded-2xl border-l-4 border-foreground ${variant === "prominent" ? "bg-foreground text-background p-8" : "bg-muted/60 p-6 border border-border"}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center flex-shrink-0">
          <Search className={`w-5 h-5 ${variant === "prominent" ? "text-background" : "text-foreground"}`} />
        </div>
        <div className="flex-grow">
          <p className={`font-semibold mb-1 ${variant === "prominent" ? "text-background" : "text-foreground"}`}>
            ¿Tu contrato tiene cláusulas como estas?
          </p>
          <p className={`text-sm ${variant === "prominent" ? "text-background/70" : "text-muted-foreground"}`}>
            Analízalo gratis con IA en menos de 2 minutos y descubre posibles problemas.
          </p>
        </div>
        <Button
          asChild
          size="sm"
          className={`rounded-full px-5 flex-shrink-0 ${variant === "prominent" ? "bg-background text-foreground hover:bg-background/90" : ""}`}
        >
          <Link to="/analizar-gratis">
            Analizar gratis
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    </aside>
  );
};

export default BlogContextualCTA;

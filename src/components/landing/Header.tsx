import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary tracking-tight">ACROXIA</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Cómo funciona
          </a>
          <a href="#precios" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            Precios
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
            FAQ
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex">
            Iniciar sesión
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            Analizar contrato
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-2xl font-serif font-semibold text-foreground tracking-tight">
          ACROXIA
        </span>
        
        <nav className="hidden md:flex items-center gap-10">
          <a href="/#como-funciona" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Cómo funciona
          </a>
          <a href="/precios" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Precios
          </a>
          <a href="/#faq" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            FAQ
          </a>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:inline-flex text-foreground/70 hover:text-foreground hover:bg-transparent text-sm font-medium">
            Iniciar sesión
          </Button>
          <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 text-sm font-medium">
            Analizar contrato
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;

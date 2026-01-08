import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { User, LogOut, FileText, LayoutDashboard, Menu } from "lucide-react";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-sm border-b border-charcoal/5">
      <div className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-serif font-semibold text-foreground tracking-tight">
          ACROXIA
        </Link>
        
        <nav className="hidden md:flex items-center gap-10">
          <a href="/#como-funciona" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Cómo funciona
          </a>
          <Link to="/precios" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Precios
          </Link>
          <Link to="/faq" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            FAQ
          </Link>
          <Link to="/blog" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Blog
          </Link>
        </nav>
        
        {/* Menú móvil */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-cream border-l border-border px-6">
            <nav className="flex flex-col gap-6 mt-8">
              <a 
                href="/#como-funciona" 
                onClick={closeMobileMenu}
                className="text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
              >
                Cómo funciona
              </a>
              <Link 
                to="/precios" 
                onClick={closeMobileMenu}
                className="text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
              >
                Precios
              </Link>
              <Link 
                to="/faq" 
                onClick={closeMobileMenu}
                className="text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
              >
                FAQ
              </Link>
              <Link 
                to="/blog" 
                onClick={closeMobileMenu}
                className="text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
              >
                Blog
              </Link>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-charcoal/10 flex flex-col gap-4">
              {user ? (
                <>
                  <div className="px-1 py-2">
                    <p className="text-sm font-medium text-foreground">{profile?.full_name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" />
                      {profile?.credits || 0} créditos
                    </p>
                  </div>
                  <Link 
                    to="/dashboard" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Mi panel
                  </Link>
                  <Link 
                    to="/analizar" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    Analizar contrato
                  </Link>
                  <button 
                    onClick={() => { handleSignOut(); closeMobileMenu(); }}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-base font-medium mt-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    onClick={closeMobileMenu}
                    className="text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
                  >
                    Iniciar sesión
                  </Link>
                  <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-full text-sm font-medium">
                    <Link to="/registro" onClick={closeMobileMenu}>Registrarse</Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Botones desktop */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-foreground/70 hover:text-foreground hover:bg-transparent text-sm font-medium">
                    <User className="mr-2 h-4 w-4" />
                    {profile?.full_name || "Mi cuenta"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.full_name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" />
                      {profile?.credits || 0} créditos
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Mi panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 text-sm font-medium">
                <Link to="/analizar">Analizar contrato</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="text-foreground/70 hover:text-foreground hover:bg-transparent text-sm font-medium">
                <Link to="/login">Iniciar sesión</Link>
              </Button>
              <Button asChild className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 text-sm font-medium">
                <Link to="/registro">Analizar contrato</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

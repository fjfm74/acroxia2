import { useState, useEffect } from "react";
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
import { 
  User, 
  LogOut, 
  FileText, 
  LayoutDashboard, 
  Menu,
  Building2,
  Briefcase,
  AlertTriangle,
  Wallet,
  TrendingUp,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-cream/95 backdrop-blur-sm border-b border-charcoal/5 py-0" : "py-0"
    }`}>
      <div className="container mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="text-2xl font-serif font-semibold text-foreground tracking-tight">
          ACROXIA
        </Link>
        
        <nav className="hidden lg:flex items-center gap-10">
          <Link to="/" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Inicio
          </Link>
          <Link to="/precios" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Precios
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1">
              Para Profesionales
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80 bg-cream p-2">
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  to="/profesionales/inmobiliarias" 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-charcoal/5 transition-colors cursor-pointer w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-charcoal/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-charcoal/70" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Inmobiliarias y APIs</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Integra análisis en tu plataforma</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  to="/profesionales/gestorias" 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-charcoal/5 transition-colors cursor-pointer w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-charcoal/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-charcoal/70" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Gestorías y Administradores</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Optimiza la revisión de contratos</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  to="/precios#b2b" 
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  Ver planes empresariales
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1">
              Guías
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80 bg-cream p-2">
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  to="/clausulas-abusivas-alquiler" 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-charcoal/5 transition-colors cursor-pointer w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Cláusulas abusivas</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Identifica cláusulas ilegales</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  to="/devolucion-fianza-alquiler" 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-charcoal/5 transition-colors cursor-pointer w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Devolución de fianza</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Recupera tu depósito</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  to="/subida-alquiler-2026" 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-charcoal/5 transition-colors cursor-pointer w-full"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">Subida alquiler 2026</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Límites y normativa actual</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link 
                  to="/faq" 
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  Todas las preguntas
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/blog" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Blog
          </Link>
          <Link to="/contacto" className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium">
            Contacto
          </Link>
        </nav>
        
        {/* Menú móvil */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-cream border-l border-border px-6">
            <nav className="flex flex-col gap-6 mt-8">
              <Link 
                to="/" 
                onClick={closeMobileMenu}
                className="text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
              >
                Inicio
              </Link>
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
              <Link 
                to="/contacto" 
                onClick={closeMobileMenu}
                className="text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
              >
                Contacto
              </Link>
              
              {/* Para Profesionales en móvil */}
              <div className="pt-4 border-t border-charcoal/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Para Profesionales</p>
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/profesionales/inmobiliarias" 
                    onClick={closeMobileMenu}
                    className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                  >
                    Inmobiliarias y APIs
                  </Link>
                  <Link 
                    to="/profesionales/gestorias" 
                    onClick={closeMobileMenu}
                    className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                  >
                    Gestorías y Administradores
                  </Link>
                </div>
              </div>

              {/* Guías SEO en móvil */}
              <div className="pt-4 border-t border-charcoal/10">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Guías</p>
                <div className="flex flex-col gap-3">
                  <Link 
                    to="/clausulas-abusivas-alquiler" 
                    onClick={closeMobileMenu}
                    className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                  >
                    Cláusulas abusivas
                  </Link>
                  <Link 
                    to="/devolucion-fianza-alquiler" 
                    onClick={closeMobileMenu}
                    className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                  >
                    Devolución de fianza
                  </Link>
                  <Link 
                    to="/subida-alquiler-2026" 
                    onClick={closeMobileMenu}
                    className="text-foreground/70 hover:text-foreground transition-colors text-sm"
                  >
                    Subida alquiler 2026
                  </Link>
                </div>
              </div>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-charcoal/10 flex flex-col gap-4">
              {user ? (
                <>
                  <div className="px-1 py-2">
                    <p className="text-sm font-medium text-foreground">{profile?.first_name || "Usuario"}</p>
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
                <Badge variant="secondary" className="bg-charcoal/10 text-charcoal/70 font-medium px-4 py-2 text-center">
                  Próximamente
                </Badge>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Botones desktop */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-foreground/70 hover:text-foreground hover:bg-transparent text-sm font-medium">
                    <User className="mr-2 h-4 w-4" />
                    {profile?.first_name || "Mi cuenta"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{profile?.first_name || "Usuario"}</p>
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
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mi perfil
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
            <Badge variant="secondary" className="bg-charcoal/10 text-charcoal/70 font-medium px-4 py-1.5">
              Próximamente
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

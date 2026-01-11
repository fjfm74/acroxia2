import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowRight,
  ChevronDown,
  Settings
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsProfessional } from "@/hooks/useIsProfessional";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { isProfessional } = useIsProfessional();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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

  const menuVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 8, scale: 0.98 }
  };

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
          {/* Mega menú Para Profesionales */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveMenu("profesionales")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1">
              Para Profesionales
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeMenu === "profesionales" ? "rotate-180" : ""}`} />
            </button>
            
            {/* Puente invisible */}
            <div className="absolute top-full left-0 right-0 h-3" />
            
            <AnimatePresence>
              {activeMenu === "profesionales" && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={menuVariants}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-cream rounded-xl shadow-lg border border-charcoal/5 p-2 z-50"
                >
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
                  <div className="border-t border-charcoal/10 my-2" />
                  <Link 
                    to="/precios#b2b" 
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Ver planes empresariales
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mega menú Guías */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveMenu("guias")}
            onMouseLeave={() => setActiveMenu(null)}
          >
            <button className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium flex items-center gap-1">
              Guías
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeMenu === "guias" ? "rotate-180" : ""}`} />
            </button>
            
            {/* Puente invisible */}
            <div className="absolute top-full left-0 right-0 h-3" />
            
            <AnimatePresence>
              {activeMenu === "guias" && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={menuVariants}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-cream rounded-xl shadow-lg border border-charcoal/5 p-2 z-50"
                >
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
                  <div className="border-t border-charcoal/10 my-2" />
                  <Link 
                    to="/faq" 
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Todas las preguntas
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          <SheetContent side="right" className="w-[300px] bg-cream border-l border-border px-6 flex flex-col h-full">
            {/* Bloque de usuario fijo arriba */}
            {user && (
              <div className="pt-6 pb-4 border-b border-charcoal/10 shrink-0">
                <div className="px-1 py-2">
                  <p className="text-sm font-medium text-foreground">{profile?.first_name || "Usuario"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <FileText className="h-3 w-3" />
                    {profile?.credits || 0} créditos
                  </p>
                </div>
                <div className="flex flex-col gap-3 mt-3">
                  <Link 
                    to={isProfessional ? "/pro" : "/dashboard"} 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {isProfessional ? "Mi panel Pro" : "Mi panel"}
                  </Link>
                  <Link 
                    to="/perfil" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
                  >
                    <User className="h-4 w-4" />
                    Mi perfil
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={closeMobileMenu}
                      className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
                    >
                      <Settings className="h-4 w-4" />
                      Panel Admin
                    </Link>
                  )}
                  <Link 
                    to="/analizar" 
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors text-base font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    Analizar contrato
                  </Link>
                </div>
              </div>
            )}

            {/* Navegación con scroll */}
            <nav className="flex flex-col gap-6 mt-6 flex-1 overflow-y-auto">
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
            
            {/* Pie del menú */}
            <div className="pt-4 pb-6 border-t border-charcoal/10 shrink-0">
              {user ? (
                <button
                  onClick={() => { handleSignOut(); closeMobileMenu(); }}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-base font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              ) : (
                <Badge variant="secondary" className="bg-charcoal/10 text-charcoal/70 font-medium px-4 py-2 text-center w-full">
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
                    <Link to={isProfessional ? "/pro" : "/dashboard"} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {isProfessional ? "Mi panel Pro" : "Mi panel"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mi perfil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
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

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
import { User, LogOut, FileText, LayoutDashboard } from "lucide-react";

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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
        
        <div className="flex items-center gap-4">
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
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-foreground/70 hover:text-foreground hover:bg-transparent text-sm font-medium">
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

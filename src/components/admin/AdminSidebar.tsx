import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  FolderOpen, 
  Users, 
  ArrowLeft,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Blog",
    href: "/admin/blog",
    icon: FileText,
  },
  {
    title: "Documentos Legales",
    href: "/admin/documentos",
    icon: FolderOpen,
  },
  {
    title: "Usuarios Admin",
    href: "/admin/usuarios",
    icon: Users,
  },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-muted border-r border-border">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Volver al sitio</span>
        </Link>
        
        <div className="mb-8">
          <h1 className="font-serif text-xl font-semibold text-foreground">ACROXIA</h1>
          <p className="text-xs text-muted-foreground mt-1">Panel de Administración</p>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/admin" && location.pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-foreground text-background" 
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="my-6 border-t border-border" />

        {/* User Dashboard Link */}
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-background"
        >
          <Home className="h-4 w-4" />
          Dashboard Usuario
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import AdminNav from "./AdminNav";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

const AdminLayout = ({ children, title, description }: AdminLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - visible only on mobile/tablet */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-cream border-b border-border flex items-center px-4">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-3">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-muted">
            <AdminNav onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="font-serif text-lg font-semibold">ACROXIA Admin</span>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile/tablet */}
        <aside className="hidden lg:block w-64 min-h-screen bg-muted border-r border-border sticky top-0">
          <AdminNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 pt-14 lg:pt-0 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 lg:mb-8">
              <h1 className="font-serif text-2xl lg:text-3xl font-semibold text-foreground">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1 lg:mt-2 text-sm lg:text-base">{description}</p>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

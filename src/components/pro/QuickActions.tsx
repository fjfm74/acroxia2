import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch, Settings, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const QuickActions = () => {
  const actions = [
    {
      icon: FileSearch,
      label: "Nuevo análisis",
      description: "Analiza un contrato de alquiler",
      href: "/analizar",
      primary: true,
    },
    {
      icon: FileText,
      label: "Crear contrato",
      description: "Genera una plantilla actualizada",
      href: "/pro/crear-contrato",
    },
    {
      icon: Settings,
      label: "Configuración",
      description: "Personaliza tu marca",
      href: "/pro/configuracion",
    },
  ];

  return (
    <Card className="bg-background rounded-2xl shadow-lg border-0">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-foreground">
          Acciones rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Link key={action.href} to={action.href}>
            <Button
              variant={action.primary ? "default" : "outline"}
              className={`w-full justify-start h-auto py-3 px-4 ${
                action.primary
                  ? "bg-foreground text-background hover:bg-foreground/90 rounded-full"
                  : "border-muted-foreground/20 hover:bg-muted"
              }`}
            >
              <action.icon className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">{action.label}</p>
                <p
                  className={`text-xs ${
                    action.primary ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {action.description}
                </p>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Home, Briefcase, ArrowRight, CheckCircle } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const OnboardingWizard = ({ onComplete }: OnboardingWizardProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessType: "gestoria",
    companyName: "",
    phone: "",
    email: user?.email || "",
  });

  const businessTypes = [
    {
      value: "inmobiliaria",
      label: "Inmobiliaria",
      description: "Gestiono propiedades y alquileres",
      icon: Home,
    },
    {
      value: "gestoria",
      label: "Gestoría / Asesoría",
      description: "Asesoro a propietarios e inquilinos",
      icon: Briefcase,
    },
    {
      value: "otro",
      label: "Otro profesional",
      description: "Abogado, administrador de fincas, etc.",
      icon: Building2,
    },
  ];

  const handleSubmit = async () => {
    if (!formData.companyName.trim()) {
      toast.error("El nombre de la empresa es obligatorio");
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setLoading(true);

    try {
      // Create organization
      const { error: orgError } = await supabase.from("organizations").insert({
        name: formData.companyName.trim(),
        business_type: formData.businessType,
        owner_id: user.id,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
      });

      if (orgError) throw orgError;

      // Add professional role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "professional",
      });

      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Error adding role:", roleError);
      }

      toast.success("¡Cuenta profesional creada con éxito!");
      onComplete();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Error al crear la cuenta profesional");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <FadeIn>
        <Card className="w-full max-w-lg bg-background rounded-2xl shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-serif text-2xl md:text-3xl">
              {step === 1 ? "¿Qué tipo de profesional eres?" : "Datos de tu empresa"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Esto nos ayuda a personalizar tu experiencia"
                : "Esta información aparecerá en los informes de tus clientes"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {step === 1 ? (
              <div className="space-y-6">
                <RadioGroup
                  value={formData.businessType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, businessType: value })
                  }
                  className="space-y-3"
                >
                  {businessTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.businessType === type.value
                          ? "border-foreground bg-muted"
                          : "border-muted hover:border-muted-foreground/30"
                      }`}
                    >
                      <RadioGroupItem value={type.value} className="sr-only" />
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          formData.businessType === type.value
                            ? "bg-foreground text-background"
                            : "bg-muted"
                        }`}
                      >
                        <type.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{type.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                      {formData.businessType === type.value && (
                        <CheckCircle className="h-5 w-5 text-foreground" />
                      )}
                    </label>
                  ))}
                </RadioGroup>
                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la empresa *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="Tu Gestoría S.L."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email de contacto</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contacto@tuempresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-foreground text-background hover:bg-foreground/90 rounded-full"
                  >
                    {loading ? "Creando..." : "Crear cuenta profesional"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
};

export default OnboardingWizard;

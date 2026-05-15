import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar, Palmtree, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  type: "temporada" | "vacacional";
  onBack?: () => void;
}

const ContractNotSupported = ({ type, onBack }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const Icon = type === "temporada" ? Calendar : Palmtree;
  const label = type === "temporada" ? "de temporada" : "vacacionales y turísticos";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !accepted) return;
    setLoading(true);
    const { error } = await supabase
      .from("waitlist_contract_types")
      .insert({ email: email.trim().toLowerCase(), contract_type: type });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({
      title: "¡Listo!",
      description: `Te avisaremos cuando lancemos análisis ${label}.`,
    });
  };

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 rounded-full bg-muted text-muted-foreground mb-4">
          <Icon className="h-10 w-10" />
        </div>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-4">
          Por ahora no analizamos contratos {label}
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
          {type === "temporada" ? (
            <>
              Los contratos de temporada se rigen por el art. 3.2 de la LAU y tienen un régimen
              jurídico distinto al de vivienda habitual. Su análisis requiere una lógica específica
              que aún no hemos implementado.
            </>
          ) : (
            <>
              Las viviendas de uso turístico (VUT/HUT) se regulan por Decretos autonómicos
              específicos (75/2020 Cataluña, 28/2016 Andalucía, etc.) y quedan fuera de la LAU. Su
              análisis requiere normativa territorial especializada.
            </>
          )}
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <h3 className="font-medium text-foreground mb-3">Mientras tanto, puedes:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
            <li>Consultar la normativa específica de tu Comunidad Autónoma</li>
            <li>Consultar a un abogado especialista en arrendamientos</li>
            <li>Acudir a la OCU u otra asociación de consumidores</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-foreground text-background mb-6">
        <CardContent className="pt-6">
          <h3 className="font-serif text-xl font-medium mb-2">Avísame cuando lo lancéis</h3>
          <p className="text-background/70 text-sm mb-4">
            Te enviaremos un único email cuando lancemos el análisis para este tipo de contrato.
          </p>
          {submitted ? (
            <p className="text-sm text-background/90">
              ✓ Te avisaremos en <strong>{email}</strong>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background text-foreground"
              />
              <div className="flex items-start gap-2">
                <Checkbox
                  id="rgpd"
                  checked={accepted}
                  onCheckedChange={(c) => setAccepted(c as boolean)}
                  className="mt-1 border-background data-[state=checked]:bg-background data-[state=checked]:text-foreground"
                />
                <Label htmlFor="rgpd" className="text-xs text-background/80 leading-relaxed cursor-pointer">
                  Acepto recibir un aviso por email. Mis datos se tratan según la política de privacidad.
                </Label>
              </div>
              <Button
                type="submit"
                disabled={!email || !accepted || loading}
                className="w-full bg-background text-foreground hover:bg-background/90 rounded-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Avisarme
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Cambiar tipo
          </Button>
        )}
        <Button variant="outline" onClick={() => navigate("/")} className="rounded-full">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
};

export default ContractNotSupported;

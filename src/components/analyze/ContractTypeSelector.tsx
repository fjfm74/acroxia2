import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Home,
  BedDouble,
  Calendar,
  Palmtree,
  HelpCircle,
  Check,
  X,
  Store,
  Factory,
  Car,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ContractTypeChoice =
  | "habitual"
  | "habitacion"
  | "temporada"
  | "vacacional"
  | "local"
  | "industrial"
  | "garaje"
  | "oficina"
  | "no_seguro";

interface Option {
  id: ContractTypeChoice;
  icon: React.ElementType;
  title: string;
  description: string;
  badge: { label: string; tone: "ok" | "no" | "info" };
}

const OPTIONS: Option[] = [
  {
    id: "habitual",
    icon: Home,
    title: "Vivienda habitual (LAU)",
    description: "Tu domicilio. Contrato de 1 año o más, vivienda habitual permanente",
    badge: { label: "Lo analizamos", tone: "ok" },
  },
  {
    id: "habitacion",
    icon: BedDouble,
    title: "Habitación en piso compartido",
    description: "Alquiler de una habitación dentro de una vivienda",
    badge: { label: "Lo analizamos", tone: "ok" },
  },
  {
    id: "temporada",
    icon: Calendar,
    title: "Temporada (no habitual)",
    description: "Estudiantes, trabajo temporal, estancia <11 meses no habitual",
    badge: { label: "No lo analizamos", tone: "no" },
  },
  {
    id: "vacacional",
    icon: Palmtree,
    title: "Vacacional / Turístico",
    description: "Estancias cortas, Airbnb, viviendas de uso turístico (VUT/HUT)",
    badge: { label: "No lo analizamos", tone: "no" },
  },
  {
    id: "local",
    icon: Store,
    title: "Local comercial",
    description: "Arrendamiento de local para negocio (rige LAU Título III, no Título II)",
    badge: { label: "No lo analizamos", tone: "no" },
  },
  {
    id: "industrial",
    icon: Factory,
    title: "Industrial / Nave",
    description: "Naves industriales, almacenes, espacios productivos",
    badge: { label: "No lo analizamos", tone: "no" },
  },
  {
    id: "garaje",
    icon: Car,
    title: "Garaje / Trastero",
    description: "Plaza de garaje o trastero independiente (sin vivienda asociada)",
    badge: { label: "No lo analizamos", tone: "no" },
  },
  {
    id: "oficina",
    icon: Building2,
    title: "Oficina",
    description: "Oficinas o despachos profesionales",
    badge: { label: "No lo analizamos", tone: "no" },
  },
  {
    id: "no_seguro",
    icon: HelpCircle,
    title: "No estoy seguro",
    description: "Responde 3 preguntas rápidas y te indicamos el tipo",
    badge: { label: "Te ayudamos", tone: "info" },
  },
];

interface Props {
  onSelect: (choice: ContractTypeChoice) => void;
}

const ContractTypeSelector = ({ onSelect }: Props) => {
  const [selected, setSelected] = useState<ContractTypeChoice | null>(null);

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-3">
          ¿Qué tipo de contrato vas a analizar?
        </h2>
        <p className="text-muted-foreground">
          Elige una opción para continuar. Solo analizamos contratos LAU de vivienda.
        </p>
      </div>

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button key={opt.id} onClick={() => setSelected(opt.id)} className="w-full text-left" type="button">
              <Card
                className={cn(
                  "p-5 flex items-start gap-4 transition-all hover:shadow-md cursor-pointer",
                  isSelected ? "ring-2 ring-foreground border-foreground" : "hover:border-foreground/30",
                )}
              >
                <div
                  className={cn(
                    "p-2.5 rounded-lg flex-shrink-0",
                    isSelected ? "bg-foreground text-background" : "bg-muted text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-foreground">{opt.title}</h3>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
                        opt.badge.tone === "ok" && "bg-green-100 text-green-800",
                        opt.badge.tone === "no" && "bg-muted text-muted-foreground",
                        opt.badge.tone === "info" && "bg-blue-100 text-blue-800",
                      )}
                    >
                      {opt.badge.tone === "ok" && <Check className="h-3 w-3" />}
                      {opt.badge.tone === "no" && <X className="h-3 w-3" />}
                      {opt.badge.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{opt.description}</p>
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          size="lg"
          className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default ContractTypeSelector;

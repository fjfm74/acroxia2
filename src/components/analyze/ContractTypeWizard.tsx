import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export type WizardResult = "habitual" | "temporada" | "vacacional";

interface Props {
  onResult: (result: WizardResult) => void;
  onBack?: () => void;
}

const QUESTIONS = [
  {
    q: "¿Es tu domicilio habitual?",
    hint: "Te empadronas allí, vives todo el año",
  },
  {
    q: "¿La duración del contrato es 11 meses o más?",
    hint: "Suma prórrogas si las hay",
  },
  {
    q: "¿Es alquiler turístico (registrado como VUT/HUT)?",
    hint: "Estancias cortas tipo Airbnb con licencia turística",
  },
];

const ContractTypeWizard = ({ onResult, onBack }: Props) => {
  const [step, setStep] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const answer = (yes: boolean) => {
    if (step === 0 && yes) return onResult("habitual");
    if (step === 1 && yes) return onResult("habitual");
    if (step === 2) return onResult(yes ? "vacacional" : "temporada");
    setHistory([...history, step]);
    setStep(step + 1);
  };

  const back = () => {
    if (history.length === 0) {
      onBack?.();
      return;
    }
    const prev = [...history];
    const last = prev.pop()!;
    setHistory(prev);
    setStep(last);
  };

  const current = QUESTIONS[step];

  return (
    <div className="max-w-[720px] mx-auto">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
          Pregunta {step + 1} de {QUESTIONS.length}
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-3">
          {current.q}
        </h2>
        <p className="text-muted-foreground">{current.hint}</p>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-2 gap-4">
          <Button
            size="lg"
            onClick={() => answer(true)}
            className="h-20 text-lg bg-foreground text-background hover:bg-foreground/90 rounded-2xl"
          >
            Sí
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => answer(false)}
            className="h-20 text-lg rounded-2xl"
          >
            No
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button variant="ghost" onClick={back}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>
    </div>
  );
};

export default ContractTypeWizard;

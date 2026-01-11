import ProLayout from "@/components/pro/ProLayout";
import ContractTemplateWizard from "@/components/pro/ContractTemplateWizard";
import FadeIn from "@/components/animations/FadeIn";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CreateContractPage = () => {
  return (
    <ProLayout>
      <div className="space-y-8">
        <FadeIn>
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileText className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
              Generador de plantillas de contrato
            </h1>
            <p className="text-muted-foreground text-lg">
              Crea una plantilla de contrato de alquiler actualizada según la LAU vigente. 
              Sin datos personales, lista para rellenar con tus clientes.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Alert className="max-w-2xl mx-auto border-blue-500/50 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Esta herramienta genera una plantilla genérica sin datos personales para cumplir con 
              la normativa de protección de datos. El arrendador y arrendatario deberán completar 
              sus datos antes de la firma.
            </AlertDescription>
          </Alert>
        </FadeIn>

        <FadeIn delay={0.2}>
          <ContractTemplateWizard />
        </FadeIn>
      </div>
    </ProLayout>
  );
};

export default CreateContractPage;

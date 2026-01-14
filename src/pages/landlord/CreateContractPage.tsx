import LandlordLayout from "@/components/landlord/LandlordLayout";
import ContractTemplateWizard from "@/components/pro/ContractTemplateWizard";
import FadeIn from "@/components/animations/FadeIn";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Helmet } from "react-helmet-async";

const CreateContractLandlordPage = () => {
  return (
    <>
      <Helmet>
        <title>Crear Contrato | Panel Propietario | ACROXIA</title>
        <meta name="description" content="Genera un contrato de alquiler conforme a la LAU vigente." />
      </Helmet>

      <LandlordLayout>
        <div className="space-y-8">
          <FadeIn>
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                <FileText className="h-8 w-8 text-amber-600" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                Crea tu contrato de alquiler
              </h1>
              <p className="text-muted-foreground text-lg">
                Genera un contrato actualizado según la LAU vigente, 
                personalizado para tu vivienda.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Alert className="max-w-2xl mx-auto border-amber-500/50 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Esta herramienta genera una plantilla genérica sin datos personales. 
                Tú y tu inquilino deberéis completar vuestros datos antes de la firma.
              </AlertDescription>
            </Alert>
          </FadeIn>

          <FadeIn delay={0.2}>
            <ContractTemplateWizard />
          </FadeIn>
        </div>
      </LandlordLayout>
    </>
  );
};

export default CreateContractLandlordPage;

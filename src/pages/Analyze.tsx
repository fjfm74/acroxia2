import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const Analyze = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const [acceptedThirdPartyData, setAcceptedThirdPartyData] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const ACCEPTED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Formato no soportado. Usa PDF, DOCX, JPG, PNG o WEBP";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "El archivo no puede superar los 10MB";
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const error = validateFile(droppedFile);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
        return;
      }
      setFile(droppedFile);
    }
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile);
      if (error) {
        toast({ title: "Error", description: error, variant: "destructive" });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !user) return;

    // Los admins tienen análisis ilimitados
    if (!isAdmin && (!profile || profile.credits < 1)) {
      toast({
        title: "Sin créditos",
        description: "No tienes créditos disponibles. Adquiere un plan para continuar.",
        variant: "destructive",
      });
      navigate("/precios");
      return;
    }

    setUploading(true);
    setProgress(10);
    setAnalysisStep("Subiendo contrato...");

    try {
      // Upload file
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(30);
      setAnalysisStep("Creando registro...");

      // Create contract record
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          status: "processing",
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // Log third-party data consent
      await supabase.from("consent_logs").insert({
        user_id: user.id,
        consent_type: "third_party_data",
        accepted: true,
        user_agent: navigator.userAgent,
        document_version: "2026-01-08",
        metadata: {
          contract_id: contract.id,
          file_name: file.name,
        },
      });

      setUploading(false);
      setAnalyzing(true);
      setProgress(50);
      setAnalysisStep("Analizando contrato con IA...");

      // Call analysis edge function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-contract",
        {
          body: { contractId: contract.id, filePath, fileType: file.type },
        }
      );

      if (analysisError) throw analysisError;

      setProgress(90);
      setAnalysisStep("Guardando resultados...");

      // Refresh profile to update credits
      await refreshProfile();

      setProgress(100);
      setAnalysisStep("¡Análisis completado!");

      toast({
        title: "¡Análisis completado!",
        description: "Tu contrato ha sido analizado exitosamente.",
      });

      // Navigate to results
      setTimeout(() => {
        navigate(`/resultado/${contract.id}`);
      }, 1000);

    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error durante el análisis.",
        variant: "destructive",
      });
      setUploading(false);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const isProcessing = uploading || analyzing;

  return (
    <>
      <Helmet>
        <title>Analizar Contrato | ACROXIA</title>
        <meta name="description" content="Sube tu contrato de alquiler y recibe un análisis detallado de cláusulas ilegales." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-muted pt-28 pb-12">
          <div className="container mx-auto px-6 max-w-2xl">
            <FadeIn>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-semibold text-charcoal mb-2">
                  Analizar contrato
                </h1>
                <p className="text-charcoal/70">
                  Sube tu contrato de alquiler
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Subir contrato</CardTitle>
                  <CardDescription>
                    Formatos aceptados: PDF, DOCX, JPG, PNG (máx. 10MB)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isProcessing ? (
                    <>
                      <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`
                          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                          transition-colors duration-200
                          ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
                          ${file ? "bg-green-50 border-green-300" : ""}
                        `}
                      >
                        <input
                          type="file"
                          accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.webp"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        {file ? (
                          <div className="space-y-2">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                            <p className="font-medium text-green-800">{file.name}</p>
                            <p className="text-sm text-green-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="mr-1 h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Arrastra tu contrato aquí</p>
                              <p className="text-sm text-muted-foreground">
                                o haz clic para seleccionar
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isAdmin && profile && profile.credits < 1 && (
                        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-800">Sin créditos disponibles</p>
                            <p className="text-sm text-amber-600">
                              Necesitas créditos para analizar contratos.{" "}
                              <a href="/precios" className="underline">Ver planes</a>
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Third Party Data Declaration - Legal Compliance */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3 mb-4">
                          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800 mb-2">
                              Declaración sobre datos de terceros
                            </p>
                            <p className="text-sm text-amber-700 mb-3">
                              El contrato que vas a subir puede contener datos personales de terceras personas 
                              (arrendador, propietario, inmobiliaria, avalistas), incluyendo nombres, DNI/NIE, 
                              direcciones y datos bancarios.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 ml-8">
                          <Checkbox
                            id="thirdPartyData"
                            checked={acceptedThirdPartyData}
                            onCheckedChange={(checked) => setAcceptedThirdPartyData(checked as boolean)}
                            className="mt-1"
                          />
                          <Label htmlFor="thirdPartyData" className="text-sm text-amber-800 leading-relaxed cursor-pointer">
                            Declaro que <strong>soy parte del contrato</strong> (arrendatario o potencial arrendatario) 
                            y tengo interés legítimo en analizarlo. He leído la información sobre el{" "}
                            <Link to="/privacidad#datos-terceros" className="underline hover:no-underline" target="_blank">
                              tratamiento de datos de terceros
                            </Link>.
                          </Label>
                        </div>
                      </div>

                      {/* AI Disclaimer - Legal Compliance */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <p className="font-medium text-blue-800 mb-2">
                          ℹ️ Información importante sobre el análisis
                        </p>
                        <ul className="text-blue-700 space-y-1 list-disc list-inside">
                          <li>Este análisis es generado por inteligencia artificial</li>
                          <li>Tiene carácter <strong>informativo</strong>, NO es asesoramiento legal</li>
                          <li>Para decisiones legales, consulta con un abogado colegiado</li>
                        </ul>
                      </div>

                      <Button
                        onClick={handleAnalyze}
                        disabled={!file || !profile || (!isAdmin && profile.credits < 1) || !acceptedThirdPartyData}
                        className="w-full"
                        size="lg"
                      >
                        <FileText className="mr-2 h-5 w-5" />
                        {isAdmin ? "Analizar contrato (sin coste)" : "Analizar contrato (1 crédito)"}
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-6 py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="font-medium">{analysisStep}</p>
                        <Progress value={progress} className="h-2" />
                        <p className="text-sm text-muted-foreground">{progress}% completado</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Analyze;

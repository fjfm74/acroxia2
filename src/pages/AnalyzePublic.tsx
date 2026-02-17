import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
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
import { Upload, FileText, X, Loader2, CheckCircle2, ShieldAlert, Users, Clock, Shield } from "lucide-react";
import { trackConversion } from "@/lib/analytics";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Generate or get session ID from localStorage
const getSessionId = (): string => {
  const key = "acroxia_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

const AnalyzePublic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const [acceptedThirdPartyData, setAcceptedThirdPartyData] = useState(false);
  const [sessionId] = useState(getSessionId);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estimated analysis duration in seconds (based on logs: 30-90s, avg ~60s)
  const ESTIMATED_DURATION = 60;

  // Gradual progress animation during AI analysis
  useEffect(() => {
    if (!analyzing) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const startProgress = 50;
    const targetProgress = 88;
    const duration = ESTIMATED_DURATION * 1000 * 0.85;
    const intervalMs = 500;
    const totalSteps = duration / intervalMs;
    const increment = (targetProgress - startProgress) / totalSteps;

    let currentStep = 0;

    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(
        Math.round(startProgress + increment * currentStep),
        targetProgress
      );
      setProgress(newProgress);

      if (newProgress >= 50 && newProgress < 62) {
        setAnalysisStep("Extrayendo texto del documento...");
      } else if (newProgress >= 62 && newProgress < 74) {
        setAnalysisStep("Consultando normativa legal actualizada...");
      } else if (newProgress >= 74 && newProgress < 85) {
        setAnalysisStep("Analizando cláusulas con IA...");
      } else if (newProgress >= 85) {
        setAnalysisStep("Generando informe detallado...");
      }

      if (currentStep >= totalSteps) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, intervalMs);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [analyzing]);

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
    if (!file) return;

    setUploading(true);
    setProgress(10);
    setAnalysisStep("Subiendo contrato...");

    // Track free analysis started
    trackConversion('free_analysis_started', {
      file_type: file.type,
      file_size_mb: Math.round(file.size / 1024 / 1024 * 100) / 100,
      session_id: sessionId,
    });

    const startTime = Date.now();

    try {
      // Upload file to anonymous path
      const filePath = `anonymous/${sessionId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setProgress(30);
      setAnalysisStep("Creando registro...");

      // Create anonymous analysis record
      const { data: analysis, error: analysisRecordError } = await supabase
        .from("anonymous_analyses")
        .insert({
          session_id: sessionId,
          file_name: file.name,
          file_path: filePath,
        })
        .select()
        .single();

      if (analysisRecordError) throw analysisRecordError;

      setUploading(false);
      setAnalyzing(true);
      setProgress(50);
      setAnalysisStep("Extrayendo texto del documento...");

      // Call public analysis edge function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-contract-public",
        {
          body: { 
            analysisId: analysis.id, 
            filePath, 
            fileType: file.type,
            sessionId 
          },
        }
      );

      if (analysisError) throw analysisError;

      // Stop gradual progress and jump to completion
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setProgress(100);
      setAnalysisStep("¡Análisis completado!");

      // Track free analysis completed
      trackConversion('free_analysis_completed', {
        analysis_id: analysis.id,
        session_id: sessionId,
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
      });

      toast({
        title: "¡Análisis completado!",
        description: "Tu contrato ha sido analizado. Revisa los resultados.",
      });

      // Navigate to preview results
      setTimeout(() => {
        navigate(`/resultado-previo/${analysis.id}`);
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
      <SEOHead
        title="Analiza tu Contrato de Alquiler Gratis con IA | ACROXIA"
        description="Sube tu contrato en PDF o imagen y obtén un análisis gratuito en menos de 2 minutos. Detecta cláusulas abusivas según la LAU 2026. Sin registro."
        canonical="https://acroxia.com/analizar-gratis"
        keywords="analizar contrato alquiler gratis, revisar contrato alquiler, cláusulas abusivas, derechos inquilino"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "ACROXIA - Analizador de Contratos de Alquiler",
          "applicationCategory": "LegalApplication",
          "operatingSystem": "Web",
          "description": "Sube tu contrato de alquiler y recibe un análisis gratuito de cláusulas potencialmente ilegales con IA",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR",
            "description": "Análisis preview gratuito sin registro"
          },
          "potentialAction": {
            "@type": "UseAction",
            "target": "https://acroxia.com/analizar-gratis",
            "name": "Analizar contrato de alquiler gratis"
          }
        }}
      />

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-muted pt-28 pb-12">
          <div className="container mx-auto px-6 max-w-4xl">
            <FadeIn>
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                  100% Gratuito · Sin registro
                </span>
                <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-4">
                  Analiza tu contrato ahora
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Descubre si tu contrato de alquiler contiene cláusulas que podrían ser ilegales o abusivas según la LAU.
                </p>
              </div>
            </FadeIn>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Upload Card */}
              <div className="lg:col-span-2">
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

                          {/* Third Party Data Declaration */}
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3 mb-4">
                              <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-amber-800 mb-2">
                                  Declaración sobre datos de terceros
                                </p>
                                <p className="text-sm text-amber-700 mb-3">
                                  El contrato puede contener datos personales de terceras personas.
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
                                Declaro que <strong>soy parte del contrato</strong> y tengo interés legítimo en analizarlo. He leído la{" "}
                                <Link to="/privacidad#datos-terceros" className="underline hover:no-underline" target="_blank">
                                  política de privacidad
                                </Link>.
                              </Label>
                            </div>
                          </div>

                          {/* AI Disclaimer */}
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                            <p className="font-medium text-blue-800 mb-2">
                              ℹ️ Información importante
                            </p>
                            <ul className="text-blue-700 space-y-1 list-disc list-inside">
                              <li>Análisis generado por inteligencia artificial</li>
                              <li>Carácter <strong>informativo</strong>, no es asesoramiento legal</li>
                              <li>Para decisiones legales, consulta con un abogado</li>
                            </ul>
                          </div>

                          <Button
                            onClick={handleAnalyze}
                            disabled={!file || !acceptedThirdPartyData}
                            className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
                            size="lg"
                          >
                            <FileText className="mr-2 h-5 w-5" />
                            Analizar contrato gratis
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-6 py-8">
                          <div className="flex justify-center">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                              <div className="relative p-3 rounded-full bg-primary/10">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                              </div>
                            </div>
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

              {/* Sidebar with benefits */}
              <div className="lg:col-span-1 space-y-6">
                <FadeIn delay={0.2}>
                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <Shield className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">100% Confidencial</p>
                          <p className="text-sm text-muted-foreground">Tus datos están protegidos</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Resultado en 2 min</p>
                          <p className="text-sm text-muted-foreground">Análisis inmediato con IA</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <Users className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">+2,847 usuarios</p>
                          <p className="text-sm text-muted-foreground">Ya protegieron sus derechos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                <FadeIn delay={0.3}>
                  <Card className="bg-foreground text-background">
                    <CardContent className="pt-6">
                      <p className="font-serif text-xl font-medium mb-2">
                        "Detectamos 3 cláusulas ilegales en mi contrato"
                      </p>
                      <p className="text-background/70 text-sm">
                        — María G., Madrid
                      </p>
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AnalyzePublic;

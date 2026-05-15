import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
import { trackConversion } from "@/lib/analytics";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Polling tras vuelta del checkout para detectar créditos sumados por el webhook.
// El webhook puede tardar 1-5 segundos en procesar la transacción y escribir
// profiles.credits. Sin polling, el user vería los créditos viejos hasta recargar.
const CHECKOUT_POLL_INTERVAL_MS = 2000;
const CHECKOUT_POLL_MAX_MS = 30_000;

const Analyze = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");
  const [acceptedThirdPartyData, setAcceptedThirdPartyData] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado del polling de créditos post-checkout
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);
  const checkoutPollRef = useRef<{ baselineCredits: number; cancelled: boolean } | null>(null);

  // Estimated analysis duration in seconds
  const ESTIMATED_DURATION = 60;

  // Polling tras checkout: detectar créditos sumados por el webhook.
  useEffect(() => {
    if (!checkoutSuccess || !profile) return;
    if (checkoutPollRef.current) return; // ya arrancó

    const baseline = profile.credits ?? 0;
    checkoutPollRef.current = { baselineCredits: baseline, cancelled: false };
    setPaymentProcessing(true);
    setPaymentTimedOut(false);

    const startedAt = Date.now();

    const poll = async () => {
      if (checkoutPollRef.current?.cancelled) return;
      try {
        await refreshProfile();
      } catch (e) {
        console.warn("[checkout-poll] refreshProfile error:", e);
      }
      // Re-leer credits del profile actual a través de un fetch directo (porque
      // refreshProfile actualiza el state pero no podemos leerlo síncrono aquí).
      if (!user) return;
      const { data: fresh } = await supabase.from("profiles").select("credits").eq("id", user.id).single();
      if (checkoutPollRef.current?.cancelled) return;

      const currentCredits = fresh?.credits ?? 0;
      const baselineNow = checkoutPollRef.current?.baselineCredits ?? baseline;

      if (currentCredits > baselineNow) {
        // Créditos llegaron — limpiamos URL y notificamos.
        setPaymentProcessing(false);
        setPaymentTimedOut(false);
        checkoutPollRef.current = { ...checkoutPollRef.current!, cancelled: true };
        const newSearch = new URLSearchParams(searchParams);
        newSearch.delete("checkout");
        setSearchParams(newSearch, { replace: true });
        toast({
          title: "¡Pago completado!",
          description: `Ahora tienes ${currentCredits} crédito${currentCredits === 1 ? "" : "s"} disponible${currentCredits === 1 ? "" : "s"}.`,
        });
        return;
      }

      if (Date.now() - startedAt >= CHECKOUT_POLL_MAX_MS) {
        // Timeout sin créditos nuevos: aviso al user.
        setPaymentProcessing(false);
        setPaymentTimedOut(true);
        checkoutPollRef.current = { ...checkoutPollRef.current!, cancelled: true };
        return;
      }

      setTimeout(poll, CHECKOUT_POLL_INTERVAL_MS);
    };

    setTimeout(poll, CHECKOUT_POLL_INTERVAL_MS);

    return () => {
      if (checkoutPollRef.current) {
        checkoutPollRef.current.cancelled = true;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutSuccess, profile?.id]);

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
      const newProgress = Math.min(Math.round(startProgress + increment * currentStep), targetProgress);
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
    "image/webp",
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
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
    },
    [toast],
  );

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

    trackConversion("analysis_started", {
      file_type: file.type,
      file_size_mb: Math.round((file.size / 1024 / 1024) * 100) / 100,
      user_id: user.id,
    });

    const startTime = Date.now();

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("contracts").upload(filePath, file);
      if (uploadError) throw uploadError;

      setProgress(30);
      setAnalysisStep("Creando registro...");

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

      await supabase.from("consent_logs").insert({
        user_id: user.id,
        consent_type: "third_party_data",
        accepted: true,
        user_agent: navigator.userAgent,
        document_version: "2026-01-08",
        metadata: { contract_id: contract.id, file_name: file.name },
      });

      setUploading(false);
      setAnalyzing(true);
      setProgress(50);
      setAnalysisStep("Extrayendo texto del documento...");

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke("analyze-contract", {
        body: { contractId: contract.id, filePath, fileType: file.type },
      });

      if (analysisError) throw analysisError;

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      setProgress(95);
      setAnalysisStep("Guardando resultados...");

      await refreshProfile();

      setProgress(100);
      setAnalysisStep("¡Análisis completado!");

      trackConversion("analysis_completed", {
        contract_id: contract.id,
        file_name: file.name,
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
        user_id: user.id,
      });

      toast({
        title: "¡Análisis completado!",
        description: "Tu contrato ha sido analizado exitosamente.",
      });

      setTimeout(() => navigate(`/resultado/${contract.id}`), 1000);
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
        <title>Analizar Contrato | ContratoAlquiler</title>
        <meta
          name="description"
          content="Sube tu contrato de alquiler y recibe un análisis detallado de cláusulas ilegales."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-muted pt-28 pb-12">
          <div className="container mx-auto px-6 max-w-2xl">
            <FadeIn>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-semibold text-charcoal mb-2">Analizar contrato</h1>
                <p className="text-charcoal/70">Sube tu contrato de alquiler</p>
              </div>
            </FadeIn>

            {/* Banner post-checkout: estamos esperando a que el webhook sume los créditos */}
            {paymentProcessing && (
              <FadeIn>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">Procesando tu pago…</p>
                    <p className="text-sm text-blue-700">
                      Estamos sumando los créditos a tu cuenta. Suele tardar unos segundos. No cierres esta ventana.
                    </p>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Banner timeout: el polling acabó sin ver nuevos créditos */}
            {paymentTimedOut && (
              <FadeIn>
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">El pago aún se está procesando</p>
                    <p className="text-sm text-amber-700">
                      Si has pagado correctamente, tus créditos aparecerán en breve. Recarga la página en unos segundos.
                      Si pasados varios minutos sigue sin verse, escríbenos a soporte.
                    </p>
                  </div>
                </div>
              </FadeIn>
            )}

            <FadeIn delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Subir contrato</CardTitle>
                  <CardDescription>Formatos aceptados: PDF, DOCX, JPG, PNG (máx. 10MB)</CardDescription>
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
                          accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        {file ? (
                          <div className="space-y-2">
                            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                            <p className="font-medium text-green-800">{file.name}</p>
                            <p className="text-sm text-green-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
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
                              <p className="text-sm text-muted-foreground">o haz clic para seleccionar</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isAdmin && profile && profile.credits < 1 && !paymentProcessing && (
                        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-amber-800">Sin créditos disponibles</p>
                            <p className="text-sm text-amber-600">
                              Necesitas créditos para analizar contratos.{" "}
                              <a href="/precios" className="underline">
                                Ver planes
                              </a>
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-start gap-3 mb-4">
                          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800 mb-2">Declaración sobre datos de terceros</p>
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
                          <Label
                            htmlFor="thirdPartyData"
                            className="text-sm text-amber-800 leading-relaxed cursor-pointer"
                          >
                            Declaro que <strong>soy parte del contrato</strong> (arrendatario o potencial arrendatario)
                            y tengo interés legítimo en analizarlo. He leído la información sobre el{" "}
                            <Link
                              to="/privacidad#datos-terceros"
                              className="underline hover:no-underline"
                              target="_blank"
                            >
                              tratamiento de datos de terceros
                            </Link>
                            .
                          </Label>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <p className="font-medium text-blue-800 mb-2">ℹ️ Información importante sobre el análisis</p>
                        <ul className="text-blue-700 space-y-1 list-disc list-inside">
                          <li>Este análisis es generado por inteligencia artificial</li>
                          <li>
                            Tiene carácter <strong>informativo</strong>, NO es asesoramiento legal
                          </li>
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
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Analyze;

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import LandlordLayout from "@/components/landlord/LandlordLayout";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Shield,
  Building2
} from "lucide-react";
import { toast } from "sonner";

const AnalyzeLandlordPage = () => {
  const { profile, refreshProfile } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const credits = profile?.credits || 0;
  const hasCredits = isAdmin || credits > 0;

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

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return "Formato no soportado. Usa PDF, DOCX, JPG, PNG o WEBP";
    }
    if (f.size > 10 * 1024 * 1024) {
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
        toast.error(error);
        return;
      }
      setFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const error = validateFile(selectedFile);
      if (error) {
        toast.error(error);
        return;
      }
      setFile(selectedFile);
    }
  };

  const readFunctionError = async (err: unknown): Promise<{ status?: number; code?: string }> => {
    const ctx = (err as { context?: Response & { body?: unknown } })?.context;
    const status = ctx?.status;
    let code: string | undefined;
    try {
      if (ctx && typeof (ctx as Response).clone === "function") {
        const j = await (ctx as Response).clone().json();
        code = j?.code;
      } else if (typeof ctx?.body === "string") {
        code = JSON.parse(ctx.body)?.code;
      }
    } catch {
      /* ignore */
    }
    return { status, code };
  };

  const handleAnalyze = async () => {
    if (uploading || analyzing) return;
    if (!file || !hasCredits || !profile?.id) return;

    let landlordContractId: string | null = null;

    const markFailed = async () => {
      if (landlordContractId) {
        await supabase.from("landlord_contracts").update({ status: "failed" }).eq("id", landlordContractId);
      }
    };

    try {
      setUploading(true);

      const filePath = `${profile.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("contracts").upload(filePath, file);
      if (uploadError) throw uploadError;

      setUploading(false);
      setAnalyzing(true);

      // Registro de análisis (requerido por analyze-contract para validar propiedad)
      const { data: analysisContract, error: analysisContractError } = await supabase
        .from("contracts")
        .insert({
          user_id: profile.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          status: "processing",
        })
        .select()
        .single();
      if (analysisContractError) throw analysisContractError;

      // Registro del contrato en el panel del propietario
      const { data: contract, error: contractError } = await supabase
        .from("landlord_contracts")
        .insert({
          user_id: profile.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          status: "active",
        })
        .select()
        .single();
      if (contractError) throw contractError;
      landlordContractId = contract.id;

      // El crédito se consume en servidor (consume_credit) dentro de analyze-contract
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke("analyze-contract", {
        body: {
          contractId: analysisContract.id,
          filePath,
          fileType: file.type,
          perspective: "landlord",
        },
      });

      if (analysisError) {
        const { status, code } = await readFunctionError(analysisError);
        await markFailed();
        if (code === "NO_CREDITS" || status === 402) {
          toast.error("Sin créditos", { description: "Adquiere un plan para continuar." });
          navigate("/precios");
          return;
        }
        if (status === 401) {
          toast.error("Sesión caducada", { description: "Vuelve a iniciar sesión para continuar." });
          return;
        }
        if (code === "ANALYSIS_PARSE_ERROR" || status === 502) {
          toast.error("El análisis no devolvió un resultado válido, no se ha consumido crédito");
          return;
        }
        toast.error("Error al analizar el contrato");
        return;
      }

      const analysis = (analysisResult as { analysis?: unknown })?.analysis ?? analysisResult;

      await supabase
        .from("landlord_contracts")
        .update({ analysis_result: analysis as never })
        .eq("id", contract.id);

      await refreshProfile();

      toast.success("Análisis completado");
      navigate(`/propietario/contratos/${contract.id}`);
    } catch (error) {
      console.error("Error analyzing contract:", error);
      await markFailed();
      toast.error("Error al analizar el contrato");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Analizar Contrato | Panel Propietario | ContratoAlquiler</title>
        <meta name="description" content="Analiza tu contrato de alquiler desde la perspectiva del propietario." />
      </Helmet>

      <LandlordLayout>
        <div className="max-w-2xl mx-auto space-y-8">
          <FadeIn>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <Shield className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                Analiza tu contrato
              </h1>
              <p className="text-muted-foreground text-lg">
                Verifica que tu contrato cumple con la LAU y protege tus intereses como propietario
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Alert className="border-amber-500/50 bg-amber-50">
              <Building2 className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Perspectiva de propietario:</strong> El análisis verificará el cumplimiento 
                de la LAU, límites de renta en zonas tensionadas, y cláusulas que protejan tus derechos.
              </AlertDescription>
            </Alert>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Subir contrato
                </CardTitle>
                <CardDescription>
                  Formatos aceptados: PDF, DOCX, JPG, PNG (máx. 10MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Credits info */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm">Créditos disponibles:</span>
                  <span className="font-semibold">{isAdmin ? "∞ (admin)" : credits}</span>
                </div>

                {!hasCredits && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No tienes créditos disponibles. Adquiere más créditos para continuar.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Upload area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center transition-colors
                    ${dragActive ? "border-primary bg-primary/5" : "border-border"}
                    ${!hasCredits ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50"}
                  `}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Cambiar
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                      <p className="font-medium">Arrastra tu contrato aquí</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        o haz clic para seleccionar (PDF, DOCX, JPG, PNG)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={!hasCredits}
                      />
                    </label>
                  )}
                </div>

                {/* Analyze button */}
                <Button
                  onClick={handleAnalyze}
                  disabled={!file || !hasCredits || uploading || analyzing}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Analizar contrato
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="text-center text-sm text-muted-foreground">
              <p>
                El análisis verifica: cumplimiento LAU, límites de renta, 
                cláusulas abusivas, y requisitos legales para propietarios.
              </p>
            </div>
          </FadeIn>
        </div>
      </LandlordLayout>
    </>
  );
};

export default AnalyzeLandlordPage;

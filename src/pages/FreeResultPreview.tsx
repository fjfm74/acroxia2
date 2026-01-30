import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import LeadCaptureModal from "@/components/LeadCaptureModal";
import PaymentPlaceholder from "@/components/PaymentPlaceholder";
import { 
  CheckCircle, AlertTriangle, XCircle, Lock, Clock, 
  FileText, Shield, ArrowRight, Sparkles, Users 
} from "lucide-react";

interface AnalysisResult {
  total_clauses: number;
  valid_clauses: number;
  suspicious_clauses: number;
  illegal_clauses: number;
  recommendation?: string;
  clauses?: Array<{
    category: string;
    type: "legal" | "suspicious" | "illegal";
    original_text: string;
    explanation: string;
  }>;
}

const FreeResultPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;

      try {
        // Use secure RPC function that validates UUID-based access
        const { data, error: fetchError } = await supabase
          .rpc("get_anonymous_analysis", { analysis_uuid: id });

        if (fetchError) throw fetchError;
        
        // RPC returns an array, get the first result
        const analysisData = Array.isArray(data) ? data[0] : data;
        
        if (!analysisData) {
          setError("Este análisis ha expirado o no existe.");
          return;
        }

        setAnalysis(analysisData);
      } catch (err: any) {
        console.error("Error fetching analysis:", err);
        setError("No se pudo cargar el análisis.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (!analysis?.expires_at) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(analysis.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Expirado");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [analysis?.expires_at]);

  // Auto-show lead capture modal after 45 seconds
  useEffect(() => {
    if (!analysis || analysis.email) return;
    
    const timer = setTimeout(() => {
      setShowLeadModal(true);
    }, 45000);

    return () => clearTimeout(timer);
  }, [analysis]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted pt-28 pb-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando resultados...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-muted pt-28 pb-12 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="font-serif text-xl font-semibold mb-2">Análisis no encontrado</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild>
                <Link to="/analizar-gratis">Analizar nuevo contrato</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const result: AnalysisResult = analysis.analysis_result || {
    total_clauses: 0,
    valid_clauses: 0,
    suspicious_clauses: 0,
    illegal_clauses: 0,
  };

  // Calculate risk score (0-10)
  const riskScore = Math.min(10, Math.round(
    (result.illegal_clauses * 3 + result.suspicious_clauses * 1.5) / Math.max(result.total_clauses, 1) * 10
  ));

  // Get recommendation based on risk
  const getRecommendation = () => {
    if (result.illegal_clauses >= 2) {
      return { text: "No firmes sin negociar", color: "text-red-600", bg: "bg-red-50" };
    }
    if (result.illegal_clauses >= 1 || result.suspicious_clauses >= 3) {
      return { text: "Negocia antes de firmar", color: "text-amber-600", bg: "bg-amber-50" };
    }
    if (result.suspicious_clauses >= 1) {
      return { text: "Revisa con atención", color: "text-amber-600", bg: "bg-amber-50" };
    }
    return { text: "Contrato aparentemente correcto", color: "text-green-600", bg: "bg-green-50" };
  };

  const recommendation = getRecommendation();

  // Get example clauses (max 3, partially hidden)
  const exampleClauses = (result.clauses || []).slice(0, 3);

  return (
    <>
      <Helmet>
        <title>Resultado del Análisis | ACROXIA</title>
        <meta name="description" content="Resultados del análisis de tu contrato de alquiler." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-muted pt-28 pb-12">
          <div className="container mx-auto px-6 max-w-4xl">
            {/* Header with urgency */}
            <FadeIn>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-2">
                    Resultado del análisis
                  </h1>
                  <p className="text-muted-foreground">
                    {analysis.file_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Disponible: {timeRemaining}
                  </span>
                </div>
              </div>
            </FadeIn>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Results Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Risk Score Card */}
                <FadeIn delay={0.1}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Puntuación de riesgo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className={`
                            w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold
                            ${riskScore >= 7 ? 'bg-red-100 text-red-600' : 
                              riskScore >= 4 ? 'bg-amber-100 text-amber-600' : 
                              'bg-green-100 text-green-600'}
                          `}>
                            {riskScore}/10
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${recommendation.bg} ${recommendation.color}`}>
                            {recommendation.text}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Hemos analizado {result.total_clauses} cláusulas de tu contrato.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Clause Summary */}
                <FadeIn delay={0.2}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen de cláusulas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{result.valid_clauses} cláusulas correctas</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{result.suspicious_clauses} cláusulas sospechosas</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{result.illegal_clauses} cláusulas potencialmente ilegales</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Example Clauses (blurred) */}
                <FadeIn delay={0.3}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Detalle de cláusulas</CardTitle>
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Vista previa
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {exampleClauses.length > 0 ? (
                        exampleClauses.map((clause, index) => (
                          <div key={index} className="relative border rounded-lg p-4 overflow-hidden">
                            <div className="flex items-start gap-3 mb-2">
                              {clause.type === "legal" && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
                              {clause.type === "suspicious" && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />}
                              {clause.type === "illegal" && <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
                              <div>
                                <p className="font-medium text-foreground">{clause.category}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {clause.original_text.substring(0, 50)}...
                                </p>
                              </div>
                            </div>
                            
                            {/* Blur overlay */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/95 to-transparent flex items-end justify-center pb-2">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Desbloquea para ver el análisis completo
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Desbloquea el informe para ver el detalle de cada cláusula</p>
                        </div>
                      )}

                      {/* Locked clauses indicator */}
                      {result.total_clauses > 3 && (
                        <div className="flex items-center justify-center gap-2 py-4 border-t text-muted-foreground">
                          <Lock className="h-4 w-4" />
                          <span className="text-sm">
                            +{result.total_clauses - 3} cláusulas más en el informe completo
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </FadeIn>
              </div>

              {/* Sidebar CTAs */}
              <div className="lg:col-span-1 space-y-6">
                {/* Unlock Full Report CTA */}
                <FadeIn delay={0.2}>
                  <Card className="border-2 border-primary">
                    <CardContent className="pt-6 space-y-4">
                      <div className="text-center">
                        <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
                        <h3 className="font-serif text-xl font-semibold mb-2">
                          Informe completo
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Accede al análisis detallado de todas las cláusulas con recomendaciones personalizadas.
                        </p>
                        <div className="text-3xl font-bold text-foreground mb-1">
                          39€
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                          Pago único · Sin suscripción
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-full"
                        size="lg"
                      >
                        Desbloquear informe
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Análisis de todas las cláusulas
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Consejos de negociación
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Referencias legales verificadas
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Carta de reclamación (si aplica)
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Email Reminder Option */}
                <FadeIn delay={0.3}>
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium mb-2">¿Quieres que te avisemos?</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Te enviaremos un recordatorio antes de que expire tu análisis.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowLeadModal(true)}
                        className="w-full"
                      >
                        Recibir recordatorio
                      </Button>
                    </CardContent>
                  </Card>
                </FadeIn>

                {/* Social Proof */}
                <FadeIn delay={0.4}>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Users className="h-5 w-5" />
                    <span>2,847 inquilinos ya protegieron sus derechos</span>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {/* Modals */}
      <LeadCaptureModal 
        open={showLeadModal} 
        onOpenChange={setShowLeadModal}
        analysisId={id!}
        illegalCount={result.illegal_clauses}
        suspiciousCount={result.suspicious_clauses}
      />

      <PaymentPlaceholder
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        analysisId={id!}
      />
    </>
  );
};

export default FreeResultPreview;

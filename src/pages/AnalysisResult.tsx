import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Download, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert,
  Info,
  Scale,
  Lightbulb,
  MapPin,
  Building2,
  User
} from "lucide-react";

interface LegalReference {
  article?: string | null;
  law?: string | null;
  full_citation?: string | null;
  verified?: boolean;
  verification_note?: string;
}

interface Clause {
  text?: string;
  title?: string;
  category?: string;
  original_text?: string;
  type: "valid" | "suspicious" | "illegal";
  risk_level?: number;
  explanation: string;
  legalReference?: string;
  legal_reference?: LegalReference;
  recommendation?: string;
  negotiation_tip?: string;
}

interface ContractMetadata {
  detected_territory?: string | null;
  contract_type?: string;
  landlord_type?: string;
  estimated_risk_score?: number;
  legal_context_available?: boolean;
  sources_count?: number;
}

interface Summary {
  total_analyzed?: number;
  valid_count?: number;
  suspicious_count?: number;
  illegal_count?: number;
  critical_issues?: string[];
  overall_risk?: "bajo" | "medio" | "alto" | "critico" | string;
  executive_summary?: string;
  recommendation?: "firmar" | "negociar_antes_de_firmar" | "no_firmar" | "consultar_abogado" | string;
  legal_disclaimer?: string;
}

interface FullReport {
  clauses: Clause[];
  overall_assessment?: string;
  generated_letter?: string;
  contract_metadata?: ContractMetadata;
  summary?: Summary;
}

interface AnalysisData {
  id: string;
  contract_id: string;
  total_clauses: number;
  valid_clauses: number;
  suspicious_clauses: number;
  illegal_clauses: number;
  summary: string;
  full_report: FullReport;
  created_at: string;
  contracts: {
    file_name: string;
  };
}

const AnalysisResult = () => {
  const { id } = useParams<{ id: string }>();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("analysis_results")
        .select(`
          *,
          contracts (
            file_name
          )
        `)
        .eq("contract_id", id)
        .single();

      if (error) {
        setError("No se encontró el análisis");
      } else {
        setAnalysis(data as unknown as AnalysisData);
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [id]);

  const handleDownloadLetter = () => {
    if (!analysis?.full_report?.generated_letter) return;
    
    const fileName = analysis.contracts?.file_name?.replace(/\.pdf$/i, '') || 'contrato';
    const letterContent = analysis.full_report.generated_letter;
    
    const blob = new Blob([letterContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carta-reclamacion-${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getClauseIcon = (type: string) => {
    switch (type) {
      case "valid":
        return <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />;
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />;
      case "illegal":
        return <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getClauseBadge = (type: string) => {
    switch (type) {
      case "valid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Válida</Badge>;
      case "suspicious":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Sospechosa</Badge>;
      case "illegal":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ilegal</Badge>;
      default:
        return null;
    }
  };

  const getRiskBadge = (level: number | undefined) => {
    if (!level) return null;
    
    if (level <= 3) {
      return <Badge variant="outline" className="border-green-500 text-green-700">Riesgo {level}/10</Badge>;
    } else if (level <= 6) {
      return <Badge variant="outline" className="border-amber-500 text-amber-700">Riesgo {level}/10</Badge>;
    } else if (level <= 8) {
      return <Badge variant="outline" className="border-orange-500 text-orange-700">Riesgo {level}/10</Badge>;
    } else {
      return <Badge variant="outline" className="border-red-500 text-red-700">Riesgo {level}/10</Badge>;
    }
  };

  const getOverallRiskColor = (risk: string | undefined) => {
    switch (risk) {
      case "bajo": return "text-green-600";
      case "medio": return "text-amber-600";
      case "alto": return "text-orange-600";
      case "critico": return "text-red-600";
      default: return "text-muted-foreground";
    }
  };

  const getRecommendationBadge = (rec: string | undefined) => {
    switch (rec) {
      case "firmar":
        return <Badge className="bg-green-500 text-white">✓ Seguro para firmar</Badge>;
      case "negociar_antes_de_firmar":
        return <Badge className="bg-amber-500 text-white">⚠ Negociar antes de firmar</Badge>;
      case "no_firmar":
        return <Badge className="bg-red-500 text-white">✗ No firmar</Badge>;
      case "consultar_abogado":
        return <Badge className="bg-blue-500 text-white">⚖ Consultar abogado</Badge>;
      default:
        return null;
    }
  };

  const getVerificationIcon = (verified: boolean | undefined) => {
    if (verified === true) {
      return <ShieldCheck className="h-4 w-4 text-green-600" />;
    }
    return <ShieldAlert className="h-4 w-4 text-amber-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">{error}</p>
            <Button asChild className="mt-4">
              <Link to="/dashboard">Volver al panel</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const clauses = analysis.full_report?.clauses || [];
  const metadata = analysis.full_report?.contract_metadata;
  const summary = analysis.full_report?.summary;
  const riskScore = metadata?.estimated_risk_score || summary?.overall_risk;

  // Sort clauses by risk level (highest first)
  const sortedClauses = [...clauses].sort((a, b) => (b.risk_level || 0) - (a.risk_level || 0));

  return (
    <>
      <Helmet>
        <title>Resultado del Análisis | ACROXIA</title>
        <meta name="description" content="Resultado detallado del análisis de tu contrato de alquiler." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 bg-muted pt-28 pb-12">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                  <h1 className="font-serif text-3xl font-semibold text-charcoal">
                    Resultado del análisis
                  </h1>
                  <p className="text-charcoal/70 mt-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {analysis.contracts?.file_name}
                  </p>
                </div>
                {analysis.full_report?.generated_letter && (
                  <Button onClick={handleDownloadLetter}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar carta de reclamación
                  </Button>
                )}
              </div>
            </FadeIn>

            {/* Contract Metadata */}
            {metadata && (
              <FadeIn delay={0.05}>
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-center text-sm">
                      {metadata.detected_territory && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{metadata.detected_territory}</span>
                        </div>
                      )}
                      {metadata.contract_type && metadata.contract_type !== "desconocido" && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="capitalize">{metadata.contract_type.replace(/_/g, " ")}</span>
                        </div>
                      )}
                      {metadata.landlord_type && metadata.landlord_type !== "desconocido" && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {metadata.landlord_type === "persona_juridica" ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <span className="capitalize">{metadata.landlord_type.replace(/_/g, " ")}</span>
                        </div>
                      )}
                      {metadata.legal_context_available !== undefined && (
                        <div className="flex items-center gap-2">
                          {metadata.legal_context_available ? (
                            <Badge variant="outline" className="border-green-500 text-green-700">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              {metadata.sources_count || 0} fuentes legales
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-500 text-amber-700">
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Base de datos en expansión
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Risk Score */}
            {typeof riskScore === 'number' && (
              <FadeIn delay={0.08}>
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Puntuación de riesgo global
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${
                          riskScore <= 3 ? "text-green-600" :
                          riskScore <= 6 ? "text-amber-600" :
                          riskScore <= 8 ? "text-orange-600" : "text-red-600"
                        }`}>
                          {riskScore}/10
                        </span>
                        {summary?.recommendation && getRecommendationBadge(summary.recommendation)}
                      </div>
                      <Progress 
                        value={riskScore * 10} 
                        className={`h-2 ${
                          riskScore <= 3 ? "[&>div]:bg-green-500" :
                          riskScore <= 6 ? "[&>div]:bg-amber-500" :
                          riskScore <= 8 ? "[&>div]:bg-orange-500" : "[&>div]:bg-red-500"
                        }`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            )}

            {/* Clause counts */}
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              <FadeIn delay={0.1}>
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Cláusulas válidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-700">{analysis.valid_clauses}</div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.15}>
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Cláusulas sospechosas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-700">{analysis.suspicious_clauses}</div>
                  </CardContent>
                </Card>
              </FadeIn>

              <FadeIn delay={0.2}>
                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Cláusulas ilegales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-700">{analysis.illegal_clauses}</div>
                  </CardContent>
                </Card>
              </FadeIn>
            </div>

            {/* Critical Issues Alert */}
            {summary?.critical_issues && summary.critical_issues.length > 0 && (
              <FadeIn delay={0.22}>
                <Alert variant="destructive" className="mb-8">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Problemas críticos detectados</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2 space-y-1">
                      {summary.critical_issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </FadeIn>
            )}

            {/* Summary */}
            <FadeIn delay={0.25}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Resumen del análisis</span>
                    {summary?.overall_risk && (
                      <span className={`text-sm font-medium ${getOverallRiskColor(summary.overall_risk)}`}>
                        Riesgo {summary.overall_risk}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-charcoal/80 leading-relaxed">
                    {summary?.executive_summary || analysis.summary || analysis.full_report?.overall_assessment}
                  </p>
                  
                  {summary?.legal_disclaimer && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{summary.legal_disclaimer}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </FadeIn>

            {/* Clauses Detail */}
            <FadeIn delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de cláusulas</CardTitle>
                  <CardDescription>
                    Análisis individual de cada cláusula del contrato (ordenadas por nivel de riesgo)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-4">
                    {sortedClauses.map((clause, index) => (
                      <AccordionItem
                        key={index}
                        value={`clause-${index}`}
                        className={`
                          border rounded-lg px-4
                          ${clause.type === "valid" ? "border-green-200 bg-green-50/30" : ""}
                          ${clause.type === "suspicious" ? "border-amber-200 bg-amber-50/30" : ""}
                          ${clause.type === "illegal" ? "border-red-200 bg-red-50/30" : ""}
                        `}
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3 text-left flex-1 min-w-0">
                            {getClauseIcon(clause.type)}
                            <div className="flex-1 min-w-0">
                              <span className="font-medium line-clamp-1">
                                {clause.title || clause.text}
                              </span>
                              {clause.category && (
                                <span className="text-xs text-muted-foreground block">
                                  {clause.category}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getRiskBadge(clause.risk_level)}
                              {getClauseBadge(clause.type)}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 space-y-4">
                          {/* Original text from contract */}
                          {clause.original_text && (
                            <div>
                              <h4 className="font-medium mb-1 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Texto del contrato
                              </h4>
                              <p className="text-charcoal/70 bg-muted p-3 rounded-md italic text-sm">
                                "{clause.original_text}"
                              </p>
                            </div>
                          )}

                          {/* Explanation */}
                          <div>
                            <h4 className="font-medium mb-1">Explicación</h4>
                            <p className="text-charcoal/70">{clause.explanation}</p>
                          </div>
                          
                          {/* Legal Reference - Enhanced */}
                          {(clause.legal_reference || clause.legalReference) && (
                            <div>
                              <h4 className="font-medium mb-1 flex items-center gap-2">
                                <Scale className="h-4 w-4" />
                                Referencia legal
                                {clause.legal_reference && getVerificationIcon(clause.legal_reference.verified)}
                              </h4>
                              <div className="bg-muted p-3 rounded-md space-y-1">
                                <p className="text-charcoal/70 font-mono text-sm">
                                  {clause.legal_reference?.full_citation || clause.legalReference}
                                </p>
                                {clause.legal_reference?.verified === false && clause.legal_reference.verification_note && (
                                  <p className="text-xs text-amber-600 flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    {clause.legal_reference.verification_note}
                                  </p>
                                )}
                                {clause.legal_reference?.verified === true && (
                                  <p className="text-xs text-green-600 flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Verificado en base de datos ACROXIA
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Recommendation */}
                          {clause.recommendation && (
                            <div>
                              <h4 className="font-medium mb-1">Recomendación</h4>
                              <p className="text-charcoal/70">{clause.recommendation}</p>
                            </div>
                          )}

                          {/* Negotiation Tip */}
                          {clause.negotiation_tip && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                              <h4 className="font-medium mb-1 flex items-center gap-2 text-blue-800">
                                <Lightbulb className="h-4 w-4" />
                                Consejo de negociación
                              </h4>
                              <p className="text-blue-700 text-sm">{clause.negotiation_tip}</p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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

export default AnalysisResult;

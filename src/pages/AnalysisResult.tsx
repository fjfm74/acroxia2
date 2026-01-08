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
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, FileText, Download, Loader2 } from "lucide-react";

interface Clause {
  text: string;
  type: "valid" | "suspicious" | "illegal";
  explanation: string;
  legalReference?: string;
  recommendation?: string;
}

interface AnalysisData {
  id: string;
  contract_id: string;
  total_clauses: number;
  valid_clauses: number;
  suspicious_clauses: number;
  illegal_clauses: number;
  summary: string;
  full_report: {
    clauses: Clause[];
    overall_assessment: string;
    generated_letter?: string;
  };
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

  const getClauseIcon = (type: string) => {
    switch (type) {
      case "valid":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case "illegal":
        return <XCircle className="h-5 w-5 text-red-600" />;
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
                  <Button>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar carta de reclamación
                  </Button>
                )}
              </div>
            </FadeIn>

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

            <FadeIn delay={0.25}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Resumen del análisis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-charcoal/80 leading-relaxed">
                    {analysis.summary || analysis.full_report?.overall_assessment}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>

            <FadeIn delay={0.3}>
              <Card>
                <CardHeader>
                  <CardTitle>Detalle de cláusulas</CardTitle>
                  <CardDescription>
                    Análisis individual de cada cláusula del contrato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-4">
                    {clauses.map((clause, index) => (
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
                          <div className="flex items-center gap-3 text-left">
                            {getClauseIcon(clause.type)}
                            <span className="font-medium line-clamp-1">{clause.text}</span>
                            {getClauseBadge(clause.type)}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 space-y-4">
                          <div>
                            <h4 className="font-medium mb-1">Explicación</h4>
                            <p className="text-charcoal/70">{clause.explanation}</p>
                          </div>
                          
                          {clause.legalReference && (
                            <div>
                              <h4 className="font-medium mb-1">Referencia legal</h4>
                              <p className="text-charcoal/70 bg-muted p-3 rounded-md font-mono text-sm">
                                {clause.legalReference}
                              </p>
                            </div>
                          )}
                          
                          {clause.recommendation && (
                            <div>
                              <h4 className="font-medium mb-1">Recomendación</h4>
                              <p className="text-charcoal/70">{clause.recommendation}</p>
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

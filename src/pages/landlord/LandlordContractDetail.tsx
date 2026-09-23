import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import LandlordLayout from "@/components/landlord/LandlordLayout";
import FadeIn from "@/components/animations/FadeIn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, FileText, Loader2, Copy, Scale, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { normalizeClauseType } from "@/lib/clauseType";

interface Clause {
  title?: string;
  category?: string;
  type: string;
  original_text?: string;
  explanation?: string;
  legal_reference?: { full_citation?: string | null } | null;
  recommendation?: string;
  negotiation_tip?: string;
}

interface Analysis {
  clauses?: Clause[];
  summary?: {
    total_analyzed?: number;
    valid_count?: number;
    suspicious_count?: number;
    illegal_count?: number;
    overall_risk?: string;
    executive_summary?: string;
  };
  contract_metadata?: { estimated_risk_score?: number };
  generated_letter?: string;
  generated_email?: string;
}

interface LandlordContract {
  id: string;
  file_name: string;
  property_address: string | null;
  tenant_name: string | null;
  monthly_rent: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  analysis_result: unknown;
}

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-ES") : "—");

const iconFor = (t: string) => {
  switch (normalizeClauseType(t)) {
    case "valid":
      return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />;
    case "suspicious":
      return <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />;
    case "illegal":
      return <XCircle className="h-5 w-5 text-red-600 shrink-0" />;
    default:
      return <FileText className="h-5 w-5 text-muted-foreground shrink-0" />;
  }
};

const badgeFor = (t: string) => {
  switch (normalizeClauseType(t)) {
    case "valid":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Válida</Badge>;
    case "suspicious":
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Sospechosa</Badge>;
    case "illegal":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Ilegal</Badge>;
    default:
      return <Badge variant="outline">Sin clasificar</Badge>;
  }
};

const borderFor = (t: string) => {
  switch (normalizeClauseType(t)) {
    case "valid":
      return "border-green-200 bg-green-50/30";
    case "suspicious":
      return "border-amber-200 bg-amber-50/30";
    case "illegal":
      return "border-red-200 bg-red-50/30";
    default:
      return "";
  }
};

const LandlordContractDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<LandlordContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("landlord_contracts")
        .select("id, file_name, property_address, tenant_name, monthly_rent, start_date, end_date, status, analysis_result")
        .eq("id", id)
        .maybeSingle();
      if (error) console.error(error);
      setContract(data as LandlordContract | null);
      setLoading(false);
    };
    load();
  }, [id]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Texto copiado");
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const analysis = (contract?.analysis_result as Analysis | null) || null;
  const clauses = analysis?.clauses || [];
  const counts = clauses.reduce(
    (acc, c) => {
      const n = normalizeClauseType(c.type);
      if (n !== "unknown") acc[n]++;
      return acc;
    },
    { valid: 0, suspicious: 0, illegal: 0 },
  );
  const communication = analysis?.generated_email?.trim() || analysis?.generated_letter?.trim() || "";

  return (
    <>
      <Helmet>
        <title>Detalle del contrato | Panel Propietario | ContratoAlquiler</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <LandlordLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" asChild>
            <Link to="/propietario/contratos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Mis contratos
            </Link>
          </Button>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !contract ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Contrato no encontrado.</CardContent>
            </Card>
          ) : (
            <>
              <FadeIn>
                <div>
                  <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground">
                    Informe para el propietario
                  </h1>
                  <p className="text-muted-foreground mt-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {contract.file_name}
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <Card>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Inmueble: </span>
                      {contract.property_address || "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inquilino: </span>
                      {contract.tenant_name || "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Renta: </span>
                      {contract.monthly_rent ? `${contract.monthly_rent} €/mes` : "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vigencia: </span>
                      {fmtDate(contract.start_date)} – {fmtDate(contract.end_date)}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>

              {!analysis ? (
                <FadeIn delay={0.2}>
                  <Card>
                    <CardContent className="py-12 text-center space-y-4">
                      <p className="text-muted-foreground">Análisis pendiente o fallido</p>
                      <Button asChild className="rounded-full">
                        <Link to="/propietario/analizar">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Volver a analizar
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </FadeIn>
              ) : (
                <>
                  <FadeIn delay={0.2}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {[
                        { label: "Total", value: analysis.summary?.total_analyzed ?? clauses.length, cls: "text-foreground" },
                        { label: "Válidas", value: counts.valid, cls: "text-green-700" },
                        { label: "Sospechosas", value: counts.suspicious, cls: "text-amber-700" },
                        { label: "Ilegales", value: counts.illegal, cls: "text-red-700" },
                        { label: "Riesgo", value: analysis.summary?.overall_risk ?? "—", cls: "text-foreground capitalize" },
                        {
                          label: "Puntuación",
                          value: analysis.contract_metadata?.estimated_risk_score ?? "—",
                          cls: "text-foreground",
                        },
                      ].map((s) => (
                        <Card key={s.label}>
                          <CardContent className="py-5 text-center">
                            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
                            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </FadeIn>

                  {analysis.summary?.executive_summary && (
                    <FadeIn delay={0.25}>
                      <Card>
                        <CardHeader>
                          <CardTitle className="font-serif text-xl">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm leading-relaxed whitespace-pre-line">
                          {analysis.summary.executive_summary}
                        </CardContent>
                      </Card>
                    </FadeIn>
                  )}

                  <div className="space-y-4">
                    <h2 className="font-serif text-2xl font-medium">Cláusulas</h2>
                    {clauses.map((c, i) => (
                      <FadeIn key={i} delay={Math.min(i * 0.05, 0.4)}>
                        <Card className={`border ${borderFor(c.type)}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              {iconFor(c.type)}
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base">{c.title || c.category || `Cláusula ${i + 1}`}</CardTitle>
                              </div>
                              {badgeFor(c.type)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {c.original_text && (
                              <blockquote className="border-l-2 border-border pl-3 italic text-muted-foreground">
                                {c.original_text}
                              </blockquote>
                            )}
                            {c.explanation && <p>{c.explanation}</p>}
                            {c.legal_reference?.full_citation && (
                              <p className="flex items-center gap-2 text-muted-foreground">
                                <Scale className="h-4 w-4" />
                                {c.legal_reference.full_citation}
                              </p>
                            )}
                            {c.recommendation && (
                              <p>
                                <strong>Recomendación: </strong>
                                {c.recommendation}
                              </p>
                            )}
                            {c.negotiation_tip && (
                              <p>
                                <strong>Consejo: </strong>
                                {c.negotiation_tip}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </FadeIn>
                    ))}
                  </div>

                  {communication && (
                    <FadeIn>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                          <div>
                            <CardTitle className="font-serif text-xl">Comunicación al inquilino</CardTitle>
                            <CardDescription>Borrador listo para revisar y enviar</CardDescription>
                          </div>
                          <Button variant="outline" size="sm" className="rounded-full" onClick={() => copy(communication)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap font-sans text-sm bg-muted p-4 rounded-lg max-h-96 overflow-auto">
                            {communication}
                          </pre>
                        </CardContent>
                      </Card>
                    </FadeIn>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </LandlordLayout>
    </>
  );
};

export default LandlordContractDetail;

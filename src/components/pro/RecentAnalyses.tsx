import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Download, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Analysis {
  id: string;
  fileName: string;
  clientName: string | null;
  propertyAddress: string | null;
  createdAt: string;
  status: "completed" | "processing" | "failed" | "pending";
  totalClauses: number;
  illegalClauses: number;
  suspiciousClauses: number;
}

interface RecentAnalysesProps {
  analyses: Analysis[];
  compact?: boolean;
}

const getStatusBadge = (status: string, illegal: number, suspicious: number) => {
  if (status !== "completed") {
    const statusMap: Record<string, { label: string; className: string }> = {
      processing: { label: "Procesando", className: "bg-blue-100 text-blue-700" },
      failed: { label: "Error", className: "bg-red-100 text-red-700" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  }

  if (illegal > 0) {
    return <Badge className="bg-red-100 text-red-700">Crítico</Badge>;
  }
  if (suspicious > 0) {
    return <Badge className="bg-amber-100 text-amber-700">Revisar</Badge>;
  }
  return <Badge className="bg-green-100 text-green-700">OK</Badge>;
};

const RecentAnalyses = ({ analyses, compact = false }: RecentAnalysesProps) => {
  const displayAnalyses = compact ? analyses.slice(0, 5) : analyses;

  return (
    <Card className="bg-background rounded-2xl shadow-lg border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-medium text-foreground">
          Análisis recientes
        </CardTitle>
        {compact && analyses.length > 5 && (
          <Link to="/pro/analisis">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Ver todos
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {displayAnalyses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aún no has analizado ningún contrato</p>
            <Link to="/analizar">
              <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90 rounded-full">
                Analizar contrato
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                    <FileText className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {analysis.clientName || analysis.fileName}
                      </p>
                      {getStatusBadge(
                        analysis.status,
                        analysis.illegalClauses,
                        analysis.suspiciousClauses
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {analysis.propertyAddress || analysis.fileName}
                      {" · "}
                      {format(new Date(analysis.createdAt), "d MMM yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {analysis.status === "completed" && (
                    <>
                      <Link to={`/resultado/${analysis.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentAnalyses;

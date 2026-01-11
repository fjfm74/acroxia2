import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsProfessional } from "@/hooks/useIsProfessional";
import { supabase } from "@/integrations/supabase/client";
import ProLayout from "@/components/pro/ProLayout";
import ProStatsCard from "@/components/pro/ProStatsCard";
import ActivityChart from "@/components/pro/ActivityChart";
import ClientList from "@/components/pro/ClientList";
import ClientForm from "@/components/pro/ClientForm";
import RecentAnalyses from "@/components/pro/RecentAnalyses";
import QuickActions from "@/components/pro/QuickActions";
import OnboardingWizard from "@/components/pro/OnboardingWizard";
import FadeIn from "@/components/animations/FadeIn";
import { FileSearch, Users, AlertTriangle, CreditCard, Building2 } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contractCount: number;
}

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

interface Stats {
  analysesThisMonth: number;
  analysesPrevMonth: number;
  activeClients: number;
  problemsDetected: number;
  credits: number;
}

const DashboardPro = () => {
  const { profile } = useAuth();
  const { organization, loading: proLoading } = useIsProfessional();
  const [clients, setClients] = useState<Client[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [stats, setStats] = useState<Stats>({
    analysesThisMonth: 0,
    analysesPrevMonth: 0,
    activeClients: 0,
    problemsDetected: 0,
    credits: 0,
  });
  const [chartData, setChartData] = useState<Array<{ date: string; analyses: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const fetchData = async () => {
    if (!organization) {
      setNeedsOnboarding(true);
      setLoading(false);
      return;
    }

    setNeedsOnboarding(false);

    try {
      // Fetch clients with contract count
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      // Fetch contracts for this organization
      const { data: contractsData } = await supabase
        .from("contracts")
        .select(`
          id,
          file_name,
          created_at,
          status,
          property_address,
          client_id,
          clients(name),
          analysis_results(total_clauses, illegal_clauses, suspicious_clauses)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      // Process clients with contract count
      const clientsWithCounts = (clientsData || []).map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        contractCount: contractsData?.filter((c) => c.client_id === client.id).length || 0,
      }));
      setClients(clientsWithCounts);

      // Process analyses
      const processedAnalyses: Analysis[] = (contractsData || []).map((contract: any) => ({
        id: contract.id,
        fileName: contract.file_name,
        clientName: contract.clients?.name || null,
        propertyAddress: contract.property_address,
        createdAt: contract.created_at,
        status: contract.status,
        totalClauses: contract.analysis_results?.[0]?.total_clauses || 0,
        illegalClauses: contract.analysis_results?.[0]?.illegal_clauses || 0,
        suspiciousClauses: contract.analysis_results?.[0]?.suspicious_clauses || 0,
      }));
      setAnalyses(processedAnalyses);

      // Calculate stats
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const prevMonthStart = startOfMonth(subDays(thisMonthStart, 1));
      const prevMonthEnd = endOfMonth(subDays(thisMonthStart, 1));

      const analysesThisMonth = processedAnalyses.filter(
        (a) => new Date(a.createdAt) >= thisMonthStart
      ).length;

      const analysesPrevMonth = processedAnalyses.filter((a) => {
        const date = new Date(a.createdAt);
        return date >= prevMonthStart && date <= prevMonthEnd;
      }).length;

      const problemsDetected = processedAnalyses.reduce(
        (sum, a) => sum + a.illegalClauses + a.suspiciousClauses,
        0
      );

      setStats({
        analysesThisMonth,
        analysesPrevMonth,
        activeClients: clientsWithCounts.filter((c) => c.contractCount > 0).length,
        problemsDetected,
        credits: profile?.credits || 0,
      });

      // Prepare chart data (last 14 days)
      const last14Days = eachDayOfInterval({
        start: subDays(now, 13),
        end: now,
      });

      const chartDataProcessed = last14Days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const count = processedAnalyses.filter(
          (a) => format(new Date(a.createdAt), "yyyy-MM-dd") === dayStr
        ).length;
        return {
          date: format(day, "dd MMM", { locale: es }),
          analyses: count,
        };
      });
      setChartData(chartDataProcessed);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!proLoading) {
      fetchData();
    }
  }, [organization, proLoading, profile]);

  const handleClientAdded = () => {
    fetchData();
  };

  if (proLoading || loading) {
    return (
      <ProLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </ProLayout>
    );
  }

  if (needsOnboarding) {
    return (
      <ProLayout>
        <OnboardingWizard onComplete={fetchData} />
      </ProLayout>
    );
  }

  const trendPercentage =
    stats.analysesPrevMonth > 0
      ? Math.round(
          ((stats.analysesThisMonth - stats.analysesPrevMonth) /
            stats.analysesPrevMonth) *
            100
        )
      : stats.analysesThisMonth > 0
      ? 100
      : 0;

  return (
    <ProLayout>
      {/* Header with company name */}
      <FadeIn>
        <div className="flex items-center gap-4 mb-8">
          {organization?.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-14 w-14 rounded-xl object-contain bg-background shadow-md"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-background shadow-md flex items-center justify-center">
              <Building2 className="h-7 w-7 text-foreground" />
            </div>
          )}
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
              {organization?.name}
            </h1>
            <p className="text-muted-foreground text-sm">Panel profesional</p>
          </div>
        </div>
      </FadeIn>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <FadeIn delay={0.1}>
          <ProStatsCard
            title="Análisis este mes"
            value={stats.analysesThisMonth}
            icon={FileSearch}
            trend={
              trendPercentage !== 0
                ? { value: Math.abs(trendPercentage), isPositive: trendPercentage > 0 }
                : undefined
            }
            subtitle="vs. mes anterior"
          />
        </FadeIn>
        <FadeIn delay={0.2}>
          <ProStatsCard
            title="Clientes activos"
            value={stats.activeClients}
            icon={Users}
            subtitle={`de ${clients.length} totales`}
          />
        </FadeIn>
        <FadeIn delay={0.3}>
          <ProStatsCard
            title="Problemas detectados"
            value={stats.problemsDetected}
            icon={AlertTriangle}
            subtitle="cláusulas ilegales o sospechosas"
          />
        </FadeIn>
        <FadeIn delay={0.4}>
          <ProStatsCard
            title="Créditos disponibles"
            value={stats.credits}
            icon={CreditCard}
            subtitle="análisis restantes"
          />
        </FadeIn>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          <FadeIn delay={0.5}>
            <ActivityChart data={chartData} title="Actividad (últimos 14 días)" />
          </FadeIn>
          <FadeIn delay={0.6}>
            <RecentAnalyses analyses={analyses} compact />
          </FadeIn>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          <FadeIn delay={0.7}>
            <QuickActions />
          </FadeIn>
          <FadeIn delay={0.8}>
            <ClientList
              clients={clients}
              onAddClient={() => setClientFormOpen(true)}
              compact
            />
          </FadeIn>
        </div>
      </div>

      {/* Client Form Modal */}
      {organization && (
        <ClientForm
          open={clientFormOpen}
          onOpenChange={setClientFormOpen}
          organizationId={organization.id}
          onSuccess={handleClientAdded}
        />
      )}
    </ProLayout>
  );
};

export default DashboardPro;

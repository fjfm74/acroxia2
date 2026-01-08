import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { FileText, FolderOpen, Users, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalDocuments: number;
  totalAdmins: number;
  totalContracts: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalPosts: 0,
    publishedPosts: 0,
    draftPosts: 0,
    totalDocuments: 0,
    totalAdmins: 0,
    totalContracts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch blog posts stats
        const { data: posts } = await supabase
          .from("blog_posts")
          .select("status");

        const publishedPosts = posts?.filter(p => p.status === "published").length || 0;
        const draftPosts = posts?.filter(p => p.status === "draft").length || 0;

        // Fetch legal documents count
        const { count: docsCount } = await supabase
          .from("legal_documents")
          .select("*", { count: "exact", head: true });

        // Fetch admin users count
        const { count: adminsCount } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");

        // Fetch total contracts analyzed
        const { count: contractsCount } = await supabase
          .from("contracts")
          .select("*", { count: "exact", head: true });

        setStats({
          totalPosts: (posts?.length || 0),
          publishedPosts,
          draftPosts,
          totalDocuments: docsCount || 0,
          totalAdmins: adminsCount || 0,
          totalContracts: contractsCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Posts Publicados",
      value: stats.publishedPosts,
      subtitle: `${stats.draftPosts} borradores`,
      icon: FileText,
    },
    {
      title: "Documentos Legales",
      value: stats.totalDocuments,
      subtitle: "En base de conocimiento",
      icon: FolderOpen,
    },
    {
      title: "Contratos Analizados",
      value: stats.totalContracts,
      subtitle: "Total histórico",
      icon: TrendingUp,
    },
    {
      title: "Administradores",
      value: stats.totalAdmins,
      subtitle: "Usuarios con acceso",
      icon: Users,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard Admin | ACROXIA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <AdminLayout 
        title="Dashboard" 
        description="Resumen general del sistema"
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  <>
                    <div className="text-3xl font-semibold font-serif">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-serif">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="/admin/blog/nuevo" 
                className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="font-medium">Crear nuevo post con IA</div>
                <div className="text-sm text-muted-foreground">Genera contenido automáticamente</div>
              </a>
              <a 
                href="/admin/documentos" 
                className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <div className="font-medium">Subir documento legal</div>
                <div className="text-sm text-muted-foreground">Amplía la base de conocimiento</div>
              </a>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="font-serif">Sistema RAG</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                La base de conocimiento legal permite que la IA proporcione análisis más precisos 
                citando artículos específicos de la legislación vigente.
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-semibold font-serif">{stats.totalDocuments}</div>
                <div className="text-sm text-muted-foreground">documentos indexados</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminDashboard;

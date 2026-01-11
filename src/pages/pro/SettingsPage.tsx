import { useIsProfessional } from "@/hooks/useIsProfessional";
import ProLayout from "@/components/pro/ProLayout";
import BrandSettings from "@/components/pro/BrandSettings";
import FadeIn from "@/components/animations/FadeIn";

const SettingsPage = () => {
  const { organization, loading } = useIsProfessional();

  const handleUpdate = () => {
    // Refresh will happen automatically via the hook
    window.location.reload();
  };

  if (loading) {
    return (
      <ProLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </ProLayout>
    );
  }

  if (!organization) {
    return (
      <ProLayout>
        <div className="text-center py-12 text-muted-foreground">
          No se encontró la organización
        </div>
      </ProLayout>
    );
  }

  return (
    <ProLayout
      title="Configuración"
      subtitle="Personaliza la marca y datos de tu empresa"
    >
      <FadeIn>
        <div className="max-w-2xl">
          <BrandSettings organization={organization} onUpdate={handleUpdate} />
        </div>
      </FadeIn>
    </ProLayout>
  );
};

export default SettingsPage;

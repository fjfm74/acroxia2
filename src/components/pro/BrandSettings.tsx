import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Upload, Palette } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
}

interface BrandSettingsProps {
  organization: Organization;
  onUpdate: () => void;
}

const BrandSettings = ({ organization, onUpdate }: BrandSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    primary_color: organization.primary_color,
    phone: organization.phone || "",
    email: organization.email || "",
    website: organization.website || "",
    address: organization.address || "",
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, sube una imagen");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${organization.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ logo_url: publicUrlData.publicUrl })
        .eq("id", organization.id);

      if (updateError) throw updateError;

      toast.success("Logo actualizado correctamente");
      onUpdate();
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Error al subir el logo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: formData.name.trim(),
          primary_color: formData.primary_color,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          website: formData.website.trim() || null,
          address: formData.address.trim() || null,
        })
        .eq("id", organization.id);

      if (error) throw error;

      toast.success("Configuración guardada correctamente");
      onUpdate();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <Card className="bg-background rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Logo de empresa
          </CardTitle>
          <CardDescription>
            Este logo aparecerá en los informes PDF de tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt="Logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <label htmlFor="logo-upload">
                <Button
                  variant="outline"
                  disabled={uploading}
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Subiendo..." : "Subir logo"}
                  </span>
                </Button>
              </label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                PNG o JPG, máximo 2MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Settings */}
      <Card className="bg-background rounded-2xl shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Información de empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la empresa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary_color">Color principal</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="contacto@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+34 900 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Web</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://www.empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Calle, Ciudad"
                />
              </div>
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-full"
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandSettings;

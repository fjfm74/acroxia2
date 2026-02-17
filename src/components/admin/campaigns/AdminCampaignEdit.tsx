import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CAMPAIGN_TEMPLATES, getTemplatesByAudience, wrapInBaseTemplate } from "@/utils/campaignTemplates";
import CampaignMetrics from "./CampaignMetrics";
import { ArrowLeft, Send, Eye, Save, Clock, Users } from "lucide-react";

interface CampaignData {
  id?: string;
  name: string;
  subject: string;
  html_content: string;
  target_audience: string;
  target_segment: string | null;
  status: string;
  scheduled_for: string | null;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
}

const AUDIENCES = [
  { value: "inquilino", label: "Inquilinos" },
  { value: "propietario", label: "Propietarios" },
  { value: "profesional", label: "Profesionales" },
  { value: "all", label: "Todos" },
];

const SEGMENTS = [
  { value: "__none__", label: "Todos los segmentos" },
  { value: "gestoria", label: "Gestorías" },
  { value: "inmobiliaria", label: "Inmobiliarias" },
  { value: "abogado", label: "Abogados" },
  { value: "administrador_fincas", label: "Administradores de fincas" },
  { value: "otro", label: "Otro" },
];

interface AdminCampaignEditProps {
  campaignId?: string;
  onBack: () => void;
}

const AdminCampaignEdit = ({ campaignId, onBack }: AdminCampaignEditProps) => {
  const [campaign, setCampaign] = useState<CampaignData>({
    name: "",
    subject: "",
    html_content: "",
    target_audience: "profesional",
    target_segment: null,
    status: "draft",
    scheduled_for: null,
    total_recipients: 0,
    total_sent: 0,
    total_opened: 0,
    total_clicked: 0,
    total_bounced: 0,
  });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [estimatedRecipients, setEstimatedRecipients] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (campaignId) loadCampaign(campaignId);
  }, [campaignId]);

  useEffect(() => {
    countRecipients();
  }, [campaign.target_audience, campaign.target_segment]);

  const loadCampaign = async (id: string) => {
    const { data, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setCampaign({
        id: data.id,
        name: data.name,
        subject: data.subject,
        html_content: data.html_content,
        target_audience: data.target_audience,
        target_segment: data.target_segment,
        status: data.status,
        scheduled_for: data.scheduled_for,
        total_recipients: data.total_recipients,
        total_sent: data.total_sent,
        total_opened: data.total_opened,
        total_clicked: data.total_clicked,
        total_bounced: data.total_bounced,
      });
    }
  };

  const countRecipients = async () => {
    const recipients = new Set<string>();
    const audience = campaign.target_audience;
    const segment = campaign.target_segment;

    try {
      if (audience === "inquilino" || audience === "all") {
        const { data: subs } = await supabase
          .from("blog_subscribers")
          .select("email")
          .eq("audience", "inquilino")
          .eq("confirmed", true)
          .eq("unsubscribed", false);
        subs?.forEach((s) => recipients.add(s.email.toLowerCase()));
      }

      if (audience === "propietario" || audience === "all") {
        const { data: subs } = await supabase
          .from("blog_subscribers")
          .select("email")
          .eq("audience", "propietario")
          .eq("confirmed", true)
          .eq("unsubscribed", false);
        subs?.forEach((s) => recipients.add(s.email.toLowerCase()));
      }

      if (audience === "profesional" || audience === "all") {
        let query = supabase
          .from("marketing_contacts")
          .select("email")
          .eq("unsubscribed", false);

        if (segment && segment !== "__none__") {
          query = query.eq("segment", segment);
        }

        let from = 0;
        while (true) {
          const { data } = await query.range(from, from + 999);
          if (!data || data.length === 0) break;
          data.forEach((c) => recipients.add(c.email.toLowerCase()));
          if (data.length < 1000) break;
          from += 1000;
        }
      }

      setEstimatedRecipients(recipients.size);
    } catch {
      setEstimatedRecipients(null);
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = CAMPAIGN_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setCampaign((prev) => ({
      ...prev,
      subject: template.subject,
      html_content: wrapInBaseTemplate(template.htmlContent),
      name: prev.name || template.name,
    }));
  };

  const saveCampaign = async () => {
    if (!campaign.name || !campaign.subject) {
      toast({ title: "Campos requeridos", description: "Nombre y asunto son obligatorios", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: campaign.name,
        subject: campaign.subject,
        html_content: campaign.html_content,
        target_audience: campaign.target_audience,
        target_segment: campaign.target_segment === "__none__" ? null : campaign.target_segment,
        status: campaign.status,
        scheduled_for: campaign.scheduled_for || null,
      };

      if (campaign.id) {
        const { error } = await supabase
          .from("email_campaigns")
          .update(payload)
          .eq("id", campaign.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("email_campaigns")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setCampaign((prev) => ({ ...prev, id: data.id }));
      }

      toast({ title: "Campaña guardada" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendCampaign = async () => {
    let currentId = campaign.id;

    if (!currentId) {
      // Save first and get the ID directly
      if (!campaign.name || !campaign.subject) {
        toast({ title: "Campos requeridos", description: "Nombre y asunto son obligatorios", variant: "destructive" });
        return;
      }

      const payload = {
        name: campaign.name,
        subject: campaign.subject,
        html_content: campaign.html_content,
        target_audience: campaign.target_audience,
        target_segment: campaign.target_segment === "__none__" ? null : campaign.target_segment,
        status: "draft",
        scheduled_for: campaign.scheduled_for || null,
      };

      const { data, error } = await supabase
        .from("email_campaigns")
        .insert(payload)
        .select()
        .single();

      if (error || !data) {
        toast({ title: "Error al guardar", description: error?.message, variant: "destructive" });
        return;
      }

      currentId = data.id;
      setCampaign((prev) => ({ ...prev, id: data.id }));
    }

    if (!currentId) return;

    const confirmed = window.confirm(
      `¿Enviar esta campaña a ${estimatedRecipients ?? "?"} destinatarios? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ campaign_id: currentId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: "Campaña enviada",
        description: `${result.sent} de ${result.total} emails enviados`,
      });

      if (currentId) loadCampaign(currentId);
    } catch (error: any) {
      toast({ title: "Error al enviar", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const availableTemplates = getTemplatesByAudience(campaign.target_audience);
  const isSent = campaign.status === "sent" || campaign.status === "sending";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold">
          {campaignId ? "Editar campaña" : "Nueva campaña"}
        </h2>
      </div>

      {isSent && (
        <CampaignMetrics
          totalRecipients={campaign.total_recipients}
          totalSent={campaign.total_sent}
          totalOpened={campaign.total_opened}
          totalClicked={campaign.total_clicked}
          totalBounced={campaign.total_bounced}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nombre interno</Label>
                <Input
                  value={campaign.name}
                  onChange={(e) => setCampaign((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Primer contacto gestorías Q1"
                  disabled={isSent}
                />
              </div>

              <div>
                <Label>Audiencia</Label>
                <Select
                  value={campaign.target_audience}
                  onValueChange={(v) => setCampaign((p) => ({ ...p, target_audience: v, target_segment: null }))}
                  disabled={isSent}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(campaign.target_audience === "profesional" || campaign.target_audience === "all") && (
                <div>
                  <Label>Segmento B2B</Label>
                  <Select
                    value={campaign.target_segment || "__none__"}
                    onValueChange={(v) => setCampaign((p) => ({ ...p, target_segment: v }))}
                    disabled={isSent}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {estimatedRecipients !== null && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <Users className="h-4 w-4" />
                  <span><strong>{estimatedRecipients.toLocaleString()}</strong> destinatarios estimados</span>
                </div>
              )}

              <div>
                <Label>Plantilla base</Label>
                <Select onValueChange={applyTemplate} disabled={isSent}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plantilla..." /></SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Asunto del email</Label>
                <Input
                  value={campaign.subject}
                  onChange={(e) => setCampaign((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="Asunto del email..."
                  disabled={isSent}
                />
              </div>

              <div>
                <Label>HTML del email</Label>
                <Textarea
                  value={campaign.html_content}
                  onChange={(e) => setCampaign((p) => ({ ...p, html_content: e.target.value }))}
                  className="min-h-[300px] font-mono text-xs"
                  placeholder="Pega o edita el HTML aquí..."
                  disabled={isSent}
                />
              </div>
            </CardContent>
          </Card>

          {!isSent && (
            <div className="flex gap-3">
              <Button onClick={saveCampaign} disabled={saving} variant="outline" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar borrador"}
              </Button>
              <Button onClick={sendCampaign} disabled={sending || !campaign.subject} className="flex-1 rounded-full">
                <Send className="h-4 w-4 mr-2" />
                {sending ? "Enviando..." : "Enviar ahora"}
              </Button>
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <Card className="border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Vista previa</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-1" />
              {showPreview ? "Ocultar" : "Mostrar"}
            </Button>
          </CardHeader>
          <CardContent>
            {showPreview && campaign.html_content ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <iframe
                  srcDoc={campaign.html_content}
                  className="w-full h-[600px]"
                  sandbox="allow-same-origin"
                  title="Email preview"
                />
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
                {campaign.html_content ? "Pulsa 'Mostrar' para ver la vista previa" : "Selecciona una plantilla o escribe HTML para ver la vista previa"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCampaignEdit;

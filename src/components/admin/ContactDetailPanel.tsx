import { useState, useEffect } from "react";
import { X, User, Mail, Phone, Calendar, Building2, Tag, FileText, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactSourceBadge, ContactSource } from "./ContactSourceBadge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface UnifiedContact {
  email: string;
  name: string | null;
  phone: string | null;
  sources: ContactSource[];
  canMarket: boolean;
  userType: string | null;
  lastActivity: string | null;
  // Source-specific data
  profileData?: {
    id: string;
    createdAt: string;
    credits: number;
    marketingConsent: boolean;
    userType: string | null;
  };
  newsletterData?: {
    id: string;
    createdAt: string;
    audience: string;
    confirmed: boolean;
    unsubscribed: boolean;
  };
  b2bData?: {
    id: string;
    createdAt: string;
    segment: string;
    companyName: string | null;
    source: string;
    unsubscribed: boolean;
    tags: string[] | null;
    notes: string | null;
  };
  leadData?: {
    id: string;
    createdAt: string;
    source: string | null;
    contractStatus: string | null;
    converted: boolean;
  };
}

interface ConsentLog {
  id: string;
  consent_type: string;
  accepted: boolean;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface ContactDetailPanelProps {
  contact: UnifiedContact | null;
  onClose: () => void;
}

const ContactDetailPanel = ({ contact, onClose }: ContactDetailPanelProps) => {
  const [consentLogs, setConsentLogs] = useState<ConsentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (contact?.profileData?.id) {
      fetchConsentLogs(contact.profileData.id);
    } else {
      setConsentLogs([]);
    }
  }, [contact]);

  const fetchConsentLogs = async (userId: string) => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from("consent_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setConsentLogs(data);
      }
    } catch (error) {
      console.error("Error fetching consent logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (!contact) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return format(new Date(dateStr), "d MMM yyyy", { locale: es });
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-background border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Detalle del Contacto</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">{contact.name || "Sin nombre"}</p>
                <p className="text-sm text-muted-foreground">{contact.email}</p>
              </div>
            </div>

            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{contact.phone}</span>
              </div>
            )}

            {contact.userType && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="capitalize">{contact.userType}</Badge>
              </div>
            )}
          </div>

          {/* Sources */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Fuentes ({contact.sources.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {contact.sources.map((source) => (
                <ContactSourceBadge key={source} source={source} size="md" />
              ))}
            </div>
          </div>

          {/* Marketing Status */}
          <div className="flex items-center gap-2">
            {contact.canMarket ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">
              {contact.canMarket ? "Puede recibir marketing" : "No acepta comunicaciones comerciales"}
            </span>
          </div>

          <Separator />

          {/* Source Details */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Detalle por Fuente
            </p>

            {/* Cliente */}
            {contact.profileData && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Cliente</span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>Registrado: {formatDate(contact.profileData.createdAt)}</p>
                  <p>Créditos: {contact.profileData.credits}</p>
                  <p>Marketing: {contact.profileData.marketingConsent ? "✓ Aceptado" : "✗ No"}</p>
                  {contact.profileData.userType && (
                    <p>Tipo: <span className="capitalize">{contact.profileData.userType}</span></p>
                  )}
                </div>
              </div>
            )}

            {/* Newsletter */}
            {contact.newsletterData && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Newsletter</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Suscrito: {formatDate(contact.newsletterData.createdAt)}</p>
                  <p>Audiencia: <span className="capitalize">{contact.newsletterData.audience}</span></p>
                  <p>Confirmado: {contact.newsletterData.confirmed ? "✓ Sí" : "✗ Pendiente"}</p>
                  {contact.newsletterData.unsubscribed && (
                    <p className="text-red-600">⚠ Dado de baja</p>
                  )}
                </div>
              </div>
            )}

            {/* B2B */}
            {contact.b2bData && (
              <div className="p-3 rounded-lg bg-orange-50 border border-orange-100 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Contacto B2B</span>
                </div>
                <div className="text-sm text-orange-700 space-y-1">
                  <p>Importado: {formatDate(contact.b2bData.createdAt)}</p>
                  <p>Segmento: <span className="capitalize">{contact.b2bData.segment.replace("_", " ")}</span></p>
                  {contact.b2bData.companyName && <p>Empresa: {contact.b2bData.companyName}</p>}
                  <p>Fuente: {contact.b2bData.source.replace("_", " ")}</p>
                  {contact.b2bData.tags && contact.b2bData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {contact.b2bData.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  {contact.b2bData.notes && (
                    <p className="text-xs mt-1 italic">{contact.b2bData.notes}</p>
                  )}
                  {contact.b2bData.unsubscribed && (
                    <p className="text-red-600">⚠ Dado de baja</p>
                  )}
                </div>
              </div>
            )}

            {/* Lead */}
            {contact.leadData && (
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Lead</span>
                </div>
                <div className="text-sm text-purple-700 space-y-1">
                  <p>Capturado: {formatDate(contact.leadData.createdAt)}</p>
                  {contact.leadData.source && <p>Fuente: {contact.leadData.source.replace("_", " ")}</p>}
                  {contact.leadData.contractStatus && <p>Estado: {contact.leadData.contractStatus}</p>}
                  <p>Convertido: {contact.leadData.converted ? "✓ Sí" : "✗ No"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Consent History */}
          {contact.profileData && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Historial de Consentimientos
                </p>
                {loadingLogs ? (
                  <p className="text-sm text-muted-foreground">Cargando...</p>
                ) : consentLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin registros de consentimiento</p>
                ) : (
                  <div className="space-y-2">
                    {consentLogs.map((log) => (
                      <div key={log.id} className="p-2 rounded bg-muted/50 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{log.consent_type.replace("_", " ")}</span>
                          <span className={log.accepted ? "text-green-600" : "text-red-600"}>
                            {log.accepted ? "Aceptado" : "Rechazado"}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: es })}
                        </p>
                        {log.ip_address && (
                          <p className="text-muted-foreground truncate">IP: {log.ip_address}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ContactDetailPanel;

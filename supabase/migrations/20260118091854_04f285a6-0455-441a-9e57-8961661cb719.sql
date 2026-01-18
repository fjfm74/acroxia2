-- Fase 1: Base de datos segmentada y RGPD compliant

-- 1.1 Modificar tabla profiles para segmentación y marketing consent
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_consent_at timestamp with time zone;

-- Añadir constraint check para user_type
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IS NULL OR user_type IN ('inquilino', 'propietario', 'profesional'));

-- 1.2 Modificar tabla blog_subscribers para RGPD
ALTER TABLE public.blog_subscribers
ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gdpr_consent_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ip_address text;

-- 1.3 Crear tabla marketing_contacts para B2B/bases compradas
CREATE TABLE IF NOT EXISTS public.marketing_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_name text,
  contact_name text,
  phone text,
  segment text NOT NULL CHECK (segment IN ('gestoria', 'inmobiliaria', 'abogado', 'administrador_fincas', 'otro')),
  source text NOT NULL DEFAULT 'manual_import' CHECK (source IN ('purchased_db', 'manual_import', 'website_form', 'event', 'referral')),
  consent_type text NOT NULL DEFAULT 'legitimate_interest' CHECK (consent_type IN ('legitimate_interest', 'explicit_consent')),
  consent_details text,
  tags text[] DEFAULT '{}',
  last_contacted_at timestamp with time zone,
  contact_count integer DEFAULT 0,
  email_opens integer DEFAULT 0,
  email_clicks integer DEFAULT 0,
  unsubscribed boolean DEFAULT false,
  unsubscribed_at timestamp with time zone,
  unsubscribe_reason text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(email)
);

-- Habilitar RLS en marketing_contacts
ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para marketing_contacts (solo admins)
CREATE POLICY "Admins can manage marketing contacts"
ON public.marketing_contacts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_marketing_contacts_updated_at
BEFORE UPDATE ON public.marketing_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_segment ON public.marketing_contacts(segment);
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_source ON public.marketing_contacts(source);
CREATE INDEX IF NOT EXISTS idx_marketing_contacts_unsubscribed ON public.marketing_contacts(unsubscribed);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_marketing_consent ON public.profiles(marketing_consent);
-- Tabla para almacenar publicaciones del BOE encontradas
CREATE TABLE public.boe_publications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boe_id text NOT NULL UNIQUE,
  title text NOT NULL,
  publication_date date NOT NULL,
  pdf_url text,
  boe_url text,
  section text,
  department text,
  summary text,
  status text NOT NULL DEFAULT 'pending_review',
  notified_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  processed_document_id uuid REFERENCES public.legal_documents(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabla para logs de monitorización
CREATE TABLE public.boe_monitoring_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_time timestamp with time zone NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'manual',
  success boolean NOT NULL DEFAULT false,
  error_message text,
  publications_found integer DEFAULT 0,
  new_publications integer DEFAULT 0,
  retry_pending boolean DEFAULT false,
  next_retry_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_boe_publications_status ON public.boe_publications(status);
CREATE INDEX idx_boe_publications_publication_date ON public.boe_publications(publication_date DESC);
CREATE INDEX idx_boe_monitoring_logs_check_time ON public.boe_monitoring_logs(check_time DESC);

-- Habilitar RLS
ALTER TABLE public.boe_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boe_monitoring_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para boe_publications
CREATE POLICY "Admins can manage boe_publications" 
ON public.boe_publications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para boe_monitoring_logs
CREATE POLICY "Admins can view boe_monitoring_logs" 
ON public.boe_monitoring_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert boe_monitoring_logs" 
ON public.boe_monitoring_logs 
FOR INSERT 
WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_boe_publications_updated_at
BEFORE UPDATE ON public.boe_publications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Configuración inicial en site_config
INSERT INTO public.site_config (key, value) VALUES (
  'boe_monitoring_config',
  '{
    "enabled": true,
    "notification_emails": ["nuriafrancis@gmail.com"],
    "search_terms": ["arrendamiento", "alquiler", "vivienda", "LAU", "fianza", "inquilino", "arrendatario", "arrendador", "renta", "desahucio"],
    "sections": ["I", "III"]
  }'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Crear cron jobs para monitorización del BOE (3 veces al día)
-- Cron a las 09:00
SELECT cron.schedule(
  'monitor-boe-morning',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/monitor-boe',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{"source": "cron_morning"}'::jsonb
  );
  $$
);

-- Cron a las 12:00
SELECT cron.schedule(
  'monitor-boe-noon',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/monitor-boe',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{"source": "cron_noon"}'::jsonb
  );
  $$
);

-- Cron a las 22:00
SELECT cron.schedule(
  'monitor-boe-night',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/monitor-boe',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{"source": "cron_night"}'::jsonb
  );
  $$
);
-- Crear tabla de registro de consentimientos (audit log)
CREATE TABLE public.consent_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  consent_type text NOT NULL CHECK (consent_type IN ('terms_and_privacy', 'third_party_data', 'cookies_analytics', 'cookies_marketing')),
  accepted boolean NOT NULL DEFAULT true,
  ip_address text,
  user_agent text,
  document_version text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear índice para búsquedas por usuario
CREATE INDEX idx_consent_logs_user_id ON public.consent_logs(user_id);
CREATE INDEX idx_consent_logs_type ON public.consent_logs(consent_type);
CREATE INDEX idx_consent_logs_created_at ON public.consent_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Política: usuarios pueden ver sus propios registros
CREATE POLICY "Users can view own consent logs"
ON public.consent_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Política: el sistema puede insertar registros (via service role o authenticated)
CREATE POLICY "System can insert consent logs"
ON public.consent_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: administradores pueden ver todos los registros
CREATE POLICY "Admins can view all consent logs"
ON public.consent_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Comentario de tabla
COMMENT ON TABLE public.consent_logs IS 'Registro de auditoría de consentimientos RGPD/LOPDGDD';
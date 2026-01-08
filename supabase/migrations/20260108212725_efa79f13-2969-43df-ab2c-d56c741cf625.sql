-- Añadir columnas para registro de consentimientos RGPD
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
ADD COLUMN IF NOT EXISTS cookies_consent jsonb DEFAULT '{}'::jsonb;
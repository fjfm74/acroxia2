-- Añadir campo de expiración a contratos
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone 
  DEFAULT (now() + INTERVAL '30 days');

-- Actualizar contratos existentes que no tienen expires_at
UPDATE contracts 
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;

-- Índice para búsquedas eficientes de contratos expirados
CREATE INDEX IF NOT EXISTS idx_contracts_expires_at ON contracts(expires_at);

-- Habilitar extensión pg_cron si no está habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Programar limpieza diaria a las 03:00 AM
SELECT cron.schedule(
  'cleanup-old-contracts',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/cleanup-contracts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  );
  $$
);
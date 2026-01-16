-- Habilitar extensión pg_net para llamadas HTTP desde la base de datos
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Habilitar extensión pg_cron para tareas programadas
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Eliminar el cron job si ya existe (para evitar duplicados)
SELECT cron.unschedule('generate-daily-blog-post') 
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-blog-post'
);

-- Crear el cron job para generar el post diario a las 9:00 AM CET (8:00 UTC)
SELECT cron.schedule(
  'generate-daily-blog-post',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/schedule-daily-post',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
-- Habilitar pg_net para hacer llamadas HTTP desde el cron
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Crear el cron job para generar posts diarios a las 9:00 AM (hora española)
SELECT cron.schedule(
  'generate-daily-blog-post',
  '0 9 * * *', -- Cada día a las 9:00 AM
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/schedule-daily-post',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbG9pYW1lbWRkd3h5eXVucGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTU0MjAsImV4cCI6MjA4MzM5MTQyMH0.bQtpacqIFrebkYISCGO0RfXA2pmNnNRcXNHX6yyX86s'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
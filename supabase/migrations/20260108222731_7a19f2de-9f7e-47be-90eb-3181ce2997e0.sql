-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-rate-limits',           -- job name
  '0 * * * *',                     -- every hour at minute 0
  $$SELECT public.cleanup_old_rate_limits()$$
);
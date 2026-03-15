SELECT cron.unschedule('generate-daily-blog-post');
SELECT cron.unschedule('generate-daily-landlord-post');

SELECT cron.schedule(
  'generate-daily-blog-post',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/schedule-daily-post',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);

SELECT cron.schedule(
  'generate-daily-landlord-post',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/schedule-daily-post-landlord',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
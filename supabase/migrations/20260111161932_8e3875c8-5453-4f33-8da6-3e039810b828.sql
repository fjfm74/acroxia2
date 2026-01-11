-- Create cron job for sending nurturing emails daily at 10:00 AM
SELECT cron.schedule(
  'send-nurturing-emails',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/send-nurturing-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbG9pYW1lbWRkd3h5eXVucGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTU0MjAsImV4cCI6MjA4MzM5MTQyMH0.bQtpacqIFrebkYISCGO0RfXA2pmNnNRcXNHX6yyX86s'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
-- Create rate limiting table for contact form
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_ip_endpoint_time ON public.rate_limits (ip_address, endpoint, created_at DESC);

-- Enable RLS (only edge functions with service role can access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies needed - accessed only via service role from edge functions

-- Auto-cleanup old records (older than 24 hours) - scheduled via cron or manual cleanup
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < now() - INTERVAL '24 hours';
END;
$$;
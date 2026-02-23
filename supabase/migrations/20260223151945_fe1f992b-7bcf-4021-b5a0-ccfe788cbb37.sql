
CREATE TABLE IF NOT EXISTS public.legal_monitor_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_monitor_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage legal_monitor_state"
  ON public.legal_monitor_state
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage legal_monitor_state"
  ON public.legal_monitor_state
  FOR ALL
  USING (auth.role() = 'service_role'::text);

CREATE POLICY "Anyone can read legal_monitor_state"
  ON public.legal_monitor_state
  FOR SELECT
  USING (true);

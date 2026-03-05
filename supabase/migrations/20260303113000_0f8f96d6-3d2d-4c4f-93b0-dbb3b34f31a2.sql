-- Audit trail for blog newsletter deliveries
CREATE TABLE public.blog_newsletter_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  subscriber_email TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('inquilino', 'propietario')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider TEXT NOT NULL DEFAULT 'resend',
  provider_message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_newsletter_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view blog newsletter deliveries"
ON public.blog_newsletter_deliveries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access to blog newsletter deliveries"
ON public.blog_newsletter_deliveries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_blog_newsletter_deliveries_post_id
ON public.blog_newsletter_deliveries(blog_post_id);

CREATE INDEX idx_blog_newsletter_deliveries_email
ON public.blog_newsletter_deliveries(subscriber_email);

CREATE INDEX idx_blog_newsletter_deliveries_status
ON public.blog_newsletter_deliveries(status);

CREATE UNIQUE INDEX uq_blog_newsletter_deliveries_sent_once
ON public.blog_newsletter_deliveries(blog_post_id, lower(subscriber_email))
WHERE status = 'sent';


-- 1) Remove exposed personal email from publicly readable site_config row
UPDATE public.site_config
SET value = value - 'notification_emails',
    updated_at = now()
WHERE key = 'boe_monitoring_config';

-- 2) Fix mutable search_path on pgmq wrapper functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;

-- 3) Revoke EXECUTE from anon on SECURITY DEFINER functions that should never be callable by unauthenticated users.
-- These functions either require auth.uid() or expose role/subscription/organization data.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.decrement_credit() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_organization(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_belongs_to_org(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.link_paid_anonymous_to_user(text) FROM anon;

-- pgmq queue helpers should only be invoked by service role / edge functions
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;

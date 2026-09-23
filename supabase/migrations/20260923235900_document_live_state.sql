-- =====================================================================
-- Estado aplicado manualmente el 23/24-09-2026 vía SQL directo.
-- Este fichero solo documenta y es seguro re-ejecutarlo.
-- Definiciones leídas de la base de datos con pg_get_functiondef,
-- pg_proc.proacl y cron.job el 23-09-2026.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Vault: existe vault.secrets name='cron_secret', creado a mano.
--    Lo usan get_cron_secret(), trigger_sitemap_regeneration() y los
--    crons para enviar 'Authorization: Bearer <cron_secret>'.
--    El valor NUNCA se versiona.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'cron_secret') THEN
    RAISE WARNING 'cron_secret ausente: crear con vault.create_secret(''<valor>'', ''cron_secret'')';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Funciones
-- ---------------------------------------------------------------------

-- public.get_cron_secret
CREATE OR REPLACE FUNCTION public.get_cron_secret()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_cron_secret() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_secret() TO service_role;

-- public.redact_analysis_preview
CREATE OR REPLACE FUNCTION public.redact_analysis_preview(full_result jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  SELECT CASE WHEN full_result IS NULL THEN NULL ELSE jsonb_build_object(
    'preview', true,
    'perspective', full_result->'perspective',
    'total_clauses', full_result->'total_clauses',
    'valid_clauses', full_result->'valid_clauses',
    'suspicious_clauses', full_result->'suspicious_clauses',
    'illegal_clauses', full_result->'illegal_clauses',
    'recommendation', full_result->'recommendation',
    'contract_metadata', full_result->'contract_metadata',
    'clauses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'type', c->'type',
        'category', c->'category',
        'original_text', left(COALESCE(c->>'original_text',''), 80)
      ) ORDER BY ord)
      FROM jsonb_array_elements(COALESCE(full_result->'clauses','[]'::jsonb)) WITH ORDINALITY AS t(c, ord)
      WHERE ord <= 3
    ), '[]'::jsonb)
  ) END;
$function$;

REVOKE ALL ON FUNCTION public.redact_analysis_preview(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redact_analysis_preview(jsonb) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.redact_analysis_preview(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.redact_analysis_preview(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redact_analysis_preview(jsonb) TO service_role;

-- public.get_anonymous_analysis
CREATE OR REPLACE FUNCTION public.get_anonymous_analysis(analysis_uuid uuid)
 RETURNS TABLE(id uuid, file_name text, expires_at timestamp with time zone, email text, analysis_result jsonb, paid boolean, converted_to_user_id uuid, converted_contract_id uuid)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    aa.id,
    aa.file_name,
    aa.expires_at,
    aa.email,
    CASE WHEN aa.paid = true THEN aa.analysis_result
         ELSE public.redact_analysis_preview(aa.analysis_result) END AS analysis_result,
    aa.paid,
    aa.converted_to_user_id,
    (SELECT c.id FROM contracts c
     WHERE c.user_id = aa.converted_to_user_id
       AND c.source_analysis_id = aa.id
     LIMIT 1) AS converted_contract_id
  FROM anonymous_analyses aa
  WHERE aa.id = analysis_uuid;
$function$;

REVOKE ALL ON FUNCTION public.get_anonymous_analysis(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_anonymous_analysis(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_anonymous_analysis(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_anonymous_analysis(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_anonymous_analysis(uuid) TO service_role;

-- public.consume_credit
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_ok boolean := false;
BEGIN
  UPDATE profiles SET credits = credits - 1
  WHERE id = p_user_id AND credits > 0
  RETURNING true INTO v_ok;
  RETURN COALESCE(v_ok, false);
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credit(uuid) TO service_role;

-- public.refund_credit
CREATE OR REPLACE FUNCTION public.refund_credit(p_user_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE profiles SET credits = credits + 1 WHERE id = p_user_id;
$function$;

REVOKE ALL ON FUNCTION public.refund_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credit(uuid) TO service_role;

-- public.trigger_sitemap_regeneration
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR
     (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.slug IS DISTINCT FROM NEW.slug)) OR
     (TG_OP = 'DELETE' AND OLD.status = 'published') THEN
    PERFORM net.http_post(
      url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/regenerate-llm-files',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)),
      body := '{}'::jsonb
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

REVOKE ALL ON FUNCTION public.trigger_sitemap_regeneration() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sitemap_regeneration() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.trigger_sitemap_regeneration() TO anon;
GRANT EXECUTE ON FUNCTION public.trigger_sitemap_regeneration() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_sitemap_regeneration() TO service_role;

-- ---------------------------------------------------------------------
-- 3. Crons (schedule y command copiados de cron.job; horas en UTC)
-- ---------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-contracts') THEN PERFORM cron.unschedule('cleanup-old-contracts'); END IF;
END $$;
SELECT cron.schedule('cleanup-old-contracts', '0 3 * * *', $cmd$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/cleanup-contracts',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)),
    body := '{"source":"cron"}'::jsonb,
    timeout_milliseconds := 30000
  );
$cmd$);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monitor-boe-daily') THEN PERFORM cron.unschedule('monitor-boe-daily'); END IF;
END $$;
SELECT cron.schedule('monitor-boe-daily', '15 6 * * *', $cmd$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/monitor-boe',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)),
    body := '{"source":"cron_daily"}'::jsonb,
    timeout_milliseconds := 30000
  );
$cmd$);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-nurturing-emails') THEN PERFORM cron.unschedule('send-nurturing-emails'); END IF;
END $$;
SELECT cron.schedule('send-nurturing-emails', '0 10 * * *', $cmd$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/send-nurturing-emails',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
$cmd$);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-blog-post') THEN PERFORM cron.unschedule('generate-daily-blog-post'); END IF;
END $$;
SELECT cron.schedule('generate-daily-blog-post', '0 8 * * 1,3,5', $cmd$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/schedule-daily-post',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)),
    body := '{"source":"cron"}'::jsonb,
    timeout_milliseconds := 150000
  );
$cmd$);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-landlord-post') THEN PERFORM cron.unschedule('generate-daily-landlord-post'); END IF;
END $$;
SELECT cron.schedule('generate-daily-landlord-post', '0 9 * * 2,4', $cmd$
  SELECT net.http_post(
    url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/schedule-daily-post-landlord',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1)),
    body := '{"source":"cron"}'::jsonb,
    timeout_milliseconds := 150000
  );
$cmd$);

-- ---------------------------------------------------------------------
-- 4. Edge functions que exigen 'Authorization: Bearer <cron_secret>':
--      - cleanup-contracts
--      - monitor-boe
--      - send-nurturing-emails
--      - schedule-daily-post
--      - schedule-daily-post-landlord
--    Guard compartido: supabase/functions/_shared/cron-auth.ts
--    (isCronAuthorized). Sin el secreto responden 401.
-- ---------------------------------------------------------------------

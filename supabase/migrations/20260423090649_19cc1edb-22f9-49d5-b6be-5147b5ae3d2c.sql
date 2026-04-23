
-- 1. Fix Security Definer View: switch admin_paid_unlinked_analyses to SECURITY INVOKER
-- so it respects the querying user's RLS rather than the view owner's privileges.
ALTER VIEW public.admin_paid_unlinked_analyses SET (security_invoker = true);

-- 2. Drop obsolete backup tables that have RLS enabled but no policies (dead weight,
-- inaccessible to the app, and flagged as potential data exposure surface).
DROP TABLE IF EXISTS public.backup_document_relations_reset_20260225;
DROP TABLE IF EXISTS public.backup_invalid_chunks_20260225;
DROP TABLE IF EXISTS public.backup_invalid_rel_20260225;
DROP TABLE IF EXISTS public.backup_legal_chunks_superseded_reset_20260225;
DROP TABLE IF EXISTS public.backup_legal_documents_supersession_reset_20260225;

-- 3. Tighten consent_logs RLS: scope policies to the authenticated role explicitly
-- for defense in depth.
DROP POLICY IF EXISTS "System can insert consent logs" ON public.consent_logs;
DROP POLICY IF EXISTS "Users can view own consent logs" ON public.consent_logs;
DROP POLICY IF EXISTS "Admins can view all consent logs" ON public.consent_logs;

CREATE POLICY "Users can insert own consent logs"
ON public.consent_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own consent logs"
ON public.consent_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all consent logs"
ON public.consent_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix mutable search_path on remaining functions
ALTER FUNCTION public.compute_legal_corpus_hash() SET search_path = public;
ALTER FUNCTION public.map_territorial_code(text) SET search_path = public;

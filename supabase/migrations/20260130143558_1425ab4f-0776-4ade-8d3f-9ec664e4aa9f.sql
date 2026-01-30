
-- =============================================================
-- SECURITY FIX: Address 4 error-level vulnerabilities
-- =============================================================

-- 1. FIX: anonymous_analyses - Remove overly permissive SELECT
-- Drop the policy that allows anyone to read all unexpired analyses
DROP POLICY IF EXISTS "Allow read recent unexpired analyses" ON public.anonymous_analyses;

-- Create a secure function for ID-based lookup (UUID acts as proof of knowledge)
CREATE OR REPLACE FUNCTION public.get_anonymous_analysis(analysis_uuid UUID)
RETURNS SETOF public.anonymous_analyses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.anonymous_analyses
  WHERE id = analysis_uuid
    AND expires_at IS NOT NULL
    AND expires_at > now();
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION public.get_anonymous_analysis FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_anonymous_analysis TO anon, authenticated;

-- Also fix the UPDATE policy - it has the same issue
DROP POLICY IF EXISTS "Allow update unexpired analyses" ON public.anonymous_analyses;

-- Create a secure function for updates (only allow updating own analysis by ID)
CREATE OR REPLACE FUNCTION public.update_anonymous_analysis_email(
  analysis_uuid UUID,
  new_email TEXT,
  new_contract_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.anonymous_analyses
  SET email = new_email,
      contract_status = new_contract_status
  WHERE id = analysis_uuid
    AND expires_at IS NOT NULL
    AND expires_at > now();
  
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.update_anonymous_analysis_email FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_anonymous_analysis_email TO anon, authenticated;

-- =============================================================
-- 2. FIX: decrement_credit - Remove user_id parameter, use auth.uid()
-- =============================================================
DROP FUNCTION IF EXISTS public.decrement_credit(uuid);

CREATE OR REPLACE FUNCTION public.decrement_credit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only decrement credits for the authenticated user making the request
  UPDATE profiles 
  SET credits = GREATEST(credits - 1, 0)
  WHERE id = auth.uid();
END;
$$;

-- Restrict to authenticated users only
REVOKE ALL ON FUNCTION public.decrement_credit FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_credit TO authenticated;

-- =============================================================
-- 3. FIX: leads table - Verify RLS is enabled (it should be based on policies)
-- The policies show roles: {authenticated} for SELECT and {anon,authenticated} for INSERT
-- This means anonymous users CAN insert but only authenticated admins can view
-- This is correct. The scanner may have flagged a stale state. Let's ensure RLS is ON.
-- =============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- 4. FIX: blog_subscribers - The policies have roles: {public} which is WRONG
-- The "public" role in Postgres is the default role for ALL users
-- We need to restrict SELECT/UPDATE/DELETE to authenticated admins only
-- =============================================================

-- Drop the incorrectly configured policies
DROP POLICY IF EXISTS "Admins can delete blog_subscribers" ON public.blog_subscribers;
DROP POLICY IF EXISTS "Admins can update blog_subscribers" ON public.blog_subscribers;
DROP POLICY IF EXISTS "Admins can view blog_subscribers" ON public.blog_subscribers;

-- Recreate with proper role restrictions (authenticated only, not public)
CREATE POLICY "Admins can view blog_subscribers" 
ON public.blog_subscribers 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blog_subscribers" 
ON public.blog_subscribers 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blog_subscribers" 
ON public.blog_subscribers 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure RLS is enabled
ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;

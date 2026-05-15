-- Add admin SELECT policy for waitlist_audiences
DROP POLICY IF EXISTS "Admins can view waitlist_audiences" ON public.waitlist_audiences;
CREATE POLICY "Admins can view waitlist_audiences"
  ON public.waitlist_audiences FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to also insert (logged-in users on coming-soon pages)
DROP POLICY IF EXISTS "Authenticated can insert waitlist_audiences" ON public.waitlist_audiences;
CREATE POLICY "Authenticated can insert waitlist_audiences"
  ON public.waitlist_audiences FOR INSERT
  TO authenticated
  WITH CHECK (true);
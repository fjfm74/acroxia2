CREATE TABLE public.waitlist_contract_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('temporada', 'vacacional')),
  accepted_rgpd_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_waitlist_contract_types_email ON public.waitlist_contract_types(email);

ALTER TABLE public.waitlist_contract_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join contract type waitlist"
ON public.waitlist_contract_types
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view contract type waitlist"
ON public.waitlist_contract_types
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
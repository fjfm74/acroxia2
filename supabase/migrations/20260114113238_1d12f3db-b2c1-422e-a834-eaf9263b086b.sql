-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tenant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'landlord';

-- Create landlord_contracts table for landlord-specific contract management
CREATE TABLE public.landlord_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text,
  file_size integer,
  property_address text,
  tenant_name text,
  tenant_email text,
  tenant_phone text,
  signing_date date,
  start_date date,
  end_date date,
  monthly_rent numeric(10,2),
  deposit_months integer DEFAULT 1,
  deposit_amount numeric(10,2),
  renewal_reminder boolean DEFAULT true,
  reminder_days_before integer DEFAULT 60,
  notes text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'pending_renewal', 'expired', 'terminated')),
  analysis_result jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_landlord_contracts_user_id ON public.landlord_contracts(user_id);
CREATE INDEX idx_landlord_contracts_end_date ON public.landlord_contracts(end_date);
CREATE INDEX idx_landlord_contracts_status ON public.landlord_contracts(status);

-- Enable RLS
ALTER TABLE public.landlord_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for landlord_contracts
CREATE POLICY "Users can view own landlord contracts"
  ON public.landlord_contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own landlord contracts"
  ON public.landlord_contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landlord contracts"
  ON public.landlord_contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own landlord contracts"
  ON public.landlord_contracts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on landlord_contracts"
  ON public.landlord_contracts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_landlord_contracts_updated_at
  BEFORE UPDATE ON public.landlord_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Extend app_role enum to include 'professional'
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professional';

-- Create organizations table for professional accounts
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  business_type TEXT NOT NULL DEFAULT 'gestoria' CHECK (business_type IN ('inmobiliaria', 'gestoria', 'api', 'otro')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_color TEXT DEFAULT '#1F1D1B',
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table for professionals to organize their work
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  property_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add professional fields to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND owner_id = _user_id
  )
$$;

-- Create function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.organizations
  WHERE owner_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view own organizations"
ON public.organizations
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own organizations"
ON public.organizations
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own organizations"
ON public.organizations
FOR DELETE
USING (auth.uid() = owner_id);

-- RLS Policies for clients
CREATE POLICY "Users can view clients from own organization"
ON public.clients
FOR SELECT
USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can insert clients to own organization"
ON public.clients
FOR INSERT
WITH CHECK (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can update clients from own organization"
ON public.clients
FOR UPDATE
USING (user_belongs_to_org(auth.uid(), organization_id));

CREATE POLICY "Users can delete clients from own organization"
ON public.clients
FOR DELETE
USING (user_belongs_to_org(auth.uid(), organization_id));

-- Additional policy for contracts: professionals can view contracts from their organization
CREATE POLICY "Professionals can view organization contracts"
ON public.contracts
FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Professionals can insert organization contracts"
ON public.contracts
FOR INSERT
WITH CHECK (
  organization_id IS NULL 
  OR user_belongs_to_org(auth.uid(), organization_id)
);

CREATE POLICY "Professionals can update organization contracts"
ON public.contracts
FOR UPDATE
USING (
  organization_id IS NOT NULL 
  AND user_belongs_to_org(auth.uid(), organization_id)
);

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Tabla para análisis anónimos (sin registro)
CREATE TABLE public.anonymous_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  analysis_result JSONB,
  email TEXT,
  contract_status TEXT CHECK (contract_status IN ('not_signed', 'signed_want_claim', 'need_another')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  converted_to_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para captación de leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  session_id TEXT,
  analysis_id UUID REFERENCES public.anonymous_analyses(id),
  contract_status TEXT CHECK (contract_status IN ('not_signed', 'signed_want_claim', 'need_another')),
  source TEXT DEFAULT 'analysis_preview',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  converted_at TIMESTAMPTZ,
  converted_to_user_id UUID REFERENCES auth.users(id),
  last_email_sent_at TIMESTAMPTZ,
  email_count INTEGER DEFAULT 0,
  unsubscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para intenciones de pago (placeholder para Stripe)
CREATE TABLE public.purchase_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.anonymous_analyses(id),
  email TEXT NOT NULL,
  amount_cents INTEGER DEFAULT 990,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  stripe_session_id TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para búsquedas eficientes
CREATE INDEX idx_anonymous_analyses_session ON public.anonymous_analyses(session_id);
CREATE INDEX idx_anonymous_analyses_expires ON public.anonymous_analyses(expires_at);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_analysis ON public.leads(analysis_id);
CREATE INDEX idx_purchase_intents_analysis ON public.purchase_intents(analysis_id);

-- RLS para anonymous_analyses
ALTER TABLE public.anonymous_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert" ON public.anonymous_analyses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow read by session_id" ON public.anonymous_analyses
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow update by session_id" ON public.anonymous_analyses
  FOR UPDATE TO anon, authenticated
  USING (true);

-- RLS para leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all leads" ON public.leads
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS para purchase_intents
ALTER TABLE public.purchase_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert purchase_intents" ON public.purchase_intents
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view purchase_intents" ON public.purchase_intents
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Allow update purchase_intents" ON public.purchase_intents
  FOR UPDATE TO anon, authenticated
  USING (true);

-- Storage policy para uploads anónimos en el bucket contracts
CREATE POLICY "Allow anonymous uploads to contracts bucket"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'contracts' AND (storage.foldername(name))[1] = 'anonymous');
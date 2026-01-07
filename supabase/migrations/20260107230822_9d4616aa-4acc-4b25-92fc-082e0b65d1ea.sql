-- Enum para roles de usuario
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Enum para estado de contratos
CREATE TYPE public.contract_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Enum para tipo de documento legal
CREATE TYPE public.legal_doc_type AS ENUM ('ley', 'boe', 'jurisprudencia', 'guia', 'decreto');

-- Tabla de perfiles de usuario
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  credits INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de roles de usuario (separada por seguridad)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabla de contratos subidos por usuarios
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  status contract_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de resultados de análisis
CREATE TABLE public.analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  total_clauses INTEGER DEFAULT 0,
  valid_clauses INTEGER DEFAULT 0,
  suspicious_clauses INTEGER DEFAULT 0,
  illegal_clauses INTEGER DEFAULT 0,
  full_report JSONB,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de documentos legales (metadatos)
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type legal_doc_type NOT NULL,
  source TEXT,
  file_path TEXT,
  description TEXT,
  effective_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de fragmentos de documentos legales (para RAG)
CREATE TABLE public.legal_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.legal_documents(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  article_reference TEXT,
  section_title TEXT,
  metadata JSONB,
  search_vector TSVECTOR GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabla de suscripciones
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índice para búsqueda full-text en fragmentos legales
CREATE INDEX legal_chunks_search_idx ON public.legal_chunks USING gin(search_vector);

-- Índice para búsqueda por documento
CREATE INDEX legal_chunks_document_idx ON public.legal_chunks(document_id);

-- Índice para contratos por usuario
CREATE INDEX contracts_user_idx ON public.contracts(user_id);

-- Índice para resultados por contrato
CREATE INDEX analysis_results_contract_idx ON public.analysis_results(contract_id);

-- Función para verificar rol de usuario (SECURITY DEFINER para evitar recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    1
  );
  
  -- Asignar rol de usuario por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil en registro
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Políticas RLS para user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para contracts
CREATE POLICY "Users can view own contracts"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts"
  ON public.contracts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts"
  ON public.contracts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts"
  ON public.contracts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas RLS para analysis_results
CREATE POLICY "Users can view own analysis results"
  ON public.analysis_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = analysis_results.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analysis results"
  ON public.analysis_results FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts
      WHERE contracts.id = analysis_results.contract_id
      AND contracts.user_id = auth.uid()
    )
  );

-- Políticas RLS para legal_documents (lectura pública para usuarios autenticados)
CREATE POLICY "Authenticated users can view active legal documents"
  ON public.legal_documents FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage legal documents"
  ON public.legal_documents FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para legal_chunks (lectura pública para usuarios autenticados)
CREATE POLICY "Authenticated users can view legal chunks"
  ON public.legal_chunks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.legal_documents
      WHERE legal_documents.id = legal_chunks.document_id
      AND legal_documents.is_active = true
    )
  );

CREATE POLICY "Admins can manage legal chunks"
  ON public.legal_chunks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Función para buscar fragmentos legales relevantes (para RAG)
CREATE OR REPLACE FUNCTION public.search_legal_chunks(
  search_query TEXT,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  article_reference TEXT,
  section_title TEXT,
  document_title TEXT,
  document_type legal_doc_type,
  rank REAL
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    lc.id,
    lc.document_id,
    lc.content,
    lc.article_reference,
    lc.section_title,
    ld.title AS document_title,
    ld.type AS document_type,
    ts_rank(lc.search_vector, plainto_tsquery('spanish', search_query)) AS rank
  FROM public.legal_chunks lc
  JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE ld.is_active = true
    AND lc.search_vector @@ plainto_tsquery('spanish', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
$$;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-docs', 'legal-docs', false);

-- Políticas de storage para contracts
CREATE POLICY "Users can upload own contracts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'contracts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own contracts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'contracts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own contracts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'contracts' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas de storage para legal-docs (solo admins)
CREATE POLICY "Admins can upload legal docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'legal-docs' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can view legal docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'legal-docs' 
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete legal docs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'legal-docs' 
    AND public.has_role(auth.uid(), 'admin')
  );
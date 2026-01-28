-- Crear tabla de caché para archivos LLM
CREATE TABLE public.llm_files_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  generated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar registros iniciales
INSERT INTO public.llm_files_cache (file_name, content) VALUES 
  ('llms.txt', ''),
  ('llms-full.txt', '');

-- Habilitar RLS
ALTER TABLE public.llm_files_cache ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can read llm cache" 
  ON public.llm_files_cache 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage llm cache" 
  ON public.llm_files_cache 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage llm cache"
  ON public.llm_files_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- Actualizar función trigger para también regenerar archivos LLM
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR
     (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.slug IS DISTINCT FROM NEW.slug)) OR
     (TG_OP = 'DELETE' AND OLD.status = 'published') THEN
    
    -- Regenerar sitemap (existente)
    PERFORM net.http_post(
      url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/regenerate-sitemap',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
    
    -- NUEVO: Regenerar archivos LLM
    PERFORM net.http_post(
      url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/regenerate-llm-files',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
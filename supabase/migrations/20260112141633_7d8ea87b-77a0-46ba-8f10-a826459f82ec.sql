-- 1. Crear tabla sitemap_cache
CREATE TABLE public.sitemap_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insertar registro inicial vacío
INSERT INTO public.sitemap_cache (content) VALUES ('');

-- Trigger para updated_at
CREATE TRIGGER update_sitemap_cache_updated_at
  BEFORE UPDATE ON public.sitemap_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
ALTER TABLE public.sitemap_cache ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública (el sitemap es público)
CREATE POLICY "Anyone can read sitemap cache"
  ON public.sitemap_cache
  FOR SELECT
  USING (true);

-- Solo admins pueden modificar manualmente
CREATE POLICY "Admins can manage sitemap cache"
  ON public.sitemap_cache
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Crear función para trigger de regeneración
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo regenerar si el status cambió a/desde 'published' o el slug cambió
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR
     (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.slug IS DISTINCT FROM NEW.slug)) OR
     (TG_OP = 'DELETE' AND OLD.status = 'published') THEN
    
    -- Llamar a la edge function para regenerar el sitemap
    PERFORM net.http_post(
      url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/regenerate-sitemap',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Crear trigger en blog_posts
CREATE TRIGGER on_blog_post_change_regenerate_sitemap
  AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sitemap_regeneration();
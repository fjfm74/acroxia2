CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR
     (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.slug IS DISTINCT FROM NEW.slug)) OR
     (TG_OP = 'DELETE' AND OLD.status = 'published') THEN

    -- Sitemap ya no necesita regeneración: /sitemap.xml es 100% dinámico.
    -- Mantenemos solo la regeneración de archivos LLM.
    PERFORM net.http_post(
      url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/regenerate-llm-files',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
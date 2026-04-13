
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_audience text;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    1
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Determine audience from user_type metadata, default to 'inquilino'
  v_audience := COALESCE(NEW.raw_user_meta_data->>'user_type', 'inquilino');

  -- Auto-subscribe to newsletter (double opt-in: confirmed = false)
  INSERT INTO public.blog_subscribers (email, audience, name, confirmed, gdpr_consent, gdpr_consent_at)
  VALUES (
    NEW.email,
    v_audience,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    false,
    true,
    now()
  )
  ON CONFLICT (email, audience) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

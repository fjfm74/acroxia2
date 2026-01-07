-- Corregir search_path en funciones para seguridad

-- Actualizar update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Actualizar handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  RETURN NEW;
END;
$$;

-- Actualizar search_legal_chunks
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
SECURITY INVOKER
SET search_path = public
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
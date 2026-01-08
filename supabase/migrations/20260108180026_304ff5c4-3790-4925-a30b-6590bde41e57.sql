-- Añadir nuevos valores al enum legal_doc_type
ALTER TYPE legal_doc_type ADD VALUE IF NOT EXISTS 'real_decreto';
ALTER TYPE legal_doc_type ADD VALUE IF NOT EXISTS 'orden_ministerial';
ALTER TYPE legal_doc_type ADD VALUE IF NOT EXISTS 'sentencia';
ALTER TYPE legal_doc_type ADD VALUE IF NOT EXISTS 'otro';

-- Añadir columna para entidad territorial
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS territorial_entity TEXT;

-- Comentario explicativo
COMMENT ON COLUMN legal_documents.territorial_entity IS 
  'Comunidad autónoma, provincia o ayuntamiento según la jurisdicción';

-- Actualizar función search_legal_chunks con filtro territorial
CREATE OR REPLACE FUNCTION public.search_legal_chunks(
  search_query text,
  match_count integer DEFAULT 10,
  territorial_filter text DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  content text,
  article_reference text,
  section_title text,
  document_title text,
  document_type legal_doc_type,
  jurisdiction legal_jurisdiction,
  territorial_entity text,
  rank real
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    lc.id,
    lc.document_id,
    lc.content,
    lc.article_reference,
    lc.section_title,
    ld.title AS document_title,
    ld.type AS document_type,
    ld.jurisdiction,
    ld.territorial_entity,
    ts_rank(lc.search_vector, plainto_tsquery('spanish', search_query)) AS rank
  FROM public.legal_chunks lc
  JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE ld.is_active = true
    AND lc.search_vector @@ plainto_tsquery('spanish', search_query)
    AND (
      -- Siempre incluir estatales
      ld.jurisdiction = 'estatal'
      OR
      -- O si no hay filtro territorial, incluir todo
      territorial_filter IS NULL
      OR
      -- O que coincida con la entidad territorial
      ld.territorial_entity = territorial_filter
    )
  ORDER BY 
    -- Priorizar coincidencias territoriales exactas
    CASE WHEN ld.territorial_entity = territorial_filter THEN 0 ELSE 1 END,
    rank DESC
  LIMIT match_count;
$$;
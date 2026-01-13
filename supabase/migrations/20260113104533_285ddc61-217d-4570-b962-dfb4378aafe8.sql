-- Añadir campos de obsolescencia a nivel de chunk (artículo)
ALTER TABLE legal_chunks 
ADD COLUMN IF NOT EXISTS is_superseded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS superseded_by_chunk_id uuid REFERENCES legal_chunks(id),
ADD COLUMN IF NOT EXISTS superseded_at timestamp with time zone;

-- Índice para búsquedas eficientes de chunks activos
CREATE INDEX IF NOT EXISTS idx_legal_chunks_is_superseded ON legal_chunks(is_superseded);

-- Actualizar la función search_legal_chunks_semantic para filtrar chunks obsoletos
CREATE OR REPLACE FUNCTION public.search_legal_chunks_semantic(
  search_query text, 
  semantic_categories text[] DEFAULT NULL::text[], 
  key_entity text DEFAULT NULL::text, 
  municipality_name text DEFAULT NULL::text, 
  province_name text DEFAULT NULL::text, 
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid, 
  document_id uuid, 
  content text, 
  article_reference text, 
  section_title text, 
  semantic_category text, 
  key_entities text[], 
  applies_when jsonb, 
  territorial_scope text, 
  affected_municipalities text[], 
  affected_provinces text[], 
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
    lc.semantic_category,
    lc.key_entities,
    lc.applies_when,
    lc.territorial_scope,
    lc.affected_municipalities,
    lc.affected_provinces,
    ld.title AS document_title,
    ld.type AS document_type,
    ld.jurisdiction,
    ld.territorial_entity,
    CASE 
      WHEN municipality_name IS NOT NULL 
           AND municipality_name = ANY(lc.affected_municipalities)
           AND (semantic_categories IS NULL OR lc.semantic_category = ANY(semantic_categories))
        THEN 3.0
      WHEN key_entity IS NOT NULL 
           AND key_entity = ANY(lc.key_entities)
        THEN 2.5
      WHEN province_name IS NOT NULL 
           AND province_name = ANY(lc.affected_provinces)
        THEN 2.0
      ELSE ts_rank(lc.search_vector, plainto_tsquery('spanish', search_query))
    END AS rank
  FROM public.legal_chunks lc
  JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE 
    ld.is_active = true
    AND ld.superseded_by_id IS NULL
    AND (ld.expiration_date IS NULL OR ld.expiration_date >= CURRENT_DATE)
    -- NUEVO: Filtrar chunks obsoletos a nivel de artículo
    AND (lc.is_superseded IS NULL OR lc.is_superseded = false)
    AND (
      lc.search_vector @@ plainto_tsquery('spanish', search_query)
      OR (municipality_name IS NOT NULL AND municipality_name = ANY(lc.affected_municipalities))
      OR (province_name IS NOT NULL AND province_name = ANY(lc.affected_provinces))
      OR (key_entity IS NOT NULL AND key_entity = ANY(lc.key_entities))
    )
    AND (semantic_categories IS NULL OR lc.semantic_category = ANY(semantic_categories))
  ORDER BY rank DESC
  LIMIT match_count;
$$;

-- Actualizar la función search_legal_chunks_by_location para filtrar chunks obsoletos
CREATE OR REPLACE FUNCTION public.search_legal_chunks_by_location(
  search_query text, 
  municipality_name text DEFAULT NULL::text, 
  province_name text DEFAULT NULL::text, 
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid, 
  document_id uuid, 
  content text, 
  article_reference text, 
  section_title text, 
  territorial_scope text, 
  affected_municipalities text[], 
  affected_provinces text[], 
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
    lc.territorial_scope,
    lc.affected_municipalities,
    lc.affected_provinces,
    ld.title AS document_title,
    ld.type AS document_type,
    ld.jurisdiction,
    ld.territorial_entity,
    CASE 
      WHEN municipality_name IS NOT NULL 
           AND municipality_name = ANY(lc.affected_municipalities) THEN 2.0
      WHEN province_name IS NOT NULL 
           AND province_name = ANY(lc.affected_provinces) THEN 1.5
      ELSE ts_rank(lc.search_vector, plainto_tsquery('spanish', search_query))
    END AS rank
  FROM public.legal_chunks lc
  JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE 
    ld.is_active = true
    -- NUEVO: Filtrar chunks obsoletos a nivel de artículo
    AND (lc.is_superseded IS NULL OR lc.is_superseded = false)
    AND (
      lc.search_vector @@ plainto_tsquery('spanish', search_query)
      OR (municipality_name IS NOT NULL AND municipality_name = ANY(lc.affected_municipalities))
      OR (province_name IS NOT NULL AND province_name = ANY(lc.affected_provinces))
    )
  ORDER BY rank DESC
  LIMIT match_count;
$$;

-- Actualizar las funciones search_legal_chunks (ambas versiones)
CREATE OR REPLACE FUNCTION public.search_legal_chunks(
  search_query text, 
  match_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid, 
  document_id uuid, 
  content text, 
  article_reference text, 
  section_title text, 
  document_title text, 
  document_type legal_doc_type, 
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
    ts_rank(lc.search_vector, plainto_tsquery('spanish', search_query)) AS rank
  FROM public.legal_chunks lc
  JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE ld.is_active = true
    -- NUEVO: Filtrar chunks obsoletos
    AND (lc.is_superseded IS NULL OR lc.is_superseded = false)
    AND lc.search_vector @@ plainto_tsquery('spanish', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.search_legal_chunks(
  search_query text, 
  match_count integer DEFAULT 10, 
  territorial_filter text DEFAULT NULL::text
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
    -- NUEVO: Filtrar chunks obsoletos
    AND (lc.is_superseded IS NULL OR lc.is_superseded = false)
    AND lc.search_vector @@ plainto_tsquery('spanish', search_query)
    AND (
      ld.jurisdiction = 'estatal'
      OR territorial_filter IS NULL
      OR ld.territorial_entity = territorial_filter
    )
  ORDER BY 
    CASE WHEN ld.territorial_entity = territorial_filter THEN 0 ELSE 1 END,
    rank DESC
  LIMIT match_count;
$$;
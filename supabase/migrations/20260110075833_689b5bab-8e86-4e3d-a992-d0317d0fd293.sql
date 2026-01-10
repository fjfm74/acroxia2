-- Añadir campos para entidades territoriales específicas del fragmento
ALTER TABLE public.legal_chunks 
ADD COLUMN IF NOT EXISTS affected_municipalities TEXT[] DEFAULT '{}';

ALTER TABLE public.legal_chunks 
ADD COLUMN IF NOT EXISTS affected_provinces TEXT[] DEFAULT '{}';

ALTER TABLE public.legal_chunks 
ADD COLUMN IF NOT EXISTS territorial_scope TEXT DEFAULT 'estatal';

-- Crear índice GIN para búsqueda eficiente en arrays de municipios
CREATE INDEX IF NOT EXISTS idx_chunks_municipalities 
ON public.legal_chunks USING GIN (affected_municipalities);

-- Crear índice GIN para búsqueda eficiente en arrays de provincias
CREATE INDEX IF NOT EXISTS idx_chunks_provinces 
ON public.legal_chunks USING GIN (affected_provinces);

-- Crear función de búsqueda mejorada por municipio
CREATE OR REPLACE FUNCTION public.search_legal_chunks_by_location(
  search_query TEXT,
  municipality_name TEXT DEFAULT NULL,
  province_name TEXT DEFAULT NULL,
  match_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  document_id UUID,
  content TEXT,
  article_reference TEXT,
  section_title TEXT,
  territorial_scope TEXT,
  affected_municipalities TEXT[],
  affected_provinces TEXT[],
  document_title TEXT,
  document_type legal_doc_type,
  jurisdiction legal_jurisdiction,
  territorial_entity TEXT,
  rank REAL
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
      -- Máxima prioridad: municipio específico mencionado en el chunk
      WHEN municipality_name IS NOT NULL 
           AND municipality_name = ANY(lc.affected_municipalities) THEN 2.0
      -- Alta prioridad: provincia específica mencionada en el chunk
      WHEN province_name IS NOT NULL 
           AND province_name = ANY(lc.affected_provinces) THEN 1.5
      -- Prioridad normal: búsqueda por texto
      ELSE ts_rank(lc.search_vector, plainto_tsquery('spanish', search_query))
    END AS rank
  FROM public.legal_chunks lc
  JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE 
    ld.is_active = true
    AND (
      -- Buscar por texto completo
      lc.search_vector @@ plainto_tsquery('spanish', search_query)
      OR
      -- O si el municipio está en el array de municipios afectados
      (municipality_name IS NOT NULL AND municipality_name = ANY(lc.affected_municipalities))
      OR
      -- O si la provincia está en el array de provincias afectadas
      (province_name IS NOT NULL AND province_name = ANY(lc.affected_provinces))
    )
  ORDER BY rank DESC
  LIMIT match_count;
$$;
-- =============================================
-- FASE 1: Campos de gestión de obsolescencia en legal_documents
-- =============================================

-- IDs de documentos que este deroga/reemplaza
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS 
  supersedes_ids UUID[] DEFAULT '{}';

-- ID del documento que lo ha derogado (si aplica)
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS 
  superseded_by_id UUID REFERENCES public.legal_documents(id);

-- Fecha de caducidad si la tiene
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS 
  expiration_date DATE;

-- Palabras clave extraídas por la IA
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS 
  keywords TEXT[] DEFAULT '{}';

-- Resumen generado por IA del contenido principal
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS 
  ai_summary TEXT;

-- =============================================
-- FASE 2: Campos semánticos en legal_chunks
-- =============================================

-- Categoría semántica del chunk
ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS 
  semantic_category TEXT;

-- Condiciones de aplicación (JSONB flexible)
ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS 
  applies_when JSONB DEFAULT '{}';

-- Entidades clave mencionadas
ALTER TABLE public.legal_chunks ADD COLUMN IF NOT EXISTS 
  key_entities TEXT[] DEFAULT '{}';

-- =============================================
-- FASE 3: Función de búsqueda semántica mejorada
-- =============================================

CREATE OR REPLACE FUNCTION public.search_legal_chunks_semantic(
  search_query TEXT,
  semantic_categories TEXT[] DEFAULT NULL,
  key_entity TEXT DEFAULT NULL,
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
  semantic_category TEXT,
  key_entities TEXT[],
  applies_when JSONB,
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
      -- Máxima prioridad: municipio específico + categoría semántica correcta
      WHEN municipality_name IS NOT NULL 
           AND municipality_name = ANY(lc.affected_municipalities)
           AND (semantic_categories IS NULL OR lc.semantic_category = ANY(semantic_categories))
        THEN 3.0
      -- Alta prioridad: entidad clave coincide
      WHEN key_entity IS NOT NULL 
           AND key_entity = ANY(lc.key_entities)
        THEN 2.5
      -- Prioridad media: provincia + categoría
      WHEN province_name IS NOT NULL 
           AND province_name = ANY(lc.affected_provinces)
        THEN 2.0
      -- Prioridad normal: búsqueda por texto
      ELSE ts_rank(lc.search_vector, plainto_tsquery('spanish', search_query))
    END AS rank
  FROM public.legal_chunks lc
  JOIN public.legal_documents ld ON ld.id = lc.document_id
  WHERE 
    ld.is_active = true
    AND ld.superseded_by_id IS NULL -- Excluir documentos obsoletos
    AND (ld.expiration_date IS NULL OR ld.expiration_date >= CURRENT_DATE) -- Excluir caducados
    AND (
      -- Buscar por texto completo
      lc.search_vector @@ plainto_tsquery('spanish', search_query)
      OR
      -- O si el municipio está en el array
      (municipality_name IS NOT NULL AND municipality_name = ANY(lc.affected_municipalities))
      OR
      -- O si la provincia está en el array
      (province_name IS NOT NULL AND province_name = ANY(lc.affected_provinces))
      OR
      -- O si la entidad clave coincide
      (key_entity IS NOT NULL AND key_entity = ANY(lc.key_entities))
    )
    -- Filtrar por categorías semánticas si se especifican
    AND (semantic_categories IS NULL OR lc.semantic_category = ANY(semantic_categories))
  ORDER BY rank DESC
  LIMIT match_count;
$$;

-- =============================================
-- FASE 4: Índices para mejorar rendimiento
-- =============================================

-- Índice para búsqueda por categoría semántica
CREATE INDEX IF NOT EXISTS idx_legal_chunks_semantic_category 
ON public.legal_chunks(semantic_category);

-- Índice GIN para búsqueda en key_entities
CREATE INDEX IF NOT EXISTS idx_legal_chunks_key_entities 
ON public.legal_chunks USING GIN(key_entities);

-- Índice para documentos obsoletos
CREATE INDEX IF NOT EXISTS idx_legal_documents_superseded 
ON public.legal_documents(superseded_by_id) WHERE superseded_by_id IS NOT NULL;

-- Índice para documentos caducados
CREATE INDEX IF NOT EXISTS idx_legal_documents_expiration 
ON public.legal_documents(expiration_date) WHERE expiration_date IS NOT NULL;
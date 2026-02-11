
-- Create document_relations table for rich inter-document relationships
CREATE TABLE public.document_relations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_document_id uuid REFERENCES public.legal_documents(id) ON DELETE CASCADE NOT NULL,
  target_document_id uuid REFERENCES public.legal_documents(id) ON DELETE CASCADE NOT NULL,
  relation_type text NOT NULL,
  affected_articles text[] DEFAULT '{}',
  description text,
  detected_by text DEFAULT 'ai',
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_document_id, target_document_id, relation_type)
);

-- Enable RLS
ALTER TABLE public.document_relations ENABLE ROW LEVEL SECURITY;

-- Admins can manage relations
CREATE POLICY "Admins can manage document_relations"
ON public.document_relations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view relations of active documents
CREATE POLICY "Authenticated users can view document_relations"
ON public.document_relations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.legal_documents
    WHERE legal_documents.id = document_relations.source_document_id
    AND legal_documents.is_active = true
  )
);

-- Add source_type column to legal_documents for multi-format support
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'pdf';
ALTER TABLE public.legal_documents ADD COLUMN IF NOT EXISTS source_url text;

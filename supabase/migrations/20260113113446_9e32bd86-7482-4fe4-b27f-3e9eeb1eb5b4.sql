-- Add processed_document_id column to link BOE publications with processed legal documents
ALTER TABLE public.boe_publications 
ADD COLUMN IF NOT EXISTS processed_document_id uuid REFERENCES public.legal_documents(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_boe_publications_processed_document_id 
ON public.boe_publications(processed_document_id);
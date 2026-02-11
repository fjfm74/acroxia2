
ALTER TABLE public.legal_documents 
ADD COLUMN processing_status text DEFAULT 'completed',
ADD COLUMN processing_error text,
ADD COLUMN processing_started_at timestamptz,
ADD COLUMN processing_completed_at timestamptz;

-- Mark existing documents as completed
UPDATE public.legal_documents SET processing_status = 'completed' WHERE processing_status IS NULL;

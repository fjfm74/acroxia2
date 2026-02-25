UPDATE public.legal_documents 
SET processing_status = 'error', 
    processing_error = 'Timeout: extracción PDF interrumpida. Usar reprocesar.',
    processing_completed_at = now()
WHERE id = '4861a430-dd0d-4813-bf63-847c5c81b688';
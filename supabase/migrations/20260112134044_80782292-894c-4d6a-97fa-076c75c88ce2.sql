-- Drop client_id column from contracts table
ALTER TABLE public.contracts DROP COLUMN IF EXISTS client_id;

-- Drop clients table
DROP TABLE IF EXISTS public.clients;
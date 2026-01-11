-- Add unsubscribe tracking fields to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS unsubscribe_reason TEXT,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
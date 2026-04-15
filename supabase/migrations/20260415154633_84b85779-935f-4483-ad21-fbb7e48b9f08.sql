ALTER TABLE public.anonymous_analyses
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paddle_transaction_id text;
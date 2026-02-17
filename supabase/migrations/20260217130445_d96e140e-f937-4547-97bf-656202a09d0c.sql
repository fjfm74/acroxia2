-- Add howto_steps JSONB column to blog_posts for dynamic HowTo schema
-- Format: [{"name": "Step title", "text": "Step description"}]
ALTER TABLE public.blog_posts
ADD COLUMN howto_steps jsonb DEFAULT NULL;

-- Add howto_name for the HowTo title
ALTER TABLE public.blog_posts
ADD COLUMN howto_name text DEFAULT NULL;

-- Add howto_total_time for estimated duration (ISO 8601, e.g. "PT30M", "P1D")
ALTER TABLE public.blog_posts
ADD COLUMN howto_total_time text DEFAULT NULL;
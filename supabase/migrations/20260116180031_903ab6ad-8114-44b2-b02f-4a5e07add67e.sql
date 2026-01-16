-- Add audience column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'inquilino';

-- Add check constraint for valid audiences
ALTER TABLE public.blog_posts 
ADD CONSTRAINT blog_posts_audience_check 
CHECK (audience IN ('inquilino', 'propietario'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_audience ON public.blog_posts(audience);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_audience ON public.blog_posts(status, audience);
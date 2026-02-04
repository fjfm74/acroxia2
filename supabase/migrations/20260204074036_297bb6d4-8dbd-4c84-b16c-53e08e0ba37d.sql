-- Add faqs column to blog_posts for FAQ schema support
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.blog_posts.faqs IS 'Array of FAQ objects with question and answer fields for FAQPage schema';
-- Add name column to blog_subscribers for personalized greetings
ALTER TABLE public.blog_subscribers
ADD COLUMN name text;
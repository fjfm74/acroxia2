-- Create authors table for E-E-A-T
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  role text NOT NULL,
  bio text NOT NULL,
  avatar_url text,
  linkedin_url text,
  twitter_url text,
  credentials text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Anyone can view authors (public information for E-E-A-T)
CREATE POLICY "Anyone can view authors"
ON public.authors
FOR SELECT
USING (true);

-- Only admins can manage authors
CREATE POLICY "Admins can manage authors"
ON public.authors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_authors_updated_at
BEFORE UPDATE ON public.authors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add author reference to blog_posts
ALTER TABLE public.blog_posts
ADD COLUMN blog_author_id uuid REFERENCES public.authors(id);

-- Create index for performance
CREATE INDEX idx_blog_posts_blog_author_id ON public.blog_posts(blog_author_id);
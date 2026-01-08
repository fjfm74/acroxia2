-- Create enum for blog post status
CREATE TYPE public.blog_post_status AS ENUM ('draft', 'published');

-- Create enum for document jurisdiction (extending legal_doc_type)
CREATE TYPE public.legal_jurisdiction AS ENUM ('jurisprudencia', 'estatal', 'autonomica', 'provincial', 'local');

-- Add jurisdiction column to legal_documents
ALTER TABLE public.legal_documents 
ADD COLUMN jurisdiction legal_jurisdiction DEFAULT 'estatal';

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT,
  read_time TEXT NOT NULL DEFAULT '5 min',
  meta_description TEXT,
  keywords TEXT[] DEFAULT '{}',
  status blog_post_status NOT NULL DEFAULT 'draft',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read published posts
CREATE POLICY "Anyone can view published posts"
ON public.blog_posts
FOR SELECT
USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage all posts"
ON public.blog_posts
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for slug lookups
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
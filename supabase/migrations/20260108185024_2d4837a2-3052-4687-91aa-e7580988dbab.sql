-- Create enum for social platforms
CREATE TYPE social_platform AS ENUM ('instagram', 'tiktok', 'facebook', 'linkedin', 'twitter');

-- Create enum for social content types
CREATE TYPE social_content_type AS ENUM ('post', 'carousel', 'story', 'reel_script', 'thread');

-- Create enum for social post status
CREATE TYPE social_post_status AS ENUM ('draft', 'ready', 'published');

-- Create social_posts table
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  platform social_platform NOT NULL,
  content_type social_content_type NOT NULL,
  caption TEXT,
  slides JSONB DEFAULT '[]'::jsonb,
  hashtags TEXT[] DEFAULT '{}'::text[],
  image_urls TEXT[] DEFAULT '{}'::text[],
  source_blog_id UUID REFERENCES public.blog_posts(id) ON DELETE SET NULL,
  status social_post_status NOT NULL DEFAULT 'draft',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for admins only
CREATE POLICY "Admins can manage social posts"
  ON public.social_posts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for social images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('social-images', 'social-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for social-images bucket
CREATE POLICY "Anyone can view social images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'social-images');

CREATE POLICY "Admins can upload social images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'social-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update social images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'social-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete social images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'social-images' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );
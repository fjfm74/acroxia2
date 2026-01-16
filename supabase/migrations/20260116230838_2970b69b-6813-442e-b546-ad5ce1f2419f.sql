-- Create blog_subscribers table for newsletter subscriptions
CREATE TABLE public.blog_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  audience TEXT NOT NULL CHECK (audience IN ('inquilino', 'propietario')),
  confirmed BOOLEAN DEFAULT false,
  confirmation_token UUID DEFAULT gen_random_uuid(),
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribe_reason TEXT,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  UNIQUE(email, audience)
);

-- Enable RLS
ALTER TABLE public.blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can subscribe (insert)
CREATE POLICY "Anyone can subscribe to blog" 
ON public.blog_subscribers
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Policy: Service role has full access for edge functions
CREATE POLICY "Service role full access to blog_subscribers" 
ON public.blog_subscribers
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_blog_subscribers_audience_confirmed ON public.blog_subscribers(audience, confirmed, unsubscribed);
CREATE INDEX idx_blog_subscribers_confirmation_token ON public.blog_subscribers(confirmation_token);
CREATE INDEX idx_blog_subscribers_email ON public.blog_subscribers(email);
-- Permitir a los admins ver todos los suscriptores del blog
CREATE POLICY "Admins can view blog_subscribers"
  ON public.blog_subscribers
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir a los admins actualizar suscriptores (para gestionar bajas, etc.)
CREATE POLICY "Admins can update blog_subscribers"
  ON public.blog_subscribers
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir a los admins eliminar suscriptores si es necesario
CREATE POLICY "Admins can delete blog_subscribers"
  ON public.blog_subscribers
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
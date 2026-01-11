-- Políticas RLS para scheduled_posts (solo admins pueden gestionar)
CREATE POLICY "Admins can view scheduled posts" 
ON public.scheduled_posts 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert scheduled posts" 
ON public.scheduled_posts 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update scheduled posts" 
ON public.scheduled_posts 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete scheduled posts" 
ON public.scheduled_posts 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- También permitir que el service role (edge functions) pueda operar
CREATE POLICY "Service role can manage scheduled posts" 
ON public.scheduled_posts 
FOR ALL 
USING (auth.role() = 'service_role');
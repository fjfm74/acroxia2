-- Create site_config table for dynamic public information
CREATE TABLE public.site_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Public can read (this is public information)
CREATE POLICY "Anyone can read site config"
  ON public.site_config
  FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can modify site config"
  ON public.site_config
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_site_config_updated_at
  BEFORE UPDATE ON public.site_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial B2C plans
INSERT INTO public.site_config (key, value) VALUES (
  'b2c_plans',
  '[
    {
      "name": "Gratis",
      "price": "0€",
      "description": "Análisis básico gratuito",
      "features": ["1 análisis incluido", "Detección de cláusulas básicas", "Informe simplificado"]
    },
    {
      "name": "Análisis Único",
      "price": "39,99€",
      "description": "Análisis completo de un contrato",
      "features": ["1 análisis profesional", "Detección completa de cláusulas abusivas", "Informe detallado con recomendaciones", "Soporte por email"]
    },
    {
      "name": "Pack Comparador",
      "price": "79,99€",
      "description": "Compara hasta 3 contratos",
      "features": ["3 análisis profesionales", "Comparativa entre contratos", "Informe detallado por contrato", "Soporte prioritario"]
    },
    {
      "name": "Suscripción Anual",
      "price": "12,99€/año",
      "description": "Análisis ilimitados durante un año",
      "features": ["Análisis ilimitados", "Todas las funcionalidades premium", "Soporte prioritario", "Acceso a nuevas funciones"]
    }
  ]'::jsonb
);

-- Insert initial B2B plans
INSERT INTO public.site_config (key, value) VALUES (
  'b2b_plans',
  '[
    {
      "name": "Plan Profesional",
      "price": "299€/mes",
      "description": "Para inmobiliarias y gestores",
      "features": ["Análisis ilimitados", "Panel de gestión de clientes", "Opción white-label", "API de integración", "Soporte dedicado"]
    },
    {
      "name": "Plan Gestoría",
      "price": "149€/mes",
      "description": "Para abogados y asesores",
      "features": ["50 análisis/mes", "Informes personalizables", "Integración con CRM", "Soporte prioritario"]
    }
  ]'::jsonb
);

-- Insert company info
INSERT INTO public.site_config (key, value) VALUES (
  'company_info',
  '{
    "name": "ACROXIA",
    "description": "Herramienta de análisis de contratos de alquiler con inteligencia artificial",
    "email": "contacto@acroxia.com",
    "phone": "+34 93 XXX XX XX",
    "address": "Barcelona, España",
    "schedule": {
      "weekdays": "Lunes a Viernes: 9:00 - 18:00",
      "weekends": "Sábados y Domingos: Cerrado"
    },
    "response_time": "Respondemos en menos de 24 horas laborables",
    "how_it_works": [
      "Sube tu contrato de alquiler en PDF o imagen",
      "Nuestra IA analiza el documento buscando cláusulas problemáticas",
      "Recibe un informe detallado con recomendaciones"
    ],
    "accepted_formats": ["PDF", "JPG", "PNG", "JPEG"]
  }'::jsonb
);

-- Insert assistant config
INSERT INTO public.site_config (key, value) VALUES (
  'assistant_config',
  '{
    "welcome_message": "¡Hola! Soy el asistente de ACROXIA. Puedo ayudarte con información sobre nuestros planes, precios y cómo funciona el servicio. ¿En qué puedo ayudarte?",
    "bubble_message": "¿Dudas sobre nuestros planes?",
    "cannot_help_message": "Esa consulta no la puedo resolver. Si quieres, puedo ponerte en contacto con nuestro equipo para que te ayuden personalmente.",
    "contact_success_message": "¡Perfecto! Hemos recibido tu mensaje. Nuestro equipo te contactará pronto."
  }'::jsonb
);
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
  email: z.string()
    .trim()
    .email({ message: "Introduce un email válido" })
    .max(255, { message: "El email no puede exceder 255 caracteres" }),
  subject: z.string()
    .trim()
    .min(5, { message: "El asunto debe tener al menos 5 caracteres" })
    .max(200, { message: "El asunto no puede exceder 200 caracteres" }),
  message: z.string()
    .trim()
    .min(20, { message: "El mensaje debe tener al menos 20 caracteres" })
    .max(2000, { message: "El mensaje no puede exceder 2000 caracteres" }),
  // Honeypot field - should remain empty
  website: z.string().max(0, { message: "" }).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      website: "", // Honeypot
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    // Honeypot check - if filled, silently reject (bots fill hidden fields)
    if (data.website && data.website.length > 0) {
      // Fake success to not alert bots
      setSubmitStatus('success');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'contact',
          to: 'contacto@acroxia.com',
          data: {
            userName: data.name,
            email: data.email,
            subject: data.subject,
            message: data.message,
          },
        },
      });

      if (error) throw error;

      setSubmitStatus('success');
      form.reset();
    } catch (error) {
      console.error('Error sending contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-foreground mb-2">
          ¡Mensaje enviado!
        </h3>
        <p className="text-muted-foreground mb-6">
          Hemos recibido tu consulta. Te responderemos en un plazo de 24-48 horas laborables.
        </p>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => setSubmitStatus('idle')}
        >
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background border border-border rounded-2xl p-6 md:p-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Tu nombre"
                      {...field}
                      className="rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      {...field}
                      className="rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asunto *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="¿En qué podemos ayudarte?"
                    {...field}
                    className="rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensaje *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe tu consulta con el mayor detalle posible..."
                    rows={5}
                    {...field}
                    className="rounded-xl resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Honeypot field - hidden from humans, visible to bots */}
          <div 
            className="absolute -left-[9999px] opacity-0 h-0 w-0 overflow-hidden"
            aria-hidden="true"
            tabIndex={-1}
          >
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (leave empty)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="off"
                      tabIndex={-1}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {submitStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Ha ocurrido un error. Por favor, inténtalo de nuevo.</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar mensaje
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Al enviar este formulario aceptas nuestra{" "}
            <a href="/privacidad" className="underline hover:text-foreground">
              política de privacidad
            </a>
          </p>
        </form>
      </Form>
    </div>
  );
};

export default ContactForm;

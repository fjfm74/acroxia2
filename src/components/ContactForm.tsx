import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Send, CheckCircle, AlertCircle, User, Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { trackConversion } from "@/lib/analytics";
import { emailSchema, fullNameSchema, phoneSchema, userTypeSchema } from "@/lib/validations";

const contactSchema = z.object({
  name: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  userType: userTypeSchema,
  subject: z.string()
    .trim()
    .min(5, { message: "El asunto debe tener al menos 5 caracteres" })
    .max(200, { message: "El asunto no puede exceder 200 caracteres" }),
  message: z.string()
    .trim()
    .min(20, { message: "El mensaje debe tener al menos 20 caracteres" })
    .max(2000, { message: "El mensaje no puede exceder 2000 caracteres" }),
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar la política de privacidad" }),
  }),
  marketingConsent: z.boolean().default(false),
  // Honeypot field - should remain empty
  website: z.string().max(0, { message: "" }).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const userTypeOptions = [
  { value: "inquilino", label: "Inquilino", icon: User },
  { value: "propietario", label: "Propietario", icon: Home },
  { value: "profesional", label: "Profesional", icon: Briefcase },
] as const;

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'rate_limited'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      userType: undefined,
      subject: "",
      message: "",
      privacyConsent: undefined as unknown as true,
      marketingConsent: false,
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
    setErrorMessage(null);

    try {
      // Capture IP for audit trail
      let ipAddress = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        ipAddress = ipData.ip || "";
      } catch {
        // IP capture is optional, continue without it
      }

      // Send contact email
      const { data: responseData, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'contact',
          to: 'contacto@acroxia.com',
          data: {
            userName: data.name,
            email: data.email,
            phone: data.phone || "No proporcionado",
            userType: data.userType,
            subject: data.subject,
            message: data.message,
            marketingConsent: data.marketingConsent,
          },
        },
      });

      if (error) {
        // Check if it's a rate limit error (429)
        if (error.message?.includes('429') || responseData?.rateLimited) {
          setSubmitStatus('rate_limited');
          setErrorMessage(responseData?.error || 'Has enviado demasiados mensajes. Por favor, espera una hora.');
          return;
        }
        throw error;
      }

      // Save to marketing_contacts if marketing consent given
      if (data.marketingConsent) {
        await supabase.from("marketing_contacts").insert({
          email: data.email,
          contact_name: data.name,
          phone: data.phone || null,
          segment: "otro",
          source: "contact_form",
          consent_type: "explicit_consent",
          consent_details: `Consentimiento explícito vía formulario de contacto. IP: ${ipAddress}. Tipo: ${data.userType}. Fecha: ${new Date().toISOString()}`,
          tags: [data.userType, "contacto_web"],
          notes: `Asunto: ${data.subject}\n\nMensaje: ${data.message}`,
        });
      }

      // Record privacy consent in audit log
      await supabase.from("consent_logs").insert({
        user_id: "00000000-0000-0000-0000-000000000000", // Anonymous user placeholder
        consent_type: "contact_form_privacy",
        accepted: true,
        user_agent: navigator.userAgent,
        ip_address: ipAddress,
        document_version: "2026-01-19",
        metadata: {
          email: data.email,
          name: data.name,
          user_type: data.userType,
          marketing_consent: data.marketingConsent,
          subject: data.subject,
        },
      });

      // Track contact form submission
      trackConversion('contact_submitted', {
        subject: data.subject,
        userType: data.userType,
        marketingConsent: data.marketingConsent,
      });

      setSubmitStatus('success');
      form.reset();
    } catch (error: unknown) {
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
          {/* Name and Email */}
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

          {/* Phone (optional) */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono (opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+34 600 000 000"
                    {...field}
                    className="rounded-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* User Type Selector */}
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Soy principalmente... *</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-3 gap-2">
                    {userTypeOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = field.value === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-border bg-background text-foreground hover:border-foreground/50"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subject */}
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

          {/* Message */}
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

          {/* Privacy Consent (mandatory) */}
          <FormField
            control={form.control}
            name="privacyConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    He leído y acepto la{" "}
                    <Link to="/privacidad" className="underline hover:text-foreground" target="_blank">
                      Política de Privacidad
                    </Link>{" "}
                    y el tratamiento de mis datos para gestionar mi consulta. *
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Marketing Consent (optional) */}
          <FormField
            control={form.control}
            name="marketingConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal cursor-pointer">
                    Acepto recibir comunicaciones comerciales y novedades de ACROXIA. Puedo darme de baja en cualquier momento.
                  </FormLabel>
                </div>
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

          {submitStatus === 'rate_limited' && (
            <div className="flex items-center gap-2 text-amber-700 text-sm bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage || 'Has enviado demasiados mensajes. Por favor, espera una hora.'}</span>
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
            Tus datos serán tratados por ACROXIA para gestionar tu consulta.{" "}
            <Link to="/privacidad" className="underline hover:text-foreground">
              Más información
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
};

export default ContactForm;

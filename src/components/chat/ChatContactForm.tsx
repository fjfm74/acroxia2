import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, X } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email no válido"),
  message: z.string().min(10, "Mínimo 10 caracteres"),
});

type FormData = z.infer<typeof formSchema>;

interface ChatContactFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialMessage?: string;
}

const ChatContactForm = ({ onClose, onSuccess, initialMessage }: ChatContactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: initialMessage || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "contact",
          to: "contacto@acroxia.com",
          data: {
            name: data.name,
            email: data.email,
            subject: "Consulta desde el asistente virtual",
            message: data.message,
          },
        },
      });

      if (error) throw error;
      
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("Error sending contact form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 text-center">
        <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
        <p className="text-sm text-charcoal font-medium">
          ¡Mensaje enviado!
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Te contactaremos pronto.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 bg-muted/50 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-charcoal">Formulario de contacto</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Tu nombre"
                    className="h-9 text-sm bg-cream border-charcoal/10"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Tu email"
                    className="h-9 text-sm bg-cream border-charcoal/10"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="¿En qué podemos ayudarte?"
                    className="min-h-[60px] text-sm bg-cream border-charcoal/10 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="w-full h-9 text-sm rounded-full bg-charcoal text-cream hover:bg-charcoal/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar mensaje"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChatContactForm;

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FadeIn from "@/components/animations/FadeIn";

const faqs = [
  {
    question: "¿Qué incluye el análisis gratuito?",
    answer:
      "El análisis gratuito identifica los tipos de cláusulas presentes en tu contrato (fianza, duración, gastos, etc.) y te proporciona un resumen general. Para obtener un informe detallado con recomendaciones específicas, necesitarás un análisis completo.",
  },
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer:
      "Sí, puedes actualizar tu plan en cualquier momento. Si pasas de un pack de análisis a la suscripción anual, los análisis restantes se convertirán en crédito para futuros servicios premium.",
  },
  {
    question: "¿Cómo funcionan los pagos?",
    answer:
      "Aceptamos tarjetas de crédito/débito y PayPal. Los pagos son procesados de forma segura a través de Stripe. Para planes empresariales, también ofrecemos facturación mensual o anual con transferencia bancaria.",
  },
  {
    question: "¿Ofrecéis factura para empresas?",
    answer:
      "Sí, todas las compras incluyen factura con IVA desglosado. Los planes B2B incluyen facturación personalizada con los datos fiscales de tu empresa.",
  },
  {
    question: "¿Qué pasa si no estoy satisfecho?",
    answer:
      "Ofrecemos garantía de devolución de 14 días en todos nuestros planes de pago. Si el análisis no cumple tus expectativas, te devolvemos el 100% de tu dinero.",
  },
  {
    question: "¿Los documentos que subo son confidenciales?",
    answer:
      "Absolutamente. Todos los documentos se procesan con encriptación end-to-end y se eliminan automáticamente tras el análisis. No almacenamos ni compartimos tu información con terceros.",
  },
];

const PricingFAQ = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-charcoal mb-4">
                Preguntas frecuentes
              </h2>
              <p className="text-charcoal/70">
                Todo lo que necesitas saber sobre nuestros planes
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-charcoal/10 rounded-xl px-6 data-[state=open]:bg-muted/50"
                >
                  <AccordionTrigger className="text-left font-medium text-charcoal hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-charcoal/70 pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

export default PricingFAQ;

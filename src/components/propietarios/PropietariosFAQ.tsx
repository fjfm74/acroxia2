import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import FadeIn from "@/components/animations/FadeIn";

const faqs = [
  {
    question: "¿El análisis es diferente para propietarios e inquilinos?",
    answer: "Sí. El análisis para propietarios se enfoca en verificar que el contrato cumple con la LAU desde la perspectiva del arrendador: que las garantías sean legales, que la duración y prórrogas estén correctamente establecidas, y que el contrato te proteja ante impagos o desperfectos.",
  },
  {
    question: "¿Cómo sé si mi inmueble está en zona tensionada?",
    answer: "Puedes verificarlo en el Sistema Estatal de Referencia de Precios de Alquiler de Vivienda (SERPAVI) del Ministerio de Vivienda: serpavi.mivau.gob.es. ACROXIA te indica si tu municipio aparece en las listas publicadas, pero la verificación oficial debe hacerse en la fuente.",
  },
  {
    question: "¿Puedo calcular la subida de renta con ACROXIA?",
    answer: "ACROXIA te informa sobre los límites aplicables (IRAV o tope autonómico), pero el cálculo exacto debe hacerse en la web oficial del INE o de tu Comunidad Autónoma. Te proporcionamos los enlaces directos para que puedas calcularlo fácilmente.",
  },
  {
    question: "¿El generador de contratos es válido legalmente?",
    answer: "El generador crea contratos basados en la LAU vigente y las mejores prácticas. Sin embargo, para situaciones complejas o si tienes dudas, recomendamos que un profesional legal revise el documento antes de firmarlo.",
  },
  {
    question: "¿Qué garantías puedo pedir legalmente?",
    answer: "Según la LAU 2026: fianza de 1-2 meses (según sea vivienda o uso distinto) y garantías adicionales hasta un máximo de 2 mensualidades de renta en vivienda habitual. ACROXIA verifica que tu contrato no exceda estos límites.",
  },
];

const PropietariosFAQ = () => {
  return (
    <section className="bg-muted py-20">
      <div className="container mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
              Preguntas frecuentes
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Dudas comunes de propietarios sobre ACROXIA
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background rounded-xl px-6 border-none shadow-sm"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default PropietariosFAQ;

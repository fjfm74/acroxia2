import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Wallet, Clock, CheckCircle2, AlertTriangle, ArrowRight, FileText, Calculator } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const pasos = [
  {
    numero: "01",
    titulo: "Entrega las llaves y documenta el estado",
    descripcion: "Haz fotos y vídeo del estado del piso. Si es posible, firma un acta de entrega con el propietario donde conste la fecha y el estado de la vivienda.",
    icono: FileText,
  },
  {
    numero: "02",
    titulo: "Espera el plazo legal de 30 días",
    descripcion: "El propietario tiene exactamente 30 días desde la entrega de llaves para devolverte la fianza. Este plazo está fijado por la LAU.",
    icono: Clock,
  },
  {
    numero: "03",
    titulo: "Reclama por escrito si no la devuelve",
    descripcion: "Pasados los 30 días, envía un burofax reclamando la devolución. A partir del día 31 se generan intereses legales a tu favor.",
    icono: AlertTriangle,
  },
  {
    numero: "04",
    titulo: "Acude a la OMIC o al juzgado",
    descripcion: "Si no responde, presenta reclamación en la OMIC o interpón un proceso monitorio (rápido y sin abogado para cantidades menores de 2.000€).",
    icono: Calculator,
  },
];

const motivosIlegales = [
  "Desgaste normal de la pintura por el paso del tiempo",
  "Marcas mínimas en paredes por cuadros o muebles",
  "Deterioro natural de electrodomésticos por uso normal",
  "Pequeños arañazos en el suelo por uso habitual",
  "Manchas de cal en grifería o sanitarios",
  "Amarilleamiento de plásticos o siliconas por el tiempo",
];

const faqs = [
  {
    question: "¿Cuánto tiempo tiene el casero para devolverme la fianza?",
    answer: "El propietario tiene exactamente 30 días naturales desde la entrega de llaves para devolverte la fianza. Este plazo está establecido en el artículo 36.4 de la LAU. Si no lo hace en ese plazo, empiezan a generarse intereses legales a tu favor."
  },
  {
    question: "¿Puede el casero quedarse mi fianza por el desgaste normal?",
    answer: "No. El desgaste normal derivado del uso habitual de la vivienda no justifica retener la fianza. La pintura ligeramente deteriorada, pequeñas marcas en paredes o el uso normal de electrodomésticos son desgaste natural, no daños imputables al inquilino."
  },
  {
    question: "¿Qué puedo hacer si no me devuelven la fianza en 30 días?",
    answer: "1) Envía un burofax certificado reclamando la devolución con intereses, 2) Presenta reclamación ante la OMIC de tu ayuntamiento, 3) Si sigue sin responder, interpón un proceso monitorio (sin abogado para menos de 2.000€). A partir del día 31 se generan intereses."
  },
  {
    question: "¿Cuánto dinero de fianza me pueden pedir legalmente?",
    answer: "La fianza legal obligatoria es de 1 mensualidad para vivienda habitual. Además, pueden pedir hasta 2 meses como garantía adicional. En total, máximo 3 meses. Cualquier cantidad superior es ilegal."
  },
  {
    question: "¿Puedo usar la fianza para pagar el último mes de alquiler?",
    answer: "No es recomendable ni legal. La fianza tiene una finalidad distinta: garantizar posibles daños o impagos. Si dejas de pagar el último mes, el propietario puede reclamarte judicialmente y generar intereses de demora."
  },
  {
    question: "¿Qué intereses me corresponden si no me devuelven la fianza a tiempo?",
    answer: "A partir del día 31, la fianza genera el interés legal del dinero (actualmente en torno al 3-4% anual). Estos intereses se calculan desde el día siguiente al vencimiento del plazo de 30 días hasta la devolución efectiva."
  },
];

const DevolucionFianza = () => {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Devolución de Fianza de Alquiler - Guía 2026",
    "description": "Guía completa sobre cómo recuperar la fianza de tu alquiler. Plazos legales, motivos de retención ilegales y cómo reclamar paso a paso.",
    "url": "https://acroxia.com/devolucion-fianza-alquiler",
    "mainEntity": {
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    }
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cómo recuperar la fianza de tu alquiler",
    "description": "Pasos para reclamar la devolución de la fianza si el casero no te la devuelve en 30 días",
    "totalTime": "P30D",
    "step": pasos.map((paso, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": paso.titulo,
      "text": paso.descripcion
    }))
  };

  return (
    <>
      <Helmet>
        <title>Devolución de Fianza de Alquiler 2026 | Cómo Recuperarla</title>
        <meta 
          name="description" 
          content="Guía completa para recuperar tu fianza de alquiler. Plazo legal de 30 días, motivos de retención ilegales y cómo reclamar paso a paso. Actualizado 2026." 
        />
        <meta 
          name="keywords" 
          content="devolución fianza alquiler, recuperar fianza, fianza no devuelta, plazo devolución fianza, reclamar fianza alquiler" 
        />
        <link rel="canonical" href="https://acroxia.com/devolucion-fianza-alquiler" />
        <script type="application/ld+json">
          {JSON.stringify(pageSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumbs 
          items={[
            { label: "Guías", href: "/faq" },
            { label: "Devolución de Fianza" }
          ]} 
        />
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 bg-muted">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Wallet className="w-4 h-4" />
                  Recupera tu dinero
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
                  Devolución de Fianza de Alquiler
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
                  Tu casero tiene 30 días para devolverte la fianza. Aprende cuándo pueden retenerla 
                  legalmente y cómo reclamar si no te la devuelven.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link to="/">
                      Analiza tu contrato gratis
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Key Info */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <FadeIn>
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                  <div className="text-center p-8 bg-green-50 border border-green-100 rounded-2xl">
                    <div className="text-4xl font-serif font-bold text-green-700 mb-2">30</div>
                    <div className="text-green-700 font-medium">días de plazo</div>
                    <p className="text-sm text-muted-foreground mt-2">Máximo legal para devolver la fianza</p>
                  </div>
                  <div className="text-center p-8 bg-amber-50 border border-amber-100 rounded-2xl">
                    <div className="text-4xl font-serif font-bold text-amber-700 mb-2">1</div>
                    <div className="text-amber-700 font-medium">mes de fianza legal</div>
                    <p className="text-sm text-muted-foreground mt-2">+ máximo 2 meses de garantía adicional</p>
                  </div>
                  <div className="text-center p-8 bg-blue-50 border border-blue-100 rounded-2xl">
                    <div className="text-4xl font-serif font-bold text-blue-700 mb-2">3-4%</div>
                    <div className="text-blue-700 font-medium">interés legal</div>
                    <p className="text-sm text-muted-foreground mt-2">Desde el día 31 si no te la devuelven</p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-12 text-center">
                  Cómo Recuperar tu Fianza Paso a Paso
                </h2>
              </FadeIn>
              <div className="space-y-6">
                {pasos.map((paso, index) => (
                  <FadeIn key={index} delay={index * 0.1}>
                    <div className="flex gap-6 p-6 bg-background rounded-2xl border border-border">
                      <div className="flex-shrink-0">
                        <span className="font-serif text-3xl font-bold text-muted-foreground/30">{paso.numero}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg mb-2">{paso.titulo}</h3>
                        <p className="text-muted-foreground">{paso.descripcion}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Illegal Retention Reasons */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-4 text-center">
                  Motivos Ilegales para Retener la Fianza
                </h2>
                <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                  El casero NO puede quedarse la fianza por desgaste normal. Estos son ejemplos de retenciones ilegales:
                </p>
              </FadeIn>
              <div className="grid sm:grid-cols-2 gap-4">
                {motivosIlegales.map((motivo, index) => (
                  <FadeIn key={index} delay={index * 0.05}>
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                      <CheckCircle2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{motivo}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-foreground text-background">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <FadeIn>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">
                  ¿Tu contrato tiene cláusulas sobre la fianza?
                </h2>
              </FadeIn>
              <FadeIn delay={0.1}>
                <p className="text-background/70 text-lg mb-8">
                  Analiza tu contrato con nuestra IA y descubre si hay cláusulas abusivas 
                  sobre la fianza, penalizaciones o garantías excesivas.
                </p>
              </FadeIn>
              <FadeIn delay={0.2}>
                <Button asChild size="lg" variant="secondary" className="rounded-full px-8 bg-background text-foreground hover:bg-background/90">
                  <Link to="/">
                    Analizar mi contrato gratis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <FadeIn>
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-10 text-center">
                  Preguntas Frecuentes sobre la Fianza
                </h2>
              </FadeIn>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, index) => (
                  <FadeIn key={index} delay={index * 0.05}>
                    <AccordionItem
                      value={`faq-${index}`}
                      className="border border-border rounded-xl px-6 bg-background data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="text-left font-medium text-foreground hover:no-underline py-5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </FadeIn>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default DevolucionFianza;

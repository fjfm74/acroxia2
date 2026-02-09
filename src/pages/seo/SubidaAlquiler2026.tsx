import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, Calculator, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedTenantGuides from "@/components/seo/RelatedTenantGuides";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const comparativaIndices = [
  { indice: "IRAV 2026", valor: "~2,2%", descripcion: "Índice de Referencia de Arrendamientos de Vivienda", aplica: true },
  { indice: "IPC general", valor: "~3,5%", descripcion: "Ya no aplica para alquileres de vivienda habitual", aplica: false },
  { indice: "Tope 2024", valor: "3%", descripcion: "Límite temporal que ya no está vigente", aplica: false },
  { indice: "Tope 2023", valor: "2%", descripcion: "Límite temporal que ya no está vigente", aplica: false },
];

const queHacer = [
  {
    situacion: "El casero quiere subir más del IRAV",
    accion: "Puedes negarte. Según la normativa vigente, la subida estaría limitada al IRAV. Comunica por escrito que solo aceptas la subida conforme a la ley.",
    legal: false,
  },
  {
    situacion: "No te avisan con 1 mes de antelación",
    accion: "La subida no puede aplicarse ese mes. Deben esperar al siguiente período de actualización.",
    legal: false,
  },
  {
    situacion: "Aplican IPC en lugar de IRAV",
    accion: "Desde 2024, el IPC no aplica para vivienda habitual. Según la normativa actual, el IRAV sería el índice aplicable para actualizar la renta.",
    legal: false,
  },
  {
    situacion: "El contrato dice \"subida según IPC\"",
    accion: "En principio, la ley prevalece sobre el contrato. Según la normativa, la subida estaría limitada al IRAV.",
    legal: true,
  },
];

const faqs = [
  {
    question: "¿Cuánto puede subir mi alquiler en 2026?",
    answer: "Máximo el IRAV, que actualmente ronda el 2,2%. Según la normativa vigente, tu casero no podría aplicar una subida superior a este porcentaje en la actualización anual de la renta."
  },
  {
    question: "¿Qué es el IRAV y cómo funciona?",
    answer: "El IRAV es el nuevo índice creado por la Ley de Vivienda 2023 para sustituir al IPC en las actualizaciones de alquiler. Es más estable que el IPC y está diseñado específicamente para el mercado de la vivienda. Lo publica mensualmente el INE."
  },
  {
    question: "¿El IRAV aplica a todos los contratos de alquiler?",
    answer: "El IRAV aplica a contratos de vivienda habitual. No aplica a locales comerciales, oficinas, viviendas turísticas ni otros usos distintos de vivienda habitual, que pueden pactar libremente el índice de actualización."
  },
  {
    question: "¿Con cuánto tiempo deben avisarme de la subida?",
    answer: "Mínimo 1 mes de antelación. El propietario debe comunicarte la subida con al menos 1 mes de antelación a la fecha de actualización (normalmente el aniversario del contrato). Si no te avisa a tiempo, la subida no puede aplicarse hasta el siguiente período."
  },
  {
    question: "Mi contrato dice \"subida según IPC\", ¿qué aplica?",
    answer: "Aplica el IRAV. Aunque tu contrato mencione el IPC, desde 2024 la subida máxima para vivienda habitual es el IRAV. Según la normativa vigente, no podrían aplicarte el IPC aunque lo ponga en el contrato."
  },
  {
    question: "¿Qué diferencia hay entre IRAV e IPC?",
    answer: "El IPC mide la inflación general de la economía y puede ser muy volátil (llegó al 10% en 2022). El IRAV está diseñado específicamente para vivienda y es más estable, rondando el 2-3%. El IRAV protege mejor a los inquilinos de subidas bruscas."
  },
  {
    question: "¿Pueden subirme el alquiler fuera de la actualización anual?",
    answer: "No. Durante la vigencia del contrato, solo pueden actualizar la renta en la fecha de aniversario y conforme al IRAV. Cualquier otra subida fuera de estos términos podría considerarse contraria a la normativa."
  },
  {
    question: "¿Qué hago si la subida es abusiva?",
    answer: "1) Verifica que no supera el IRAV, 2) Comunica por escrito que rechazas la subida ilegal, 3) Paga solo la renta + IRAV, 4) Si insisten, acude a la OMIC o Consumo. No pagues la diferencia mientras reclamas."
  },
];

const SubidaAlquiler2026 = () => {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://acroxia.com/subida-alquiler-2026",
    "name": "Subida de Alquiler 2026 - IRAV y Límites Legales",
    "description": "Guía completa sobre la subida de alquiler en 2026. IRAV actual, límites legales, cómo calcular la subida y qué hacer si es abusiva.",
    "url": "https://acroxia.com/subida-alquiler-2026",
    "datePublished": "2026-01-01",
    "dateModified": "2026-02-09",
    "inLanguage": "es-ES",
    "publisher": {
      "@type": "Organization",
      "name": "ACROXIA",
      "url": "https://acroxia.com"
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": "ACROXIA",
      "url": "https://acroxia.com"
    },
    "mainEntity": {
      "@type": "Article",
      "@id": "https://acroxia.com/subida-alquiler-2026#article"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": "https://acroxia.com/subida-alquiler-2026#article",
    "headline": "Subida de Alquiler 2026: IRAV, Límites Legales y Cómo Calcularla",
    "description": "¿Cuánto puede subir tu alquiler en 2026? El IRAV limita la subida al 2,2%. Guía completa sobre límites legales y cómo reclamar subidas abusivas.",
    "datePublished": "2026-01-01",
    "dateModified": "2026-02-09",
    "author": {
      "@type": "Organization",
      "name": "ACROXIA",
      "url": "https://acroxia.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ACROXIA",
      "url": "https://acroxia.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://acroxia.com/acroxia-logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://acroxia.com/subida-alquiler-2026"
    },
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".speakable-summary"]
    },
    "inLanguage": "es-ES"
  };

  return (
    <>
      <Helmet>
        <html lang="es-ES" />
        <title>Subida de Alquiler 2026 | IRAV, Límites y Cómo Calcularla</title>
        <meta 
          name="description" 
          content="¿Cuánto puede subir tu alquiler en 2026? Máximo el IRAV (2,2%). Guía completa sobre límites legales, cálculo y cómo reclamar subidas abusivas." 
        />
        <meta 
          name="keywords" 
          content="subida alquiler 2026, IRAV 2026, límite subida alquiler, actualización renta, cuánto puede subir alquiler, IPC alquiler 2026" 
        />
        <link rel="canonical" href="https://acroxia.com/subida-alquiler-2026" />
        <link rel="alternate" hrefLang="es-ES" href="https://acroxia.com/subida-alquiler-2026" />
        <link rel="alternate" hrefLang="x-default" href="https://acroxia.com/subida-alquiler-2026" />
        <meta property="og:title" content="Subida de Alquiler 2026: IRAV, Límites y Cómo Calcularla" />
        <meta property="og:description" content="¿Cuánto puede subir tu alquiler en 2026? Máximo el IRAV (2,2%)." />
        <meta property="og:url" content="https://acroxia.com/subida-alquiler-2026" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
        <meta property="og:locale" content="es_ES" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@acroxia" />
        <meta name="twitter:title" content="Subida Alquiler 2026 | IRAV 2,2%" />
        <meta name="twitter:description" content="Límite legal de subida anual. Qué hacer ante subidas abusivas." />
        <meta name="twitter:image" content="https://acroxia.com/og-image.jpg" />
        
        <script type="application/ld+json">
          {JSON.stringify(pageSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumbs 
          items={[
            { label: "Guías para Inquilinos", href: "/faq" },
            { label: "Subida Alquiler 2026" }
          ]} 
        />
        
        {/* Hero Section */}
        <section className="pb-20 bg-muted">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <TrendingUp className="w-4 h-4" />
                  Actualizado enero 2026
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
                  Subida de Alquiler 2026
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                {/* TL;DR Speakable Summary */}
                <div className="speakable-summary bg-background/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-border">
                  <p className="text-lg text-foreground font-medium">
                    <strong>Resumen rápido:</strong> En 2026, la subida máxima del alquiler es el IRAV (aproximadamente 2,2%). 
                    Este índice ha sustituido al IPC para vivienda habitual. El propietario debe avisarte con 1 mes 
                    de antelación y no puede aplicar subidas superiores aunque el contrato mencione el IPC.
                  </p>
                </div>
              </FadeIn>
              <FadeIn delay={0.25}>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                  <Calendar className="w-4 h-4" />
                  <span>Última actualización: enero 2026</span>
                </div>
              </FadeIn>
              <FadeIn delay={0.3}>
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link to="/analizar-gratis">
                    Analiza tu contrato gratis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* IRAV Highlight */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <div className="bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100 rounded-3xl p-8 md:p-12 text-center mb-16">
                  <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm font-medium text-blue-700 mb-6">
                    <Calendar className="w-4 h-4" />
                    IRAV Enero 2026
                  </div>
                  <div className="text-6xl md:text-7xl font-serif font-bold text-foreground mb-4">
                    2,2%
                  </div>
                  <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                    Subida máxima permitida para la actualización anual de tu contrato de alquiler de vivienda habitual
                  </p>
                </div>
              </FadeIn>

              {/* Comparison Table */}
              <FadeIn delay={0.1}>
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-8 text-center">
                  Comparativa de Índices 2026
                </h2>
              </FadeIn>
              <div className="space-y-4">
                {comparativaIndices.map((item, index) => (
                  <FadeIn key={index} delay={0.1 + index * 0.05}>
                    <div className={`flex items-center justify-between p-5 rounded-xl border ${
                      item.aplica 
                        ? "bg-green-50 border-green-100" 
                        : "bg-muted/50 border-border"
                    }`}>
                      <div className="flex items-center gap-4">
                        {item.aplica ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">{item.indice}</p>
                          <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                        </div>
                      </div>
                      <div className={`text-2xl font-serif font-bold ${
                        item.aplica ? "text-green-700" : "text-muted-foreground"
                      }`}>
                        {item.valor}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What to do Section */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-12 text-center">
                  ¿Qué Hacer Ante una Subida?
                </h2>
              </FadeIn>
              <div className="space-y-4">
                {queHacer.map((item, index) => (
                  <FadeIn key={index} delay={index * 0.1}>
                    <div className="p-6 bg-background rounded-2xl border border-border">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                          item.legal ? "text-amber-500" : "text-red-500"
                        }`} />
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">{item.situacion}</h3>
                          <p className="text-muted-foreground">{item.accion}</p>
                        </div>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              {/* Contextual links to related guides */}
              <FadeIn delay={0.5}>
                <div className="mt-12 p-6 bg-background rounded-2xl border border-border">
                  <h3 className="font-semibold text-foreground mb-3">¿Otras cláusulas problemáticas en tu contrato?</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Si además de subidas abusivas detectas otras irregularidades, consulta nuestra guía completa sobre 
                    <Link to="/clausulas-abusivas-alquiler" className="text-foreground underline underline-offset-4 mx-1 hover:text-foreground/80">
                      cláusulas abusivas en contratos de alquiler
                    </Link>
                    para conocer todos tus derechos.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Calculator CTA */}
        <section className="py-20 bg-foreground text-background">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <FadeIn>
                <Calculator className="w-12 h-12 mx-auto mb-6 text-background/70" />
                <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">
                  ¿Tu contrato tiene cláusulas de subida abusivas?
                </h2>
              </FadeIn>
              <FadeIn delay={0.1}>
                <p className="text-background/70 text-lg mb-8">
                  Analiza tu contrato con nuestra IA y descubre si las cláusulas de actualización 
                  de renta cumplen con la normativa o podrían ser contrarias a ella.
                </p>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="rounded-full px-8 bg-background text-foreground hover:bg-background/90">
                    <Link to="/analizar-gratis">
                      Analizar mi contrato gratis
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="ghost" className="rounded-full px-8 text-background border border-background/20 hover:bg-background/10">
                    <Link to="/faq">
                      Ver más preguntas frecuentes
                    </Link>
                  </Button>
                </div>
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
                  Preguntas Frecuentes sobre la Subida de Alquiler
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

        {/* Trust Notice */}
        <section className="py-12 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Aviso legal:</strong> Esta guía tiene carácter informativo y no constituye asesoramiento legal. 
                Para casos específicos, consulta con un profesional del derecho. ACROXIA es una herramienta de análisis 
                que ayuda a identificar cláusulas potencialmente problemáticas en contratos de alquiler.
              </p>
            </div>
          </div>
        </section>

        {/* Related Tenant Guides */}
        <RelatedTenantGuides currentSlug="/subida-alquiler-2026" />

        <Footer />
      </div>
    </>
  );
};

export default SubidaAlquiler2026;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, FileText, Shield, Scale, Calendar } from "lucide-react";
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

const clausulasAbusivas = [
  {
    titulo: "Exigir más de 2 meses de garantía adicional",
    descripcion: "La LAU limita la fianza legal a 1 mes + máximo 2 meses de garantía adicional. Más de 3 meses en total se considera contrario a la normativa vigente.",
    legal: false,
  },
  {
    titulo: "Cobrar gastos de inmobiliaria al inquilino",
    descripcion: "Desde 2019, los honorarios de gestión inmobiliaria corresponden al arrendador según la normativa vigente.",
    legal: false,
  },
  {
    titulo: "Obligar a pagar el IBI",
    descripcion: "El IBI es un impuesto sobre la propiedad. En vivienda habitual, corresponde al propietario según la LAU.",
    legal: false,
  },
  {
    titulo: "Prohibir mascotas de forma genérica",
    descripcion: "Una prohibición absoluta puede considerarse abusiva. Se permiten restricciones razonables, no prohibiciones totales.",
    legal: false,
  },
  {
    titulo: "Penalizaciones superiores a 1 mes/año",
    descripcion: "La LAU permite máximo 1 mensualidad por año que falte, prorrateada. Cualquier penalización mayor se considera abusiva según la LAU.",
    legal: false,
  },
  {
    titulo: "Permitir entrada del casero sin previo aviso",
    descripcion: "El domicilio es inviolable (art. 18 CE). El propietario solo puede entrar con tu consentimiento o autorización judicial.",
    legal: false,
  },
  {
    titulo: "Renunciar a los derechos de la LAU",
    descripcion: "Cualquier cláusula que te haga renunciar a derechos que la LAU te otorga como inquilino podría ser nula de pleno derecho.",
    legal: false,
  },
  {
    titulo: "Cobrar derramas extraordinarias al inquilino",
    descripcion: "Las reparaciones estructurales y mejoras del edificio corresponden al propietario según la normativa vigente.",
    legal: false,
  },
];

const faqs = [
  {
    question: "¿Qué es una cláusula abusiva en un contrato de alquiler?",
    answer: "Una cláusula abusiva es aquella que contraviene la Ley de Arrendamientos Urbanos (LAU) o genera un desequilibrio significativo entre los derechos del inquilino y del arrendador. Según la LAU, estas cláusulas se consideran nulas de pleno derecho y carecerían de efecto legal aunque se hayan firmado."
  },
  {
    question: "¿Puedo negarme a cumplir una cláusula abusiva si ya firmé el contrato?",
    answer: "Sí. Las cláusulas consideradas abusivas según la LAU serían nulas automáticamente, independientemente de que las hayas firmado. El resto del contrato sigue siendo válido. Si el casero intenta aplicarlas, puedes negarte y, si insiste, reclamar ante la OMIC o judicialmente."
  },
  {
    question: "¿Cómo puedo saber si mi contrato tiene cláusulas ilegales?",
    answer: "Puedes revisar tu contrato manualmente comparándolo con la LAU, o usar herramientas de análisis con IA como ACROXIA que identifican cláusulas potencialmente abusivas en menos de 2 minutos y te explican por qué podrían ser contrarias a la LAU."
  },
  {
    question: "¿Qué hacer si descubro cláusulas abusivas después de firmar?",
    answer: "Documenta las cláusulas, comunica por escrito al propietario que no las aceptas, guarda toda la comunicación. Si intenta aplicarlas, puedes denunciar ante Consumo o interponer demanda de nulidad."
  },
  {
    question: "¿Puedo anular todo el contrato si tiene cláusulas abusivas?",
    answer: "No es necesario. Solo las cláusulas abusivas son nulas; el resto del contrato permanece válido. Solo en casos extremos de desequilibrio grave podrías solicitar la resolución completa."
  },
];

const ClausulasAbusivas = () => {
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Cláusulas Abusivas en Contratos de Alquiler - Guía 2026",
    "description": "Identifica cláusulas potencialmente ilegales en tu contrato de alquiler. Guía completa sobre qué cláusulas podrían ser nulas según la LAU y cómo reclamar.",
    "url": "https://acroxia.com/clausulas-abusivas-alquiler",
    "dateModified": "2026-01-25",
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
    "headline": "Cláusulas Abusivas en Contratos de Alquiler 2026",
    "description": "Identifica cláusulas potencialmente ilegales en tu contrato de alquiler según la LAU.",
    "datePublished": "2026-01-01",
    "dateModified": "2026-01-25",
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
      "@id": "https://acroxia.com/clausulas-abusivas-alquiler"
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
        <title>Cláusulas Abusivas en Contratos de Alquiler 2026 | Guía Completa</title>
        <meta 
          name="description" 
          content="Descubre qué cláusulas podrían ser ilegales en tu contrato de alquiler. Lista de cláusulas abusivas según la LAU, cómo identificarlas y cómo reclamar. Actualizado 2026." 
        />
        <meta 
          name="keywords" 
          content="cláusulas abusivas alquiler, cláusulas ilegales contrato, LAU cláusulas nulas, contrato alquiler ilegal, detectar cláusulas abusivas" 
        />
        <link rel="canonical" href="https://acroxia.com/clausulas-abusivas-alquiler" />
        <link rel="alternate" hrefLang="es-ES" href="https://acroxia.com/clausulas-abusivas-alquiler" />
        <link rel="alternate" hrefLang="x-default" href="https://acroxia.com/clausulas-abusivas-alquiler" />
        <meta property="og:title" content="Cláusulas Abusivas en Contratos de Alquiler 2026" />
        <meta property="og:description" content="Descubre qué cláusulas podrían ser ilegales en tu contrato de alquiler según la LAU." />
        <meta property="og:url" content="https://acroxia.com/clausulas-abusivas-alquiler" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
        <meta property="og:locale" content="es_ES" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@acroxia" />
        <meta name="twitter:title" content="Cláusulas Abusivas Alquiler 2026" />
        <meta name="twitter:description" content="Identifica cláusulas ilegales según la LAU." />
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
            { label: "Cláusulas Abusivas" }
          ]} 
        />
        
        {/* Hero Section */}
        <section className="pb-20 bg-muted">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <AlertTriangle className="w-4 h-4" />
                  Protege tus derechos
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
                  Cláusulas Abusivas en Contratos de Alquiler
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                {/* TL;DR Speakable Summary */}
                <div className="speakable-summary bg-background/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-border">
                  <p className="text-lg text-foreground font-medium">
                    <strong>Resumen rápido:</strong> Las cláusulas abusivas en contratos de alquiler son nulas de pleno derecho según la LAU. 
                    Las más comunes incluyen: fianzas superiores a 3 meses, cobrar honorarios de inmobiliaria al inquilino, 
                    obligar a pagar el IBI, o penalizaciones excesivas por desistimiento.
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

        {/* What are abusive clauses */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                  <div className="text-center p-6 bg-muted rounded-2xl">
                    <FileText className="w-10 h-10 text-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">Nulas de pleno derecho</h3>
                    <p className="text-sm text-muted-foreground">No tienen ningún efecto legal aunque las hayas firmado</p>
                  </div>
                  <div className="text-center p-6 bg-muted rounded-2xl">
                    <Shield className="w-10 h-10 text-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">Protegido por la LAU</h3>
                    <p className="text-sm text-muted-foreground">La Ley de Arrendamientos Urbanos te protege como inquilino</p>
                  </div>
                  <div className="text-center p-6 bg-muted rounded-2xl">
                    <Scale className="w-10 h-10 text-foreground mx-auto mb-4" />
                    <h3 className="font-serif text-xl font-semibold mb-2">Derecho a reclamar</h3>
                    <p className="text-sm text-muted-foreground">Puedes exigir que no se apliquen y recuperar lo pagado</p>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <h2 className="font-serif text-3xl font-semibold text-foreground mb-8 text-center">
                  Las 8 Cláusulas Abusivas Más Comunes
                </h2>
              </FadeIn>

              <div className="space-y-4">
                {clausulasAbusivas.map((clausula, index) => (
                  <FadeIn key={index} delay={0.1 + index * 0.05}>
                    <div className="flex items-start gap-4 p-6 bg-red-50 border border-red-100 rounded-xl">
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{clausula.titulo}</h3>
                        <p className="text-muted-foreground text-sm">{clausula.descripcion}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              {/* Contextual links to related guides */}
              <FadeIn delay={0.5}>
                <div className="mt-12 p-6 bg-muted/50 rounded-2xl border border-border">
                  <h3 className="font-semibold text-foreground mb-3">Guías relacionadas</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Si tu contrato tiene cláusulas sobre fianzas excesivas, consulta nuestra guía sobre 
                    <Link to="/devolucion-fianza-alquiler" className="text-foreground underline underline-offset-4 mx-1 hover:text-foreground/80">
                      devolución de fianza
                    </Link>
                    para conocer tus derechos al finalizar el alquiler. Si además te están aplicando subidas 
                    ilegales, revisa la guía sobre 
                    <Link to="/subida-alquiler-2026" className="text-foreground underline underline-offset-4 mx-1 hover:text-foreground/80">
                      subida de alquiler en 2026
                    </Link>.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-foreground text-background">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <FadeIn>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6">
                  ¿Tu contrato tiene cláusulas potencialmente ilegales?
                </h2>
              </FadeIn>
              <FadeIn delay={0.1}>
                <p className="text-background/70 text-lg mb-8">
                  Nuestra IA analiza tu contrato en menos de 2 minutos y te indica 
                  qué cláusulas podrían ser abusivas y cómo reclamar.
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
                  Preguntas Frecuentes sobre Cláusulas Abusivas
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
        <RelatedTenantGuides currentSlug="/clausulas-abusivas-alquiler" />

        <Footer />
      </div>
    </>
  );
};

export default ClausulasAbusivas;

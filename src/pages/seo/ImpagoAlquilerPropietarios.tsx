import SEOHead from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import { 
  AlertTriangle, 
  FileText, 
  Clock, 
  Shield, 
  Scale, 
  Send, 
  Gavel, 
  CheckCircle,
  Home
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedLandlordGuides from "@/components/seo/RelatedLandlordGuides";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const pasosImpago = [
  {
    numero: 1,
    titulo: "Comunicación inicial",
    descripcion: "Contacta con el inquilino por escrito (email o WhatsApp con acuse de recibo) para conocer la situación y buscar una solución amistosa.",
    plazo: "Inmediato"
  },
  {
    numero: 2,
    titulo: "Burofax de requerimiento",
    descripcion: "Envía un burofax con acuse de recibo y certificación de contenido reclamando las cantidades adeudadas y dando un plazo de pago (7-15 días).",
    plazo: "Tras 15-30 días de impago"
  },
  {
    numero: 3,
    titulo: "Demanda de desahucio",
    descripcion: "Si no hay respuesta, presenta demanda de desahucio por falta de pago acumulando la reclamación de rentas. Requiere abogado y procurador.",
    plazo: "Tras vencer el plazo del burofax"
  },
  {
    numero: 4,
    titulo: "Juicio y lanzamiento",
    descripcion: "El juzgado notifica al inquilino dándole 10 días para pagar, oponerse o desalojar. Si no actúa, se fija fecha de lanzamiento.",
    plazo: "4-8 meses según juzgado"
  }
];

const opcionesProteccion = [
  {
    icon: Shield,
    titulo: "Seguro de impago",
    descripcion: "Cubre rentas impagadas (6-18 meses), costes legales y daños. Prima: 3-5% de la renta anual.",
    pros: ["Cobertura inmediata", "Incluye defensa jurídica", "Cubre desperfectos"],
    contras: ["Coste anual recurrente", "Requiere estudio del inquilino"]
  },
  {
    icon: Scale,
    titulo: "Aval bancario",
    descripcion: "El inquilino deposita en banco el equivalente a 3-6 meses de renta como garantía ejecutable.",
    pros: ["Cobro rápido si hay impago", "Sin coste para el propietario"],
    contras: ["Difícil de conseguir para el inquilino", "Límite máximo de 3 meses (LAU)"]
  },
  {
    icon: FileText,
    titulo: "Fianza + garantía adicional",
    descripcion: "Fianza legal (1 mes) más garantía adicional (máximo 2 meses en vivienda habitual).",
    pros: ["Fácil de implementar", "Sin coste extra"],
    contras: ["Máximo 3 meses totales", "Trámites de devolución"]
  }
];

const faqs = [
  {
    question: "¿Cuánto tarda un desahucio por impago en 2026?",
    answer: "Entre 4 y 8 meses de media. Aunque la Ley 5/2018 agilizó los trámites ('desahucio express'), los plazos dependen de la carga del juzgado y de si el inquilino solicita asistencia jurídica gratuita."
  },
  {
    question: "¿Cuánto cuesta un desahucio?",
    answer: "Entre 1.200€ y 2.500€. Es obligatorio acudir con abogado y procurador (art. 23 LEC). Incluye honorarios, tasas y poderes notariales. Las costas se suelen imponer al inquilino, pero si es insolvente, difícilmente las cobrarás."
  },
  {
    question: "¿Puedo cortar los suministros si el inquilino no paga?",
    answer: "No. Cortar luz, agua o gas se considera delito de coacciones (art. 172 Código Penal) o realización arbitraria del propio derecho. Puede conllevar penas de prisión o multa para el propietario."
  },
  {
    question: "¿Qué hago si el inquilino se va sin pagar y deja deudas?",
    answer: "Inicia un proceso monitorio (art. 812 LEC) para reclamar rentas debidas. Puedes compensar con la fianza (art. 36 LAU), pero si no cubre todo, la reclamación judicial es la vía para embargar bienes futuros."
  },
  {
    question: "¿El seguro de impago cubre okupas?",
    answer: "Depende. La mayoría cubre impago de inquilinos con contrato. Si es una ocupación ilegal sin contrato ('patada en la puerta'), se requiere un seguro específico de protección jurídica o antiocupación."
  },
  {
    question: "¿Puedo reclamar los gastos de comunidad e IBI impagados?",
    answer: "Sí, si el contrato establece expresamente que son a cargo del inquilino (art. 20.1 LAU). Se consideran cantidades asimiladas a la renta y su impago permite instar el desahucio (art. 27.2.a LAU)."
  },
];

const ImpagoAlquilerPropietarios = () => {
  const breadcrumbItems = [
    { label: "Propietarios", href: "/propietarios" },
    { label: "Impago de Alquiler" },
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://acroxia.com/impago-alquiler-propietarios",
    "name": "Qué Hacer Ante el Impago de Alquiler | Guía para Propietarios 2026",
    "description": "Guía completa para propietarios sobre cómo actuar ante el impago del alquiler: pasos legales, desahucio express, seguros de impago y protección preventiva.",
    "url": "https://acroxia.com/impago-alquiler-propietarios",
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
    "datePublished": "2026-01-22",
    "dateModified": "2026-02-09",
    "mainEntity": {
      "@type": "Article",
      "@id": "https://acroxia.com/impago-alquiler-propietarios#article"
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

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cómo actuar ante el impago del alquiler",
    "description": "Pasos legales para propietarios ante el impago de rentas por parte del inquilino",
    "totalTime": "P6M",
    "step": pasosImpago.map((paso, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": paso.titulo,
      "text": paso.descripcion
    }))
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": "https://acroxia.com/impago-alquiler-propietarios#article",
    "headline": "Qué Hacer Ante el Impago de Alquiler | Guía para Propietarios 2026",
    "description": "Pasos legales, desahucio express, seguros de impago y protección preventiva para propietarios.",
    "author": {
      "@type": "Organization",
      "name": "ACROXIA",
      "url": "https://acroxia.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ACROXIA",
      "logo": {
        "@type": "ImageObject",
        "url": "https://acroxia.com/acroxia-logo.png"
      }
    },
    "datePublished": "2026-01-22",
    "dateModified": "2026-02-09",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://acroxia.com/impago-alquiler-propietarios"
    },
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".speakable-summary"]
    }
  };

  return (
    <>
      <SEOHead
        title="Impago de Alquiler: Pasos Legales y Desahucio | Guía para Propietarios 2026 | ACROXIA"
        description="¿Tu inquilino no paga? Burofax, desahucio express, seguros de impago y protección preventiva. Guía completa para propietarios actualizada 2026."
        canonical="https://acroxia.com/impago-alquiler-propietarios"
        ogType="article"
        keywords="impago alquiler, desahucio express 2026, inquilino no paga, reclamar alquiler impagado, seguro impago alquiler"
        articleMeta={{ datePublished: "2026-01-22", dateModified: "2026-02-09" }}
        jsonLd={[pageSchema, faqSchema, howToSchema, articleSchema]}
      />

      <Header />
      <Breadcrumbs items={breadcrumbItems} />

      <main>
        {/* Hero Section */}
        <section className="bg-background pt-16 pb-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full mb-6">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-muted-foreground">Para propietarios</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
                  ¿Tu inquilino no paga el alquiler?
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Guía práctica con los pasos legales para reclamar rentas impagadas, 
                  iniciar un desahucio y protegerte ante futuros impagos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-full">
                    <Link to="/propietarios">Ver planes propietarios</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <Link to="/analizar-gratis">Analizar mi contrato</Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Alerta importante + TL;DR */}
        <section className="bg-amber-50 border-y border-amber-200 py-8">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <div className="flex items-start gap-4 mb-6">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="font-medium text-foreground mb-2">Importante: Nunca tomes la justicia por tu mano</h2>
                    <p className="text-muted-foreground text-sm">
                      Cambiar la cerradura, cortar suministros o intimidar al inquilino son delitos que pueden 
                      volverse en tu contra. Siempre sigue el procedimiento legal, aunque sea más lento.
                    </p>
                  </div>
                </div>
                <div className="border-t border-amber-200 pt-6">
                  <p className="text-sm font-medium text-foreground mb-2">Resumen rápido</p>
                  <p className="text-muted-foreground speakable-summary">
                    Ante el impago del alquiler, envía primero un burofax de requerimiento dando 7-15 días de plazo. 
                    Si no hay respuesta, puedes iniciar un desahucio express que tarda 4-8 meses. Para prevenirlo, 
                    considera un seguro de impago (3-5% anual) o asegúrate de que tu{" "}
                    <Link to="/contrato-alquiler-propietarios" className="underline hover:text-foreground">contrato cumple la LAU</Link>. 
                    Al finalizar, recuerda las reglas de{" "}
                    <Link to="/deposito-fianza-propietarios" className="underline hover:text-foreground">devolución de fianza</Link>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Última actualización: enero 2026 | Normativa vigente: LAU y LEC
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Pasos ante impago */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Pasos ante el impago del alquiler
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Procedimiento recomendado para reclamar rentas impagadas de forma efectiva y legal.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-4xl mx-auto">
              {pasosImpago.map((paso, index) => (
                <FadeIn key={paso.numero} delay={index * 0.1}>
                  <div className="flex gap-6 mb-8 last:mb-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center font-serif text-xl font-medium">
                        {paso.numero}
                      </div>
                      {index < pasosImpago.length - 1 && (
                        <div className="w-0.5 h-16 bg-border mx-auto mt-2" />
                      )}
                    </div>
                    <div className="flex-grow pb-8">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-serif text-xl font-medium text-foreground">
                          {paso.titulo}
                        </h3>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {paso.plazo}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{paso.descripcion}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Opciones de protección */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Cómo protegerte ante futuros impagos
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Opciones preventivas para minimizar el riesgo de impago en tus alquileres.
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {opcionesProteccion.map((opcion, index) => (
                <FadeIn key={opcion.titulo} delay={index * 0.1}>
                  <div className="bg-background rounded-2xl p-6 shadow-lg h-full">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                      <opcion.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-foreground mb-2">
                      {opcion.titulo}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {opcion.descripcion}
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1">Ventajas:</p>
                        <ul className="space-y-1">
                          {opcion.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1">Inconvenientes:</p>
                        <ul className="space-y-1">
                          {opcion.contras.map((contra, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              {contra}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-foreground text-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <Gavel className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                  ¿Tu contrato te protege ante impagos?
                </h2>
                <p className="text-background/80 mb-8 max-w-xl mx-auto">
                  Analiza tu contrato de alquiler y verifica que incluye las cláusulas 
                  necesarias para actuar con rapidez ante un posible impago.
                </p>
                <Button asChild size="lg" variant="secondary" className="rounded-full">
                  <Link to="/analizar-gratis">Analizar contrato gratis</Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Preguntas frecuentes sobre impago de alquiler
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`item-${index}`}
                      className="bg-muted rounded-xl px-6 border-none"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
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

        {/* En resumen */}
        <section className="bg-background py-16">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto">
              <FadeIn>
                <h2 className="font-serif text-2xl font-medium text-foreground mb-6">En resumen</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" /><span>El impago de renta es causa de resolución del contrato (art. 27.2.a LAU).</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" /><span>Un desahucio express por impago tarda entre <strong>4 y 8 meses</strong> (Ley 5/2018).</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" /><span>Coste aproximado del procedimiento: <strong>1.200-2.500 €</strong> (abogado + procurador).</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" /><span>Cortar suministros para forzar el desalojo es <strong>delito de coacciones</strong> (art. 172 CP).</span></li>
                  <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" /><span>Prevención: seguro de impago (<strong>3-5%</strong> de renta anual) o fianza + garantía adicional (máx. 3 meses, art. 36 LAU).</span></li>
                </ul>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="bg-muted py-16">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-full mb-6">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Información importante</span>
                </div>
                <p className="text-muted-foreground">
                  Esta guía tiene carácter orientativo y no sustituye el asesoramiento legal profesional. 
                  Los plazos y procedimientos pueden variar según el juzgado y las circunstancias del caso. 
                  Para casos de vulnerabilidad del inquilino, existen protecciones especiales que pueden afectar al proceso.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Guías relacionadas */}
        <RelatedLandlordGuides currentSlug="/impago-alquiler-propietarios" />
      </main>

      <Footer />
    </>
  );
};

export default ImpagoAlquilerPropietarios;

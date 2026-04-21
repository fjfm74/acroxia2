import SEOHead from "@/components/seo/SEOHead";
import { Link } from "react-router-dom";
import {
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  TrendingDown,
  FileText,
  Shield,
  Calculator,
} from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedLandlordGuides from "@/components/seo/RelatedLandlordGuides";
import { Button } from "@/components/ui/button";
import FadeIn from "@/components/animations/FadeIn";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const efectosZonaTensionada = [
  {
    tipo: "Contratos nuevos (nuevo inquilino)",
    limite: "Renta del contrato anterior o índice de referencia SERPAVI",
    descripcion:
      "No puedes fijar una renta libre: debes respetar la renta del inquilino anterior o el índice oficial si es inferior.",
  },
  {
    tipo: "Renovaciones (mismo inquilino)",
    limite: "Actualización máxima según IRAV (2,2% en 2026)",
    descripcion:
      "Las prórrogas obligatorias solo permiten actualizar según el IRAV, no puedes negociar una renta nueva.",
  },
  {
    tipo: "Vivienda nunca alquilada",
    limite: "Índice de referencia SERPAVI",
    descripcion:
      "Si la vivienda no tiene histórico de alquiler, el límite es el índice de referencia del sistema SERPAVI.",
  },
];

const obligacionesPropietario = [
  {
    icon: FileText,
    titulo: "Declaración obligatoria en contrato",
    descripcion: "Debes indicar por escrito si la vivienda está en zona tensionada y el importe de la última renta.",
    obligatorio: true,
  },
  {
    icon: Calculator,
    titulo: "Consulta del índice SERPAVI",
    descripcion:
      "Antes de fijar la renta, consulta el Sistema Estatal de Referencia de Precios para conocer el límite aplicable.",
    obligatorio: true,
  },
  {
    icon: TrendingDown,
    titulo: "Respetar topes de renta",
    descripcion: "No puedes pactar una renta superior al límite legal, aunque el inquilino esté dispuesto a pagar más.",
    obligatorio: true,
  },
];

const excepcionesSubida = [
  {
    permitido: true,
    titulo: "Obras de mejora (hasta +10%)",
    descripcion:
      "Si has realizado obras de mejora en los últimos 2 años, puedes incrementar la renta hasta un 10% adicional.",
  },
  {
    permitido: true,
    titulo: "Rehabilitación o mejora accesibilidad",
    descripcion:
      "Las obras de rehabilitación o mejora de accesibilidad pueden justificar incrementos superiores al IRAV.",
  },
  {
    permitido: true,
    titulo: "Contrato de larga duración (>10 años)",
    descripcion: "Los contratos de duración superior a 10 años tienen un régimen especial con mayor flexibilidad.",
  },
  {
    permitido: false,
    titulo: "Acuerdo privado con el inquilino",
    descripcion: "Aunque el inquilino acepte pagar más, el pacto sería nulo si supera el límite legal.",
  },
  {
    permitido: false,
    titulo: "Repercutir IBI o comunidad extra",
    descripcion: "Los gastos repercutibles ya están limitados por la LAU; no pueden usarse para eludir los topes.",
  },
];

const faqs = [
  {
    question: "¿Cómo sé si mi vivienda está en zona tensionada?",
    answer:
      "Consulta el índice SERPAVI (Sistema Estatal de Referencia de Precios de Alquiler de Vivienda) en la web del MIVAU. Las zonas se declaran por orden ministerial según el art. 18 de la Ley 12/2023.",
  },
  {
    question: "¿Qué pasa si no declaro la zona tensionada en el contrato?",
    answer:
      "Es obligatorio según el art. 31 de la Ley 12/2023. Ocultarlo impide aplicar las subidas legales y el inquilino podría reclamar la devolución del exceso de renta pagado más intereses.",
  },
  {
    question: "¿Puedo subir la renta si el inquilino anterior pagaba muy poco?",
    answer:
      "No libremente. En zona tensionada, el tope es la renta anterior actualizada (art. 17.6 LAU). Solo puedes subir hasta un 10% extra si has hecho obras de rehabilitación o mejora energética en los últimos 2 años.",
  },
  {
    question: "¿Afecta la zona tensionada a los alquileres de temporada?",
    answer:
      "En principio no, pues la LAU (art. 3) los excluye de las normas de vivienda habitual. Pero cuidado: usar el temporal en fraude de ley para esquivar topes es sancionable.",
  },
  {
    question: "¿Cuánto tiempo dura la declaración de zona tensionada?",
    answer:
      "3 años prorrogables anualmente si subsisten las circunstancias económicas (art. 18.2 Ley 12/2023). Las CCAA deben solicitar la prórroga al Ministerio.",
  },
  {
    question: "¿Qué es el IRAV y cómo afecta a mi alquiler?",
    answer:
      "Es el índice que sustituye al IPC para actualizaciones anuales (Disp. Final 6ª Ley 12/2023). En 2026, limita la subida al 2,2% aproximadamente, protegiendo al inquilino de la inflación.",
  },
];

const ZonasTensionadasPropietarios = () => {
  const breadcrumbItems = [{ label: "Propietarios", href: "/propietarios" }, { label: "Zonas Tensionadas" }];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://acroxia.com/zonas-tensionadas-propietarios",
    name: "Zonas Tensionadas: Guía para Propietarios | Límites de Renta 2026",
    description:
      "Cómo saber si tu vivienda está en zona tensionada consultando SERPAVI, límites de renta en nuevos contratos y actualizaciones, obligaciones legales del propietario y excepciones permitidas en 2026.",
    url: "https://acroxia.com/zonas-tensionadas-propietarios",
    inLanguage: "es-ES",
    publisher: {
      "@type": "Organization",
      name: "ACROXIA",
      url: "https://acroxia.com",
    },
    isPartOf: {
      "@type": "WebSite",
      name: "ACROXIA",
      url: "https://acroxia.com",
    },
    datePublished: "2026-01-22",
    dateModified: "2026-04-21",
    mainEntity: {
      "@type": "Article",
      "@id": "https://acroxia.com/zonas-tensionadas-propietarios#article",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": "https://acroxia.com/zonas-tensionadas-propietarios#article",
    headline: "Zonas tensionadas 2026: cómo consultar SERPAVI y límites de renta aplicables",
    description:
      "Guía para verificar si una vivienda está en zona tensionada (SERPAVI/MIVAU), los límites de renta en nuevos contratos y actualizaciones, obligaciones legales y excepciones previstas por la Ley 12/2023.",
    author: {
      "@type": "Organization",
      name: "ACROXIA",
      url: "https://acroxia.com",
    },
    publisher: {
      "@type": "Organization",
      name: "ACROXIA",
      logo: {
        "@type": "ImageObject",
        url: "https://acroxia.com/acroxia-logo.png",
      },
    },
    datePublished: "2026-01-22",
    dateModified: "2026-04-21",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://acroxia.com/zonas-tensionadas-propietarios",
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".speakable-summary"],
    },
  };

  return (
    <>
      <SEOHead
        title="Zonas tensionadas 2026: consulta SERPAVI y límites de renta | ACROXIA"
        description="Cómo saber si tu vivienda está en zona tensionada (consulta SERPAVI), qué límites de renta se aplican, obligaciones legales y excepciones permitidas en 2026."
        canonical="https://acroxia.com/zonas-tensionadas-propietarios"
        ogType="article"
        keywords="zonas tensionadas 2026, SERPAVI consulta, consultar zona tensionada, MIVAU, límite renta zona tensionada, índice referencia arrendamientos"
        articleMeta={{ datePublished: "2026-01-22", dateModified: "2026-04-21" }}
        jsonLd={[pageSchema, faqSchema, articleSchema]}
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
                  <MapPin className="w-4 h-4 text-foreground" />
                  <span className="text-sm text-muted-foreground">Para propietarios</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
                  Zonas tensionadas 2026: consulta SERPAVI y límites de renta
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Comprueba si tu vivienda está en zona tensionada consultando el SERPAVI del Ministerio (MIVAU). Te
                  explicamos qué implica, los topes de renta y las obligaciones del propietario en 2026.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-full">
                    <a href="https://serpavi.mivau.gob.es/" target="_blank" rel="noopener noreferrer">
                      Consultar SERPAVI <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <Link to="/analizar-gratis">Analizar mi contrato</Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* TL;DR Resumen rápido */}
        <section className="bg-amber-50 border-y border-amber-200 py-6">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <p className="text-sm font-medium text-foreground mb-2">Resumen rápido</p>
                <p className="text-muted-foreground speakable-summary">
                  Consulta si tu vivienda está en zona tensionada en serpavi.mivau.gob.es. Si lo está, la renta de
                  nuevos contratos está limitada a la del contrato anterior o al índice SERPAVI. Debes declararlo
                  obligatoriamente en el{" "}
                  <Link to="/contrato-alquiler-propietarios" className="underline hover:text-foreground">
                    contrato de alquiler
                  </Link>
                  . Consulta también las reglas de{" "}
                  <Link to="/deposito-fianza-propietarios" className="underline hover:text-foreground">
                    depósito de fianza
                  </Link>
                  ,{" "}
                  <Link to="/fin-contrato-alquiler-propietarios" className="underline hover:text-foreground">
                    fin de contrato
                  </Link>{" "}
                  y cómo actuar ante{" "}
                  <Link to="/impago-alquiler-propietarios" className="underline hover:text-foreground">
                    impago del alquiler
                  </Link>
                  .
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Actualizado: 21 de abril de 2026 | Normativa vigente: Ley 12/2023 y LAU 29/1994
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Qué es una zona tensionada */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <FadeIn>
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-6 text-center">
                  ¿Qué es una zona tensionada?
                </h2>
                <div className="bg-background rounded-2xl p-8 shadow-lg">
                  <p className="text-muted-foreground mb-6">
                    Una <strong>zona de mercado residencial tensionado</strong> es un área geográfica donde la Ley de
                    Vivienda permite a las administraciones establecer límites a los precios del alquiler. La
                    declaración la realizan las Comunidades Autónomas cuando se cumplen ciertos criterios:
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        El coste del alquiler + suministros supera el 30% de la renta media de los hogares
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">
                        El precio del alquiler ha crecido más de 3 puntos por encima del IPC en los últimos 5 años
                      </span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground bg-muted p-4 rounded-lg">
                    <AlertTriangle className="w-4 h-4 inline mr-2 text-amber-600" />
                    Actualmente hay zonas tensionadas declaradas en Cataluña, País Vasco, Navarra y algunas ciudades de
                    otras comunidades. Consulta SERPAVI para verificar tu dirección específica.
                  </p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Efectos en la renta */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  ¿Cómo afecta a la renta que puedo cobrar?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Los límites varían según el tipo de contrato y la situación de la vivienda.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-4xl mx-auto space-y-6">
              {efectosZonaTensionada.map((efecto, index) => (
                <FadeIn key={efecto.tipo} delay={index * 0.1}>
                  <div className="bg-muted rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-grow">
                        <h3 className="font-serif text-lg font-medium text-foreground mb-1">{efecto.tipo}</h3>
                        <p className="text-muted-foreground text-sm">{efecto.descripcion}</p>
                      </div>
                      <div className="md:text-right">
                        <span className="inline-block bg-foreground text-background px-4 py-2 rounded-full text-sm font-medium">
                          {efecto.limite}
                        </span>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Obligaciones del propietario */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Tus obligaciones como propietario
                </h2>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {obligacionesPropietario.map((obligacion, index) => (
                <FadeIn key={obligacion.titulo} delay={index * 0.1}>
                  <div className="bg-background rounded-2xl p-6 shadow-lg h-full">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                      <obligacion.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-foreground mb-2">{obligacion.titulo}</h3>
                    <p className="text-muted-foreground text-sm">{obligacion.descripcion}</p>
                    {obligacion.obligatorio && (
                      <span className="inline-block mt-3 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        Obligatorio por ley
                      </span>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Excepciones */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Excepciones y casos especiales
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  En algunos casos puedes superar los límites de renta de zona tensionada.
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {excepcionesSubida.map((excepcion, index) => (
                <FadeIn key={excepcion.titulo} delay={index * 0.1}>
                  <div
                    className={`rounded-2xl p-6 border-2 ${
                      excepcion.permitido ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {excepcion.permitido ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-medium text-foreground mb-1">{excepcion.titulo}</h3>
                        <p className="text-muted-foreground text-sm">{excepcion.descripcion}</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Consulta SERPAVI */}
        <section className="bg-foreground text-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <MapPin className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                  Consulta si tu vivienda está en zona tensionada
                </h2>
                <p className="text-background/80 mb-8 max-w-xl mx-auto">
                  Accede al Sistema Estatal de Referencia de Precios (SERPAVI) del Ministerio de Vivienda para verificar
                  tu dirección y conocer el índice de referencia aplicable.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="rounded-full">
                    <a href="https://serpavi.mivau.gob.es/" target="_blank" rel="noopener noreferrer">
                      Ir a SERPAVI <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full border-background/30 text-background hover:bg-background/10"
                  >
                    <Link to="/propietarios">Ver planes propietarios</Link>
                  </Button>
                </div>
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
                  Preguntas frecuentes sobre zonas tensionadas
                </h2>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="bg-muted rounded-xl px-6 border-none">
                      <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5">{faq.answer}</AccordionContent>
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
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span>
                      Una zona es tensionada cuando el alquiler supera el <strong>30%</strong> de la renta media o sube
                      más de <strong>3 puntos</strong> sobre el IPC en 5 años (art. 18.3 Ley 12/2023).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span>
                      La renta de nuevos contratos está limitada a la del <strong>contrato anterior</strong> o al índice{" "}
                      <strong>SERPAVI</strong> (art. 17.6-17.7 LAU).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span>
                      Es <strong>obligatorio declarar</strong> la zona tensionada y la renta anterior en el contrato.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span>
                      Excepciones: obras de mejora permiten subida de hasta <strong>+10%</strong> sobre el límite.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                    <span>
                      Consulta tu dirección en <strong>serpavi.mivau.gob.es</strong> para verificar si estás en zona
                      tensionada.
                    </span>
                  </li>
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
                  Esta guía tiene carácter orientativo. La declaración de zonas tensionadas puede cambiar y las
                  Comunidades Autónomas tienen competencias para modular su aplicación. Consulta siempre fuentes
                  oficiales (SERPAVI, MIVAU) y, en caso de duda, asesórate con un profesional.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Guías relacionadas */}
        <RelatedLandlordGuides currentSlug="/zonas-tensionadas-propietarios" />
      </main>

      <Footer />
    </>
  );
};

export default ZonasTensionadasPropietarios;

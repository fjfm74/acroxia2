import { Helmet } from "react-helmet-async";
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
  Calculator
} from "lucide-react";
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

const efectosZonaTensionada = [
  {
    tipo: "Contratos nuevos (nuevo inquilino)",
    limite: "Renta del contrato anterior o índice de referencia SERPAVI",
    descripcion: "No puedes fijar una renta libre: debes respetar la renta del inquilino anterior o el índice oficial si es inferior."
  },
  {
    tipo: "Renovaciones (mismo inquilino)",
    limite: "Actualización máxima según IRAV (2,2% en 2026)",
    descripcion: "Las prórrogas obligatorias solo permiten actualizar según el IRAV, no puedes negociar una renta nueva."
  },
  {
    tipo: "Vivienda nunca alquilada",
    limite: "Índice de referencia SERPAVI",
    descripcion: "Si la vivienda no tiene histórico de alquiler, el límite es el índice de referencia del sistema SERPAVI."
  }
];

const obligacionesPropietario = [
  {
    icon: FileText,
    titulo: "Declaración obligatoria en contrato",
    descripcion: "Debes indicar por escrito si la vivienda está en zona tensionada y el importe de la última renta.",
    obligatorio: true
  },
  {
    icon: Calculator,
    titulo: "Consulta del índice SERPAVI",
    descripcion: "Antes de fijar la renta, consulta el Sistema Estatal de Referencia de Precios para conocer el límite aplicable.",
    obligatorio: true
  },
  {
    icon: TrendingDown,
    titulo: "Respetar topes de renta",
    descripcion: "No puedes pactar una renta superior al límite legal, aunque el inquilino esté dispuesto a pagar más.",
    obligatorio: true
  }
];

const excepcionesSubida = [
  {
    permitido: true,
    titulo: "Obras de mejora (hasta +10%)",
    descripcion: "Si has realizado obras de mejora en los últimos 2 años, puedes incrementar la renta hasta un 10% adicional."
  },
  {
    permitido: true,
    titulo: "Rehabilitación o mejora accesibilidad",
    descripcion: "Las obras de rehabilitación o mejora de accesibilidad pueden justificar incrementos superiores al IRAV."
  },
  {
    permitido: true,
    titulo: "Contrato de larga duración (>10 años)",
    descripcion: "Los contratos de duración superior a 10 años tienen un régimen especial con mayor flexibilidad."
  },
  {
    permitido: false,
    titulo: "Acuerdo privado con el inquilino",
    descripcion: "Aunque el inquilino acepte pagar más, el pacto sería nulo si supera el límite legal."
  },
  {
    permitido: false,
    titulo: "Repercutir IBI o comunidad extra",
    descripcion: "Los gastos repercutibles ya están limitados por la LAU; no pueden usarse para eludir los topes."
  }
];

const faqs = [
  {
    question: "¿Cómo sé si mi vivienda está en zona tensionada?",
    answer: "Puedes consultarlo en el Sistema Estatal de Referencia de Precios (SERPAVI) del Ministerio de Vivienda: https://serpavi.mivau.gob.es/. Introduce la dirección de tu inmueble y el sistema te indicará si está en zona tensionada y cuál es el índice de referencia aplicable."
  },
  {
    question: "¿Qué pasa si no declaro la zona tensionada en el contrato?",
    answer: "Omitir esta información puede considerarse un defecto del contrato que beneficia al inquilino. Este podría impugnar cláusulas de renta que excedan los límites legales y reclamar la devolución de cantidades pagadas en exceso."
  },
  {
    question: "¿Puedo subir la renta si el inquilino anterior pagaba muy poco?",
    answer: "En zona tensionada, el límite es la renta del contrato anterior. Solo puedes incrementarla si realizaste obras de mejora (hasta +10%) o si esa renta era inferior al índice SERPAVI, en cuyo caso puedes aplicar el índice."
  },
  {
    question: "¿Afecta la zona tensionada a los alquileres de temporada?",
    answer: "Los alquileres de temporada legítimos (estudiantes, trabajadores desplazados temporalmente) no están sujetos a los límites de zona tensionada. Sin embargo, simular un alquiler de temporada cuando es vivienda habitual es fraude de ley."
  },
  {
    question: "¿Cuánto tiempo dura la declaración de zona tensionada?",
    answer: "La declaración de zona tensionada tiene una vigencia inicial de 3 años, prorrogables por periodos iguales si persisten las condiciones que motivaron la declaración. Puede ser revocada si cambian las circunstancias del mercado."
  },
  {
    question: "¿Qué es el IRAV y cómo afecta a mi alquiler?",
    answer: "El IRAV (Índice de Referencia de Arrendamientos de Vivienda) sustituye al IPC para actualizar rentas. En 2026 es del 2,2%. Es el máximo incremento anual permitido para renovaciones, independientemente de la inflación real."
  }
];

const ZonasTensionadasPropietarios = () => {
  const breadcrumbItems = [
    { label: "Para Propietarios" },
    { label: "Zonas Tensionadas" },
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Zonas Tensionadas: Guía para Propietarios | Límites de Renta 2026",
    "description": "Todo sobre las zonas tensionadas de alquiler para propietarios: cómo consultar SERPAVI, límites de renta, obligaciones legales y excepciones permitidas.",
    "url": "https://acroxia.com/zonas-tensionadas-propietarios",
    "inLanguage": "es-ES",
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

  return (
    <>
      <Helmet>
        <title>Zonas Tensionadas de Alquiler: Guía para Propietarios 2026</title>
        <meta 
          name="description" 
          content="¿Tu vivienda está en zona tensionada? Guía completa para propietarios: cómo consultar SERPAVI, límites de renta, obligaciones legales y excepciones." 
        />
        <meta 
          name="keywords" 
          content="zona tensionada alquiler, SERPAVI consulta, límite renta 2026, tope alquiler propietarios, índice referencia precios vivienda" 
        />
        <link rel="canonical" href="https://acroxia.com/zonas-tensionadas-propietarios" />
        <meta property="og:title" content="Zonas Tensionadas de Alquiler: Guía para Propietarios 2026" />
        <meta property="og:description" content="Todo sobre zonas tensionadas para propietarios: límites de renta, SERPAVI y obligaciones legales." />
        <meta property="og:url" content="https://acroxia.com/zonas-tensionadas-propietarios" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">
          {JSON.stringify(pageSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

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
                  Zonas tensionadas: lo que todo propietario debe saber
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Cómo afectan los límites de renta a tu alquiler, dónde consultar si tu vivienda 
                  está afectada y qué obligaciones tienes como arrendador en 2026.
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
                    Una <strong>zona de mercado residencial tensionado</strong> es un área geográfica donde 
                    la Ley de Vivienda permite a las administraciones establecer límites a los precios del alquiler. 
                    La declaración la realizan las Comunidades Autónomas cuando se cumplen ciertos criterios:
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
                    Actualmente hay zonas tensionadas declaradas en Cataluña, País Vasco, Navarra y algunas 
                    ciudades de otras comunidades. Consulta SERPAVI para verificar tu dirección específica.
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
                        <h3 className="font-serif text-lg font-medium text-foreground mb-1">
                          {efecto.tipo}
                        </h3>
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
                    <h3 className="font-serif text-lg font-medium text-foreground mb-2">
                      {obligacion.titulo}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {obligacion.descripcion}
                    </p>
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
                  <div className={`rounded-2xl p-6 border-2 ${
                    excepcion.permitido 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {excepcion.permitido ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {excepcion.titulo}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {excepcion.descripcion}
                        </p>
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
                  Accede al Sistema Estatal de Referencia de Precios (SERPAVI) del Ministerio 
                  de Vivienda para verificar tu dirección y conocer el índice de referencia aplicable.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="rounded-full">
                    <a href="https://serpavi.mivau.gob.es/" target="_blank" rel="noopener noreferrer">
                      Ir a SERPAVI <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-background/30 text-background hover:bg-background/10">
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
                  Esta guía tiene carácter orientativo. La declaración de zonas tensionadas puede cambiar 
                  y las Comunidades Autónomas tienen competencias para modular su aplicación. 
                  Consulta siempre fuentes oficiales (SERPAVI, MIVAU) y, en caso de duda, asesórate con un profesional.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ZonasTensionadasPropietarios;

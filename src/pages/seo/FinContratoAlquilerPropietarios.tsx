import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
  CalendarX, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Home,
  FileText,
  Shield,
  Bell,
  Users
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

const tiposFinContrato = [
  {
    titulo: "Fin del periodo inicial pactado",
    duracion: "5-7 años",
    descripcion: "Transcurrido el periodo mínimo legal (5 años si eres particular, 7 si eres empresa), puedes no renovar notificando con 4 meses de antelación.",
    accion: "Notificación escrita 4 meses antes"
  },
  {
    titulo: "Fin de prórroga obligatoria",
    duracion: "+3 años",
    descripcion: "Tras el periodo inicial, hay prórrogas anuales automáticas hasta 3 años adicionales. Solo puedes finalizar al término de cada prórroga.",
    accion: "Notificación escrita 4 meses antes del fin de prórroga"
  },
  {
    titulo: "Fin de prórroga tácita",
    duracion: "Anual",
    descripcion: "Si no notificaste en las fases anteriores, el contrato se prorroga año a año. Puedes finalizar al término de cada año.",
    accion: "Notificación escrita 4 meses antes"
  }
];

const causasRecuperacion = [
  {
    permitido: true,
    causa: "Necesidad para vivienda propia",
    descripcion: "Necesitas la vivienda para ti o familiares de primer grado (hijos, padres).",
    requisitos: "Debe estar previsto en el contrato y notificar con 2 meses. Si no ocupas en 3 meses, el inquilino puede volver o pedir indemnización."
  },
  {
    permitido: true,
    causa: "Obras de reforma integral",
    descripcion: "Obras que requieran desalojo temporal y estén autorizadas.",
    requisitos: "Licencia de obras y comunicación formal. El inquilino tiene derecho de retorno."
  },
  {
    permitido: true,
    causa: "Incumplimiento grave del inquilino",
    descripcion: "Falta de pago, subarriendo no autorizado, daños graves, actividades molestas o ilícitas.",
    requisitos: "Demanda judicial de resolución de contrato. No puedes actuar unilateralmente."
  },
  {
    permitido: false,
    causa: "Vender la vivienda ocupada",
    descripcion: "La venta no extingue el contrato. El nuevo propietario se subroga en la posición de arrendador.",
    requisitos: "El inquilino tiene derecho de adquisición preferente (tanteo y retracto)."
  },
  {
    permitido: false,
    causa: "Subir la renta libremente",
    descripcion: "No puedes forzar la salida del inquilino para poder alquilar a precio de mercado.",
    requisitos: "Las subidas están limitadas por el IRAV durante la vigencia del contrato."
  }
];

const preavisos = [
  {
    quien: "Propietario",
    situacion: "No renovar tras periodo mínimo",
    plazo: "4 meses antes",
    consecuencias: "Si no notificas, prórroga automática de 3 años (prórrogas obligatorias) o 1 año (prórrogas tácitas)."
  },
  {
    quien: "Propietario",
    situacion: "Recuperar vivienda por necesidad",
    plazo: "2 meses antes",
    consecuencias: "Debe estar en el contrato. Si no ocupas en 3 meses, el inquilino puede volver o reclamar daños."
  },
  {
    quien: "Inquilino",
    situacion: "Desistimiento del contrato",
    plazo: "30 días antes",
    consecuencias: "Solo tras 6 meses de contrato. Indemnización de 1 mes por año restante."
  },
  {
    quien: "Inquilino",
    situacion: "No renovar en prórroga tácita",
    plazo: "1 mes antes",
    consecuencias: "Puede salir sin indemnización al terminar cualquier anualidad de prórroga tácita."
  }
];

const faqs = [
  {
    question: "¿Puedo no renovar el contrato sin dar motivo?",
    answer: "Sí, pero solo tras cumplir el periodo mínimo obligatorio (5 años si eres particular, 7 si eres empresa) más los 3 años de prórrogas obligatorias. Después, puedes no renovar notificando con 4 meses de antelación sin necesidad de justificar el motivo."
  },
  {
    question: "¿Cuánto preaviso debo dar al inquilino para no renovar?",
    answer: "Como propietario debes notificar con al menos 4 meses de antelación a la fecha de vencimiento del contrato o de la prórroga. La notificación debe ser por escrito, preferiblemente burofax con acuse de recibo."
  },
  {
    question: "¿Qué pasa si el inquilino no quiere irse al terminar el contrato?",
    answer: "Si has notificado correctamente y el inquilino no abandona, debes iniciar un procedimiento judicial de desahucio por expiración del plazo contractual. Nunca cambies la cerradura ni cortes suministros, ya que sería delito."
  },
  {
    question: "¿Puedo echar al inquilino si necesito la vivienda para mi hijo?",
    answer: "Sí, si esta causa está prevista en el contrato. Debes notificar con 2 meses de antelación y el familiar debe ocupar la vivienda en los 3 meses siguientes. Si no se cumple, el inquilino puede volver o exigir indemnización."
  },
  {
    question: "¿Qué indemnización le corresponde al inquilino si desiste antes de tiempo?",
    answer: "El inquilino puede desistir tras 6 meses de contrato, con preaviso de 30 días. La indemnización pactable es de 1 mes de renta por cada año de contrato que reste por cumplir (proporcional si es menos de un año)."
  },
  {
    question: "¿Puedo vender la vivienda y que el comprador eche al inquilino?",
    answer: "No. La venta no extingue el contrato de alquiler. El nuevo propietario se subroga en tu posición como arrendador y debe respetar los términos del contrato hasta su finalización. El inquilino tiene derecho de tanteo y retracto."
  }
];

const FinContratoAlquilerPropietarios = () => {
  const breadcrumbItems = [
    { label: "Propietarios", href: "/propietarios" },
    { label: "Fin de Contrato" },
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Fin de Contrato de Alquiler: Guía para Propietarios 2026",
    "description": "Cómo finalizar correctamente un contrato de alquiler: prórrogas obligatorias, preaviso, recuperar vivienda por necesidad y desahucio por expiración de plazo.",
    "url": "https://acroxia.com/fin-contrato-alquiler-propietarios",
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Fin de Contrato de Alquiler: Guía para Propietarios 2026",
    "description": "Prórrogas obligatorias, preaviso, recuperar vivienda por necesidad y desahucio por expiración de plazo.",
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
    "dateModified": "2026-01-23",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".speakable-summary"]
    }
  };

  return (
    <>
      <Helmet>
        <title>Fin de Contrato de Alquiler: Guía para Propietarios 2026</title>
        <meta 
          name="description" 
          content="¿Quieres recuperar tu vivienda? Guía 2026 sobre fin de contrato: prórrogas obligatorias, preaviso de 4 meses, causas de recuperación y desahucio por expiración." 
        />
        <meta 
          name="keywords" 
          content="fin contrato alquiler, no renovar contrato, recuperar vivienda propietario, preaviso alquiler, prorroga obligatoria LAU, desahucio expiracion plazo" 
        />
        <link rel="canonical" href="https://acroxia.com/fin-contrato-alquiler-propietarios" />
        <meta property="og:title" content="Fin de Contrato de Alquiler: Guía para Propietarios 2026" />
        <meta property="og:description" content="Cómo finalizar el contrato de alquiler correctamente: prórrogas, preaviso y recuperación de vivienda." />
        <meta property="og:url" content="https://acroxia.com/fin-contrato-alquiler-propietarios" />
        <meta property="og:type" content="article" />
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

      <Header />
      <Breadcrumbs items={breadcrumbItems} />

      <main>
        {/* Hero Section */}
        <section className="bg-background pt-16 pb-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full mb-6">
                  <CalendarX className="w-4 h-4 text-foreground" />
                  <span className="text-sm text-muted-foreground">Para propietarios</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
                  Fin del contrato de alquiler: cuándo y cómo recuperar tu vivienda
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Todo sobre las prórrogas obligatorias, el preaviso necesario, 
                  las causas de recuperación anticipada y qué hacer si el inquilino no se va.
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

        {/* TL;DR Resumen rápido */}
        <section className="bg-amber-50 border-y border-amber-200 py-6">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <p className="text-sm font-medium text-foreground mb-2">Resumen rápido</p>
                <p className="text-muted-foreground speakable-summary">
                  Solo puedes no renovar el contrato tras 5 años (particular) o 7 años (empresa) + 3 años de 
                  prórrogas obligatorias, notificando con 4 meses de antelación. Para recuperar antes por necesidad 
                  propia, debe estar previsto en el{" "}
                  <Link to="/contrato-alquiler-propietarios" className="underline hover:text-foreground">contrato</Link>. 
                  Conoce también las reglas de{" "}
                  <Link to="/deposito-fianza-propietarios" className="underline hover:text-foreground">devolución de fianza</Link> y qué hacer ante{" "}
                  <Link to="/impago-alquiler-propietarios" className="underline hover:text-foreground">impago de alquiler</Link>.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Última actualización: enero 2026 | Normativa vigente: LAU
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Timeline de duraciones */}
        <section className="bg-muted py-12">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-4xl mx-auto">
                <h2 className="font-serif text-2xl font-medium text-foreground mb-6 text-center">
                  Duración mínima de un contrato de vivienda habitual
                </h2>
                <div className="bg-background rounded-2xl p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center">
                      <p className="text-4xl font-serif font-medium text-foreground">5-7</p>
                      <p className="text-sm text-muted-foreground">años mínimo</p>
                      <p className="text-xs text-muted-foreground">(5 particular, 7 empresa)</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">+</div>
                    <div className="text-center">
                      <p className="text-4xl font-serif font-medium text-foreground">3</p>
                      <p className="text-sm text-muted-foreground">años prórrogas</p>
                      <p className="text-xs text-muted-foreground">obligatorias</p>
                    </div>
                    <div className="text-2xl text-muted-foreground">+</div>
                    <div className="text-center">
                      <p className="text-4xl font-serif font-medium text-foreground">∞</p>
                      <p className="text-sm text-muted-foreground">prórrogas tácitas</p>
                      <p className="text-xs text-muted-foreground">(año a año)</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Tipos de fin de contrato */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  ¿Cuándo puedes no renovar el contrato?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  La LAU establece diferentes fases con distintas posibilidades de finalización.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-4xl mx-auto space-y-6">
              {tiposFinContrato.map((tipo, index) => (
                <FadeIn key={tipo.titulo} delay={index * 0.1}>
                  <div className="bg-muted rounded-2xl p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-serif text-lg font-medium text-foreground">
                            {tipo.titulo}
                          </h3>
                          <span className="text-xs bg-foreground text-background px-2 py-1 rounded-full">
                            {tipo.duracion}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">{tipo.descripcion}</p>
                        <p className="text-sm">
                          <Bell className="w-4 h-4 inline mr-1 text-foreground" />
                          <strong>Acción:</strong> {tipo.accion}
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Causas de recuperación */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Causas para recuperar la vivienda antes de tiempo
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  No todas las razones permiten finalizar el contrato anticipadamente.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-4xl mx-auto space-y-4">
              {causasRecuperacion.map((causa, index) => (
                <FadeIn key={causa.causa} delay={index * 0.1}>
                  <div className={`rounded-2xl p-6 border-2 ${
                    causa.permitido 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-4">
                      {causa.permitido ? (
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {causa.causa}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-2">
                          {causa.descripcion}
                        </p>
                        <p className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
                          <strong>Requisitos:</strong> {causa.requisitos}
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Tabla de preavisos */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Plazos de preaviso
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Plazos legales para notificar la no renovación o finalización del contrato.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="max-w-4xl mx-auto overflow-x-auto">
                <table className="w-full bg-muted rounded-2xl overflow-hidden">
                  <thead className="bg-foreground text-background">
                    <tr>
                      <th className="px-4 py-4 text-left font-medium">Quién</th>
                      <th className="px-4 py-4 text-left font-medium">Situación</th>
                      <th className="px-4 py-4 text-left font-medium">Plazo</th>
                      <th className="px-4 py-4 text-left font-medium">Consecuencias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preavisos.map((preaviso, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted'}>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                            preaviso.quien === 'Propietario' ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {preaviso.quien === 'Propietario' ? <Home className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            {preaviso.quien}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-muted-foreground">{preaviso.situacion}</td>
                        <td className="px-4 py-4">
                          <span className="inline-block bg-foreground text-background px-2 py-1 rounded text-xs font-medium">
                            {preaviso.plazo}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground">{preaviso.consecuencias}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-foreground text-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <CalendarX className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                  ¿Quieres saber cuándo puedes recuperar tu vivienda?
                </h2>
                <p className="text-background/80 mb-8 max-w-xl mx-auto">
                  Analiza tu contrato y verifica las fechas clave: cuándo termina el periodo mínimo, 
                  las prórrogas obligatorias y cuándo puedes notificar la no renovación.
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
                  Preguntas frecuentes sobre fin de contrato
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
                  Esta guía tiene carácter orientativo. Los procedimientos de desahucio y recuperación de vivienda 
                  requieren asesoramiento legal profesional. Nunca tomes acciones unilaterales como cambiar cerraduras 
                  o cortar suministros, ya que podrían constituir delito.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Guías relacionadas */}
        <RelatedLandlordGuides currentSlug="/fin-contrato-alquiler-propietarios" />
      </main>

      <Footer />
    </>
  );
};

export default FinContratoAlquilerPropietarios;

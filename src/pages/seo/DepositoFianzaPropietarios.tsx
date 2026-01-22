import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Euro,
  FileText,
  Shield,
  MapPin
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

const organismosPorCCAA = [
  { ccaa: "Cataluña", organismo: "INCASOL", plazo: "2 meses desde firma", web: "incasol.gencat.cat" },
  { ccaa: "Madrid", organismo: "IVIMA (ahora AVM)", plazo: "1 mes desde firma", web: "comunidad.madrid" },
  { ccaa: "País Vasco", organismo: "Gobierno Vasco", plazo: "1 mes desde firma", web: "euskadi.eus" },
  { ccaa: "Andalucía", organismo: "Junta de Andalucía", plazo: "1 mes desde firma", web: "juntadeandalucia.es" },
  { ccaa: "Valencia", organismo: "GVA Vivienda", plazo: "15 días desde firma", web: "gva.es" },
  { ccaa: "Galicia", organismo: "IGVS", plazo: "1 mes desde firma", web: "igvs.xunta.gal" },
];

const descuentosPermitidos = [
  {
    permitido: true,
    concepto: "Rentas impagadas",
    descripcion: "Puedes descontar mensualidades de alquiler que el inquilino no haya abonado."
  },
  {
    permitido: true,
    concepto: "Suministros pendientes",
    descripcion: "Facturas de agua, luz o gas a nombre del inquilino que hayan quedado impagadas."
  },
  {
    permitido: true,
    concepto: "Desperfectos por mal uso",
    descripcion: "Daños que excedan el desgaste normal del uso habitual, debidamente documentados."
  },
  {
    permitido: false,
    concepto: "Desgaste natural",
    descripcion: "Pintura deteriorada, pequeñas marcas en paredes o desgaste de muebles por uso normal."
  },
  {
    permitido: false,
    concepto: "Mejoras que aumentan valor",
    descripcion: "El inquilino no tiene que costear mejoras que revalorizan la vivienda."
  },
  {
    permitido: false,
    concepto: "Limpieza básica",
    descripcion: "La limpieza ordinaria de entrega no puede descontarse si no es extraordinaria."
  }
];

const pasosDevolucion = [
  {
    numero: 1,
    titulo: "Inspección final conjunta",
    descripcion: "Revisa la vivienda con el inquilino presente. Documenta con fotos el estado de la vivienda y compáralo con el inventario inicial.",
    plazo: "En la entrega de llaves"
  },
  {
    numero: 2,
    titulo: "Liquidación de cuentas",
    descripcion: "Verifica que no hay rentas ni suministros pendientes. Solicita al inquilino los justificantes de pago de los últimos recibos.",
    plazo: "Primeros días tras entrega"
  },
  {
    numero: 3,
    titulo: "Cálculo de descuentos",
    descripcion: "Si hay desperfectos o deudas, calcula los descuentos justificados y comunícalos por escrito al inquilino.",
    plazo: "Antes de la devolución"
  },
  {
    numero: 4,
    titulo: "Devolución efectiva",
    descripcion: "Devuelve la fianza (menos descuentos justificados) en el plazo legal de 1 mes desde la entrega de llaves.",
    plazo: "Máximo 1 mes"
  },
  {
    numero: 5,
    titulo: "Solicitar devolución al organismo",
    descripcion: "Si depositaste la fianza en el organismo autonómico, solicita la devolución aportando el finiquito del contrato.",
    plazo: "Tras liquidar con inquilino"
  }
];

const faqs = [
  {
    question: "¿Estoy obligado a depositar la fianza en un organismo oficial?",
    answer: "Sí, en la mayoría de Comunidades Autónomas es obligatorio depositar la fianza en el organismo correspondiente (INCASOL, IVIMA, etc.) en el plazo establecido. El incumplimiento puede acarrear sanciones."
  },
  {
    question: "¿Cuánto tiempo tengo para devolver la fianza al inquilino?",
    answer: "El plazo legal es de 1 mes desde la entrega de llaves. Si no devuelves la fianza en este plazo, empiezan a generarse intereses legales a favor del inquilino sobre la cantidad adeudada."
  },
  {
    question: "¿Puedo quedarme con la fianza si el inquilino se va antes de tiempo?",
    answer: "No automáticamente. Si el inquilino ejerce su derecho de desistimiento tras 6 meses, debe pagarte 1 mes de indemnización por cada año que falte, pero no pierdes el derecho a retener la fianza solo por eso. La fianza cubre rentas impagadas y desperfectos."
  },
  {
    question: "¿Cómo documento los desperfectos para justificar descuentos?",
    answer: "Realiza un inventario fotográfico al inicio y al final del contrato. Haz la inspección final con el inquilino presente y firma un acta de estado de la vivienda. Guarda facturas de reparaciones si las hay."
  },
  {
    question: "¿Qué pasa si la fianza no cubre todos los daños?",
    answer: "Si los daños superan el importe de la fianza, puedes reclamar la diferencia al inquilino. Primero intenta un acuerdo amistoso y, si no hay respuesta, puedes acudir a un procedimiento monitorio para deudas líquidas."
  },
  {
    question: "¿Puedo cobrar más de 1 mes de fianza?",
    answer: "La fianza legal es siempre de 1 mes de renta para vivienda habitual. Además, puedes pedir una garantía adicional, pero el total (fianza + garantía) no puede superar 3 meses de renta en ningún caso."
  }
];

const DepositoFianzaPropietarios = () => {
  const breadcrumbItems = [
    { label: "Para Propietarios" },
    { label: "Depósito de Fianza" },
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Depósito de Fianza: Guía Completa para Propietarios 2026",
    "description": "Todo sobre el depósito de fianza para propietarios: dónde depositarla, plazos por comunidad autónoma, devolución al inquilino y descuentos permitidos.",
    "url": "https://acroxia.com/deposito-fianza-propietarios",
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
        <title>Depósito de Fianza de Alquiler: Guía para Propietarios 2026</title>
        <meta 
          name="description" 
          content="Guía completa sobre la fianza de alquiler para propietarios: dónde depositarla (INCASOL, IVIMA), plazos por comunidad, devolución y descuentos permitidos." 
        />
        <meta 
          name="keywords" 
          content="depositar fianza alquiler, INCASOL, IVIMA, devolucion fianza propietario, organismo deposito fianza, descuentos fianza" 
        />
        <link rel="canonical" href="https://acroxia.com/deposito-fianza-propietarios" />
        <meta property="og:title" content="Depósito de Fianza de Alquiler: Guía para Propietarios 2026" />
        <meta property="og:description" content="Todo sobre la fianza para propietarios: dónde depositarla, plazos y descuentos permitidos." />
        <meta property="og:url" content="https://acroxia.com/deposito-fianza-propietarios" />
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
                  <Building2 className="w-4 h-4 text-foreground" />
                  <span className="text-sm text-muted-foreground">Para propietarios</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
                  Depósito de fianza: obligaciones del propietario
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Dónde depositar la fianza, qué plazos tienes según tu comunidad autónoma, 
                  cómo devolverla correctamente y qué puedes descontar legalmente.
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

        {/* Datos clave */}
        <section className="bg-muted py-12">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <FadeIn>
                <div className="bg-background rounded-2xl p-6 text-center">
                  <Euro className="w-8 h-8 mx-auto mb-3 text-foreground" />
                  <p className="font-serif text-3xl font-medium text-foreground">1 mes</p>
                  <p className="text-sm text-muted-foreground">Fianza legal máxima (vivienda habitual)</p>
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <div className="bg-background rounded-2xl p-6 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-3 text-foreground" />
                  <p className="font-serif text-3xl font-medium text-foreground">30 días</p>
                  <p className="text-sm text-muted-foreground">Plazo devolución al inquilino</p>
                </div>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="bg-background rounded-2xl p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-3 text-foreground" />
                  <p className="font-serif text-3xl font-medium text-foreground">3 meses</p>
                  <p className="text-sm text-muted-foreground">Máximo total fianza + garantías</p>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Organismos por CCAA */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Dónde depositar la fianza según tu Comunidad
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Cada Comunidad Autónoma tiene su propio organismo y plazos de depósito.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="max-w-4xl mx-auto overflow-x-auto">
                <table className="w-full bg-muted rounded-2xl overflow-hidden">
                  <thead className="bg-foreground text-background">
                    <tr>
                      <th className="px-6 py-4 text-left font-medium">Comunidad</th>
                      <th className="px-6 py-4 text-left font-medium">Organismo</th>
                      <th className="px-6 py-4 text-left font-medium">Plazo depósito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organismosPorCCAA.map((ccaa, index) => (
                      <tr key={ccaa.ccaa} className={index % 2 === 0 ? 'bg-background' : 'bg-muted'}>
                        <td className="px-6 py-4 font-medium">{ccaa.ccaa}</td>
                        <td className="px-6 py-4 text-muted-foreground">{ccaa.organismo}</td>
                        <td className="px-6 py-4 text-muted-foreground">{ccaa.plazo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Consulta la normativa específica de tu Comunidad Autónoma para plazos y requisitos actualizados.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Descuentos permitidos */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Qué puedes descontar de la fianza
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  No todo justifica retener parte de la fianza. Conoce los descuentos legítimos.
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {descuentosPermitidos.map((item, index) => (
                <FadeIn key={item.concepto} delay={index * 0.1}>
                  <div className={`rounded-2xl p-6 border-2 ${
                    item.permitido 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {item.permitido ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {item.concepto}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {item.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Pasos devolución */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-12">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Cómo devolver la fianza correctamente
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Sigue estos pasos para una devolución sin conflictos.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-4xl mx-auto">
              {pasosDevolucion.map((paso, index) => (
                <FadeIn key={paso.numero} delay={index * 0.1}>
                  <div className="flex gap-6 mb-8 last:mb-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center font-serif text-xl font-medium">
                        {paso.numero}
                      </div>
                      {index < pasosDevolucion.length - 1 && (
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

        {/* CTA Section */}
        <section className="bg-foreground text-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <FileText className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="font-serif text-3xl md:text-4xl font-medium mb-4">
                  ¿Tu contrato protege la fianza correctamente?
                </h2>
                <p className="text-background/80 mb-8 max-w-xl mx-auto">
                  Analiza tu contrato y verifica que las cláusulas de fianza y garantías 
                  cumplen con la normativa vigente y protegen tus intereses.
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
                  Preguntas frecuentes sobre la fianza
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
                  Esta guía tiene carácter orientativo. Los plazos y requisitos pueden variar según la normativa 
                  autonómica. Consulta siempre el organismo oficial de tu Comunidad Autónoma para información actualizada.
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

export default DepositoFianzaPropietarios;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Key, FileText, Shield, Euro, MapPin, Home, Clock, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Users, Scale, Building2 } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import RelatedLandlordGuides from "@/components/seo/RelatedLandlordGuides";
import FadeIn from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const schemaWebPage = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Contrato de Alquiler para Propietarios 2026",
  "description": "Guía completa para propietarios sobre contratos de alquiler en 2026. Requisitos LAU, fianzas permitidas (máximo 3 meses), zonas tensionadas y gastos del arrendador.",
  "url": "https://acroxia.com/contrato-alquiler-propietarios",
  "inLanguage": "es-ES",
  "publisher": {
    "@type": "Organization",
    "name": "ACROXIA",
    "url": "https://acroxia.com"
  },
  "datePublished": "2026-01-14",
  "dateModified": "2026-01-23"
};

const schemaArticle = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Contrato de Alquiler para Propietarios 2026: Guía LAU Completa",
  "description": "Requisitos legales, fianzas permitidas y limitaciones en zonas tensionadas para redactar un contrato conforme a la LAU.",
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
  "datePublished": "2026-01-14",
  "dateModified": "2026-01-23",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["h1", ".speakable-summary"]
  }
};

const schemaFAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "¿Cuántos meses de fianza puedo pedir en 2026?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "En 2026, puedes pedir 1 mes de fianza legal (obligatoria) más un máximo de 2 meses de garantía adicional. El total nunca puede superar los 3 meses de renta."
      }
    },
    {
      "@type": "Question",
      "name": "¿Puedo subir la renta libremente cada año?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No. Desde 2025, la actualización anual de la renta está limitada al IRAV (Índice de Referencia de Arrendamientos de Vivienda). Debes consultar el índice vigente en la web del INE o tu comunidad autónoma."
      }
    },
    {
      "@type": "Question",
      "name": "¿Qué pasa si mi piso está en zona tensionada?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "En zonas tensionadas, la renta del nuevo contrato está limitada a la del contrato anterior. Para nuevos arrendamientos, aplica el índice de referencia de precios. Puedes verificar si tu zona está declarada tensionada en el portal SERPAVI del MIVAU."
      }
    },
    {
      "@type": "Question",
      "name": "¿Cuánto dura como mínimo un contrato de alquiler?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "La duración mínima es de 5 años si el arrendador es persona física, o 7 años si es persona jurídica. Tras este período, hay prórrogas obligatorias de hasta 3 años adicionales."
      }
    },
    {
      "@type": "Question",
      "name": "¿Puedo cobrar el IBI al inquilino?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No en contratos de vivienda habitual. El IBI es un impuesto que corresponde al propietario del inmueble. Incluir una cláusula que lo repercuta al inquilino podría considerarse abusiva."
      }
    },
    {
      "@type": "Question",
      "name": "¿Quién paga los honorarios de la inmobiliaria?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Desde la reforma de 2019, los gastos de gestión inmobiliaria y formalización del contrato corresponden al arrendador. No se pueden repercutir al inquilino."
      }
    }
  ]
};

const faqs = [
  {
    question: "¿Cuántos meses de fianza puedo pedir en 2026?",
    answer: "En 2026, puedes pedir 1 mes de fianza legal (obligatoria) más un máximo de 2 meses de garantía adicional. El total nunca puede superar los 3 meses de renta. La fianza debe depositarse en el organismo autonómico correspondiente dentro del plazo establecido por cada comunidad."
  },
  {
    question: "¿Puedo subir la renta libremente cada año?",
    answer: "No. Desde 2025, la actualización anual de la renta está limitada al IRAV (Índice de Referencia de Arrendamientos de Vivienda), que sustituye al IPC para contratos de vivienda. Debes consultar el índice vigente en la web del INE o en la página de tu comunidad autónoma."
  },
  {
    question: "¿Qué pasa si mi piso está en zona tensionada?",
    answer: "En zonas tensionadas, la renta del nuevo contrato está limitada a la del contrato anterior. Para nuevos arrendamientos sin contrato previo, aplica el índice de referencia de precios. Además, debes incluir una declaración específica en el contrato. Puedes verificar si tu zona está declarada tensionada en el portal SERPAVI del MIVAU."
  },
  {
    question: "¿Cuánto dura como mínimo un contrato de alquiler?",
    answer: "La duración mínima es de 5 años si el arrendador es persona física, o 7 años si es persona jurídica (empresas, fondos, etc.). Tras este período, si ninguna parte notifica la no renovación con 4 meses de antelación (arrendador) o 2 meses (inquilino), el contrato se prorroga obligatoriamente por períodos anuales hasta un máximo de 3 años adicionales."
  },
  {
    question: "¿Puedo cobrar el IBI al inquilino?",
    answer: "No en contratos de vivienda habitual. El IBI es un impuesto sobre la propiedad que corresponde legalmente al propietario del inmueble. Incluir una cláusula que lo repercuta al inquilino podría considerarse abusiva y ser declarada nula por un juez."
  },
  {
    question: "¿Quién paga los honorarios de la inmobiliaria?",
    answer: "Desde la reforma de la LAU en 2019, los gastos de gestión inmobiliaria y formalización del contrato corresponden al arrendador cuando este es persona jurídica. En la práctica, la jurisprudencia tiende a aplicar este criterio también a personas físicas. No se pueden repercutir estos gastos al inquilino."
  },
  {
    question: "¿Dónde debo depositar la fianza?",
    answer: "La fianza debe depositarse en el organismo autonómico correspondiente (INCASOL en Cataluña, IVIMA en Madrid, etc.). El plazo varía según la comunidad, generalmente entre 15 y 30 días desde la firma. Al finalizar el contrato, tienes 1 mes para devolver la fianza al inquilino."
  },
  {
    question: "¿Qué ocurre si no incluyo algún requisito obligatorio en el contrato?",
    answer: "La omisión de requisitos obligatorios (como la mención de la renta del contrato anterior en zonas tensionadas) puede hacer que determinadas cláusulas sean nulas. En algunos casos, puede suponer sanciones administrativas. Es recomendable usar un modelo de contrato actualizado a 2026 que incluya todos los elementos legales."
  }
];

const ContratoAlquilerPropietarios = () => {
  const breadcrumbItems = [
    { label: "Propietarios", href: "/propietarios" },
    { label: "Contrato Alquiler 2026" },
  ];

  return (
    <>
      <Helmet>
        <html lang="es-ES" />
        <title>Contrato de Alquiler para Propietarios 2026 | Requisitos LAU y Fianzas</title>
        <meta 
          name="description" 
          content="Guía completa para propietarios sobre contratos de alquiler en 2026. Requisitos LAU, fianzas permitidas (máximo 3 meses), zonas tensionadas y gastos del arrendador." 
        />
        <meta 
          name="keywords" 
          content="contrato alquiler propietario 2026, fianza alquiler máxima, zonas tensionadas propietarios, LAU arrendadores, requisitos contrato alquiler, garantía adicional alquiler" 
        />
        <link rel="canonical" href="https://acroxia.com/contrato-alquiler-propietarios" />
        <link rel="alternate" hrefLang="es-ES" href="https://acroxia.com/contrato-alquiler-propietarios" />
        <link rel="alternate" hrefLang="x-default" href="https://acroxia.com/contrato-alquiler-propietarios" />
        <meta property="og:title" content="Contrato de Alquiler para Propietarios 2026 | Guía LAU" />
        <meta property="og:description" content="Todo lo que necesitas saber para redactar un contrato de alquiler conforme a la LAU 2026. Fianzas, zonas tensionadas y requisitos obligatorios." />
        <meta property="og:url" content="https://acroxia.com/contrato-alquiler-propietarios" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
        <script type="application/ld+json">
          {JSON.stringify(schemaWebPage)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(schemaFAQ)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(schemaArticle)}
        </script>
      </Helmet>

      <Header />
      
      <Breadcrumbs items={breadcrumbItems} />

      <main>
        {/* Hero Section */}
        <section className="bg-muted py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-background rounded-full mb-6">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Para propietarios</span>
                </div>
              </FadeIn>
              
              <FadeIn delay={0.1}>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
                  Contrato de Alquiler para Propietarios 2026
                </h1>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Guía completa sobre los requisitos legales, fianzas permitidas y limitaciones 
                  en zonas tensionadas para redactar un contrato conforme a la LAU.
                </p>
              </FadeIn>
              
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-full">
                    <Link to="/propietarios">Ver planes para propietarios</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <Link to="/analizar-gratis">Analizar mi contrato</Link>
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* TL;DR Resumen rápido */}
        <section className="bg-amber-50 border-y border-amber-200 py-6">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto">
                <p className="text-sm font-medium text-foreground mb-2">Resumen rápido</p>
                <p className="text-muted-foreground speakable-summary">
                  En 2026, un contrato de alquiler de vivienda habitual debe tener una duración mínima de 5 años 
                  (7 si el arrendador es empresa). Solo puedes pedir 1 mes de fianza legal más un máximo de 2 meses 
                  de garantía adicional (total 3 meses). Si tu vivienda está en{" "}
                  <Link to="/zonas-tensionadas-propietarios" className="underline hover:text-foreground">zona tensionada</Link>, 
                  la renta está limitada. Consulta también las obligaciones sobre{" "}
                  <Link to="/deposito-fianza-propietarios" className="underline hover:text-foreground">depósito de fianza</Link>.
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  Última actualización: enero 2026 | Normativa vigente: LAU y Ley de Vivienda
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Requisitos LAU 2026 */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Requisitos de la LAU 2026
                </h2>
                <p className="text-muted-foreground text-lg">
                  Elementos obligatorios que debe incluir todo contrato de arrendamiento de vivienda habitual.
                </p>
              </div>
            </FadeIn>

            {/* Grid de requisitos principales */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <FadeIn delay={0.1}>
                <div className="bg-muted rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-medium mb-3">Duración mínima</h3>
                  <p className="text-muted-foreground">
                    <strong>5 años</strong> si el arrendador es persona física, 
                    <strong> 7 años</strong> si es persona jurídica.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.2}>
                <div className="bg-muted rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-medium mb-3">Prórrogas obligatorias</h3>
                  <p className="text-muted-foreground">
                    Hasta <strong>3 años</strong> adicionales de prórroga tácita 
                    tras el período inicial.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div className="bg-muted rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Scale className="w-8 h-8 text-foreground" />
                  </div>
                  <h3 className="font-serif text-xl font-medium mb-3">Derecho de adquisición</h3>
                  <p className="text-muted-foreground">
                    El inquilino tiene <strong>derecho de tanteo y retracto</strong> 
                    si vendes el inmueble.
                  </p>
                </div>
              </FadeIn>
            </div>

            {/* Lista de elementos obligatorios */}
            <FadeIn delay={0.4}>
              <div className="max-w-3xl mx-auto">
                <h3 className="font-serif text-2xl font-medium text-foreground mb-6 text-center">
                  Elementos obligatorios del contrato
                </h3>
                <div className="bg-muted rounded-2xl p-8">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-foreground">Identificación completa de las partes</strong>
                        <p className="text-muted-foreground text-sm">Nombre, DNI/NIE, domicilio de arrendador e inquilino.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-foreground">Descripción del inmueble</strong>
                        <p className="text-muted-foreground text-sm">Dirección completa, referencia catastral y cédula de habitabilidad o certificado equivalente.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-foreground">Renta y forma de pago</strong>
                        <p className="text-muted-foreground text-sm">Importe mensual, fecha de pago y método (transferencia, domiciliación).</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-foreground">Actualización de la renta</strong>
                        <p className="text-muted-foreground text-sm">Referencia al IRAV como índice de actualización anual.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-foreground">Duración y prórrogas</strong>
                        <p className="text-muted-foreground text-sm">Fecha de inicio, duración pactada y régimen de prórrogas.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-foreground">Fianza y garantías</strong>
                        <p className="text-muted-foreground text-sm">Importe de la fianza legal y, si procede, garantías adicionales (máximo 2 meses).</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-foreground">Certificado de eficiencia energética</strong>
                        <p className="text-muted-foreground text-sm">Obligatorio entregar copia al inquilino y mencionar en contrato.</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Fianzas y Garantías */}
        <section className="bg-muted py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Fianzas y Garantías Permitidas en 2026
                </h2>
                <p className="text-muted-foreground text-lg">
                  La LAU limita las cantidades que puedes solicitar al inquilino como garantía.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <FadeIn delay={0.1}>
                  <div className="bg-background rounded-2xl p-8 border-2 border-green-500/20">
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <h3 className="font-serif text-xl font-medium">Permitido</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <Euro className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-foreground">Fianza legal: 1 mes</strong>
                          <p className="text-muted-foreground text-sm">Obligatoria por ley. Debe depositarse en el organismo autonómico.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <Euro className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-foreground">Garantía adicional: máximo 2 meses</strong>
                          <p className="text-muted-foreground text-sm">Puede ser depósito en metálico, aval bancario o seguro de caución.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                  <div className="bg-background rounded-2xl p-8 border-2 border-red-500/20">
                    <div className="flex items-center gap-3 mb-6">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <h3 className="font-serif text-xl font-medium">No permitido</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-foreground">Total superior a 3 meses</strong>
                          <p className="text-muted-foreground text-sm">La suma de fianza + garantías no puede exceder 3 mensualidades.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-foreground">Fianza no depositada</strong>
                          <p className="text-muted-foreground text-sm">Retener la fianza sin depositarla puede conllevar sanciones.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </FadeIn>
              </div>

              <FadeIn delay={0.3}>
                <div className="bg-background rounded-2xl p-6 border border-foreground/10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Depósito de la fianza</h4>
                      <p className="text-muted-foreground text-sm">
                        La fianza debe depositarse en el organismo autonómico correspondiente (INCASOL en Cataluña, 
                        IVIMA en Madrid, etc.) dentro del plazo establecido por cada comunidad. Al finalizar el contrato, 
                        dispones de <strong>1 mes</strong> para devolver la fianza al inquilino, descontando únicamente 
                        las cantidades justificadas por daños o impagos.
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Zonas Tensionadas */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Zonas Tensionadas: Qué Debes Saber
                </h2>
                <p className="text-muted-foreground text-lg">
                  Si tu inmueble está en una zona declarada tensionada, aplican limitaciones adicionales.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-4xl mx-auto">
              <FadeIn delay={0.1}>
                <div className="bg-muted rounded-2xl p-8 mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-foreground" />
                    <h3 className="font-serif text-xl font-medium">¿Qué es una zona tensionada?</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Una zona de mercado residencial tensionado es aquella declarada por la comunidad autónoma 
                    donde la carga del alquiler supera el 30% de los ingresos medios de los hogares, o donde 
                    los precios han crecido más de 3 puntos por encima del IPC en los últimos 5 años.
                  </p>
                  <p className="text-muted-foreground">
                    Las principales ciudades españolas y sus áreas metropolitanas suelen estar declaradas 
                    como zonas tensionadas. Puedes verificar si tu municipio lo es en el portal oficial.
                  </p>
                </div>
              </FadeIn>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <FadeIn delay={0.2}>
                  <div className="bg-background border border-foreground/10 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                      <Euro className="w-6 h-6 text-foreground" />
                    </div>
                    <h4 className="font-medium text-foreground mb-2">Renta limitada</h4>
                    <p className="text-muted-foreground text-sm">
                      La renta no puede superar la del contrato anterior, actualizada según el IRAV.
                    </p>
                  </div>
                </FadeIn>

                <FadeIn delay={0.3}>
                  <div className="bg-background border border-foreground/10 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-foreground" />
                    </div>
                    <h4 className="font-medium text-foreground mb-2">Declaración obligatoria</h4>
                    <p className="text-muted-foreground text-sm">
                      Debes incluir en el contrato la renta del contrato anterior o, si no existe, indicarlo expresamente.
                    </p>
                  </div>
                </FadeIn>

                <FadeIn delay={0.4}>
                  <div className="bg-background border border-foreground/10 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4">
                      <Scale className="w-6 h-6 text-foreground" />
                    </div>
                    <h4 className="font-medium text-foreground mb-2">Índice de referencia</h4>
                    <p className="text-muted-foreground text-sm">
                      Para nuevos arrendamientos sin contrato previo, aplica el índice de referencia de precios.
                    </p>
                  </div>
                </FadeIn>
              </div>

              <FadeIn delay={0.5}>
                <div className="bg-foreground text-background rounded-2xl p-8 text-center">
                  <h3 className="font-serif text-2xl font-medium mb-4">
                    Verifica si tu zona está tensionada
                  </h3>
                  <p className="text-background/80 mb-6 max-w-xl mx-auto">
                    El Ministerio de Vivienda mantiene un portal oficial con el listado actualizado 
                    de zonas tensionadas declaradas por cada comunidad autónoma.
                  </p>
                  <Button asChild variant="secondary" size="lg" className="rounded-full">
                    <a 
                      href="https://serpavi.mivau.gob.es/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2"
                    >
                      Consultar SERPAVI (MIVAU)
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Gastos e Impuestos */}
        <section className="bg-muted py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Gastos que Corresponden al Propietario
                </h2>
                <p className="text-muted-foreground text-lg">
                  La LAU establece qué gastos no pueden repercutirse al inquilino.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-3xl mx-auto">
              <div className="grid sm:grid-cols-2 gap-6">
                <FadeIn delay={0.1}>
                  <div className="bg-background rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <Home className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="font-medium">IBI</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      El Impuesto sobre Bienes Inmuebles corresponde siempre al propietario.
                    </p>
                  </div>
                </FadeIn>

                <FadeIn delay={0.2}>
                  <div className="bg-background rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="font-medium">Comunidad de propietarios</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Salvo pacto expreso en contrario, las cuotas de comunidad corresponden al propietario.
                    </p>
                  </div>
                </FadeIn>

                <FadeIn delay={0.3}>
                  <div className="bg-background rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="font-medium">Seguro del edificio</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      El seguro de la estructura y elementos comunes es responsabilidad del propietario.
                    </p>
                  </div>
                </FadeIn>

                <FadeIn delay={0.4}>
                  <div className="bg-background rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="font-medium">Gastos de gestión</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Honorarios de inmobiliaria y formalización del contrato.
                    </p>
                  </div>
                </FadeIn>

                <FadeIn delay={0.5}>
                  <div className="bg-background rounded-2xl p-6 sm:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-foreground" />
                      </div>
                      <h3 className="font-medium">Reparaciones estructurales</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Las reparaciones necesarias para mantener la habitabilidad de la vivienda (fontanería, 
                      electricidad, caldera, etc.) corresponden al propietario, salvo que el daño sea 
                      imputable al inquilino por mal uso.
                    </p>
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-foreground py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-background mb-6">
                  ¿Necesitas un contrato conforme a la ley?
                </h2>
                <p className="text-background/80 text-lg mb-8">
                  ACROXIA te ayuda a verificar que tu contrato cumple con todos los requisitos 
                  de la LAU 2026 y a detectar posibles cláusulas problemáticas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" variant="secondary" className="rounded-full">
                    <Link to="/propietarios">Ver planes para propietarios</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-background/20 text-background hover:bg-background/10">
                    <Link to="/analizar-gratis">Analizar mi contrato gratis</Link>
                  </Button>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Preguntas frecuentes para propietarios
                </h2>
                <p className="text-muted-foreground text-lg">
                  Resolvemos las dudas más comunes sobre contratos de alquiler.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="max-w-3xl mx-auto">
                <Accordion type="single" collapsible className="space-y-4">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`faq-${index}`}
                      className="bg-muted rounded-2xl px-6 border-none"
                    >
                      <AccordionTrigger className="text-left font-medium hover:no-underline py-6">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-6">
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
                  Esta guía tiene carácter informativo y no sustituye el asesoramiento legal profesional. 
                  El cálculo del IRAV y la verificación de zonas tensionadas debe realizarse en las fuentes 
                  oficiales (INE, MIVAU o webs autonómicas). ACROXIA es una herramienta de apoyo informativo.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Guías relacionadas */}
        <RelatedLandlordGuides currentSlug="/contrato-alquiler-propietarios" />
      </main>

      <Footer />
    </>
  );
};

export default ContratoAlquilerPropietarios;

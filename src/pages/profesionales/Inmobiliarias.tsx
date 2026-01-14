import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Building2, Clock, Shield, Users, CheckCircle, ArrowRight, FileText, TrendingUp } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import { Button } from "@/components/ui/button";
import Breadcrumbs from "@/components/seo/Breadcrumbs";

const painPoints = [
  {
    icon: Clock,
    title: "Horas revisando contratos",
    description: "Tu equipo dedica tiempo valioso a revisar manualmente cada cláusula de los contratos de alquiler.",
  },
  {
    icon: Shield,
    title: "Riesgo de pasar algo por alto",
    description: "Con el volumen de contratos que gestionáis, es fácil que alguna cláusula problemática pase desapercibida.",
  },
  {
    icon: FileText,
    title: "Sin herramientas especializadas",
    description: "Las herramientas genéricas no están adaptadas a la normativa española de arrendamientos.",
  },
];

const benefits = [
  {
    icon: Clock,
    title: "Análisis en menos de 2 minutos",
    description: "Reduce el tiempo de revisión de contratos drásticamente. Tu equipo puede centrarse en lo que realmente importa: cerrar operaciones.",
  },
  {
    icon: Building2,
    title: "Informes con tu marca",
    description: "Genera informes profesionales personalizados con el logo de tu inmobiliaria. Transmite confianza a tus clientes.",
  },
  {
    icon: Users,
    title: "Dashboard para tu equipo",
    description: "Gestiona todos los análisis de tu equipo desde un único panel. Control total sobre la actividad y el historial.",
  },
];

const useCases = [
  {
    title: "Propiedades en alquiler",
    description: "Antes de publicar una propiedad, analiza el contrato tipo para asegurar que cumple con la normativa vigente.",
  },
  {
    title: "Gestión de cartera",
    description: "Revisa contratos existentes de tu cartera de propiedades e identifica cláusulas que podrían actualizarse.",
  },
  {
    title: "Renovaciones",
    description: "Cuando un contrato está próximo a renovarse, analiza las condiciones para negociar con información.",
  },
];

const plans = [
  {
    name: "Plan Profesional",
    price: "99",
    period: "/mes",
    description: "Ideal para inmobiliarias con volumen moderado",
    features: [
      "10 análisis al mes",
      "Dashboard personalizado",
      "Informes con tu marca",
      "Soporte sobre la plataforma",
    ],
    highlighted: false,
  },
  {
    name: "Plan Profesional Plus",
    price: "149",
    period: "/mes",
    description: "Para equipos con alto volumen de contratos",
    features: [
      "Análisis ilimitados",
      "Dashboard personalizado",
      "Informes con tu marca",
      "Soporte sobre la plataforma",
    ],
    highlighted: true,
  },
];

const schemaService = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "ACROXIA para Inmobiliarias",
  "provider": {
    "@type": "Organization",
    "name": "ACROXIA",
    "url": "https://acroxia.com"
  },
  "serviceType": "Análisis de contratos de alquiler con IA",
  "areaServed": {
    "@type": "Country",
    "name": "España"
  },
  "description": "Herramienta de análisis de contratos de alquiler para inmobiliarias y APIs. Identifica cláusulas potencialmente problemáticas en menos de 2 minutos.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Plan Profesional",
      "price": "99",
      "priceCurrency": "EUR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "99",
        "priceCurrency": "EUR",
        "billingDuration": "P1M"
      }
    },
    {
      "@type": "Offer",
      "name": "Plan Profesional Plus",
      "price": "149",
      "priceCurrency": "EUR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "149",
        "priceCurrency": "EUR",
        "billingDuration": "P1M"
      }
    }
  ]
};

const Inmobiliarias = () => {
  const breadcrumbItems = [
    { label: "Para Profesionales", href: "/pricing" },
    { label: "Inmobiliarias y APIs" },
  ];

  return (
    <>
      <Helmet>
        <title>ACROXIA para Inmobiliarias y APIs | Análisis de Contratos con IA</title>
        <meta 
          name="description" 
          content="Herramienta de análisis de contratos para inmobiliarias y APIs. Identifica cláusulas potencialmente problemáticas en menos de 2 minutos. Planes desde 99€/mes." 
        />
        <meta 
          name="keywords" 
          content="análisis contratos inmobiliaria, software inmobiliarias, gestión contratos alquiler, herramienta APIs, contratos arrendamiento" 
        />
        <link rel="canonical" href="https://acroxia.com/profesionales/inmobiliarias" />
        <meta property="og:title" content="ACROXIA para Inmobiliarias | Análisis de Contratos con IA" />
        <meta property="og:description" content="Optimiza la gestión de contratos en tu inmobiliaria. Análisis con IA en menos de 2 minutos." />
        <meta property="og:url" content="https://acroxia.com/profesionales/inmobiliarias" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(schemaService)}
        </script>
      </Helmet>

      <Header />

      <Breadcrumbs items={breadcrumbItems} />

      <main>
        {/* Hero Section */}
        <section className="bg-background pt-10 pb-20 lg:pb-28">
          <div className="container mx-auto px-6">
            
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <span className="inline-block px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-full mb-6">
                  Para Inmobiliarias y APIs
                </span>
              </FadeIn>
              
              <FadeIn delay={0.1}>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground leading-tight mb-6">
                  Optimiza la gestión de contratos en tu inmobiliaria
                </h1>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                  Herramienta de análisis con IA que ayuda a tu equipo a identificar cláusulas potencialmente problemáticas antes de firmar
                </p>
              </FadeIn>
              
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link to="/registro">Contratar Plan Profesional</Link>
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  ¿Te resulta familiar?
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Los desafíos diarios de gestionar contratos de alquiler en una inmobiliaria
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {painPoints.map((point, index) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className="bg-background rounded-2xl p-8 shadow-lg">
                    <div className="w-12 h-12 bg-foreground/10 rounded-xl flex items-center justify-center mb-6">
                      <point.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                      {point.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Cómo ACROXIA ayuda a tu equipo
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Herramientas diseñadas para profesionales inmobiliarios
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <benefit.icon className="w-8 h-8 text-background" />
                    </div>
                    <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-muted py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <FadeIn>
                <div className="text-center mb-16">
                  <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                    Casos de uso en tu día a día
                  </h2>
                </div>
              </FadeIn>

              <div className="grid md:grid-cols-3 gap-8">
                {useCases.map((useCase, index) => (
                  <FadeIn key={index} delay={index * 0.1}>
                    <div className="bg-background rounded-2xl p-8 shadow-lg h-full">
                      <div className="w-10 h-10 bg-foreground text-background rounded-full flex items-center justify-center font-serif text-lg font-medium mb-6">
                        {index + 1}
                      </div>
                      <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                        {useCase.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {useCase.description}
                      </p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-background py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Planes para tu inmobiliaria
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Elige el plan que mejor se adapte al volumen de tu equipo
                </p>
              </div>
            </FadeIn>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <FadeIn key={index} delay={index * 0.1}>
                  <div 
                    className={`rounded-2xl p-8 h-full flex flex-col ${
                      plan.highlighted 
                        ? "bg-foreground text-background shadow-2xl shadow-foreground/20" 
                        : "bg-muted"
                    }`}
                  >
                    <div className="mb-6">
                      <h3 className={`font-serif text-2xl font-medium mb-2 ${
                        plan.highlighted ? "text-background" : "text-foreground"
                      }`}>
                        {plan.name}
                      </h3>
                      <p className={plan.highlighted ? "text-background/70" : "text-muted-foreground"}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-8">
                      <span className={`font-serif text-5xl font-medium ${
                        plan.highlighted ? "text-background" : "text-foreground"
                      }`}>
                        {plan.price}€
                      </span>
                      <span className={plan.highlighted ? "text-background/70" : "text-muted-foreground"}>
                        {plan.period}
                      </span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            plan.highlighted ? "text-background" : "text-foreground"
                          }`} />
                          <span className={plan.highlighted ? "text-background/90" : "text-foreground"}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      asChild 
                      size="lg" 
                      className={`w-full rounded-full ${
                        plan.highlighted 
                          ? "bg-background text-foreground hover:bg-background/90" 
                          : ""
                      }`}
                      variant={plan.highlighted ? "secondary" : "default"}
                    >
                      <Link to="/registro">Contratar</Link>
                    </Button>
                  </div>
                </FadeIn>
              ))}
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
                  ACROXIA es una herramienta de apoyo informativo que utiliza inteligencia artificial para analizar contratos de alquiler. 
                  Los resultados tienen carácter orientativo y no sustituyen el asesoramiento legal profesional. 
                  Recomendamos consultar con un abogado especializado para decisiones legales.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-foreground py-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-background mb-6">
                  Empieza a optimizar tu gestión hoy
                </h2>
                <p className="text-background/70 text-lg mb-10">
                  Únete a las inmobiliarias que ya utilizan ACROXIA para agilizar la revisión de contratos
                </p>
                <Button 
                  asChild 
                  size="lg" 
                  className="rounded-full px-8 bg-background text-foreground hover:bg-background/90"
                >
                  <Link to="/registro">
                    Contratar ahora
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Inmobiliarias;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { Clock, FileText, Shield, Building2, Users, CheckCircle, ArrowRight, Briefcase, FolderOpen, RefreshCw } from "lucide-react";

const painPoints = [
  {
    icon: Clock,
    title: "Clientes que esperan respuestas",
    description: "Tus clientes necesitan saber si su contrato tiene problemas, pero revisar cada documento lleva tiempo."
  },
  {
    icon: FileText,
    title: "Volumen de documentación",
    description: "Entre comunidades de propietarios y contratos individuales, el volumen de documentos puede ser abrumador."
  },
  {
    icon: Shield,
    title: "Responsabilidad profesional",
    description: "Como gestor, necesitas herramientas fiables que te ayuden a ofrecer un servicio de calidad."
  }
];

const benefits = [
  {
    icon: Clock,
    title: "Respuestas en minutos",
    description: "Ofrece a tus clientes un análisis inicial en menos de 2 minutos. Mejora tu tiempo de respuesta y satisfacción."
  },
  {
    icon: Building2,
    title: "Servicio diferenciador",
    description: "Añade el análisis de contratos a tu cartera de servicios. Un valor añadido que te distingue de la competencia."
  },
  {
    icon: Users,
    title: "Gestión centralizada",
    description: "Dashboard para controlar todos los análisis. Historial por cliente y seguimiento de renovaciones."
  }
];

const useCases = [
  {
    icon: Briefcase,
    title: "Nuevos contratos de clientes",
    description: "Cuando un cliente te trae un contrato para revisar, analízalo al instante e identifica posibles problemas."
  },
  {
    icon: FolderOpen,
    title: "Comunidades de propietarios",
    description: "Gestiona los contratos de arrendamiento de las comunidades que administras con mayor agilidad."
  },
  {
    icon: RefreshCw,
    title: "Renovaciones y actualizaciones",
    description: "Mantén un seguimiento de las renovaciones y analiza las nuevas condiciones antes de que tus clientes firmen."
  }
];

const plans = [
  {
    name: "Plan Profesional",
    price: "99",
    period: "/mes",
    description: "Ideal para gestorías con volumen moderado",
    features: [
      "10 análisis al mes",
      "Dashboard personalizado",
      "Informes con tu marca",
      "Soporte sobre la plataforma",
    ],
    highlighted: false
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
    highlighted: true
  }
];

const schemaService = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "ACROXIA para Gestorías y Administradores de Fincas",
  "provider": {
    "@type": "Organization",
    "name": "ACROXIA",
    "url": "https://acroxia.com"
  },
  "serviceType": "Análisis de contratos de alquiler con IA",
  "description": "Herramienta de análisis de contratos para gestorías y administradores de fincas. Ofrece un servicio diferenciador a tus clientes.",
  "areaServed": {
    "@type": "Country",
    "name": "España"
  }
};

const Gestorias = () => {
const breadcrumbItems = [
    { label: "Para Profesionales" },
    { label: "Gestorías" }
  ];

  return (
    <>
      <Helmet>
        <title>ACROXIA para Gestorías y Administradores de Fincas | Análisis de Contratos</title>
        <meta 
          name="description" 
          content="Herramienta de análisis de contratos para gestorías y administradores de fincas. Ofrece un servicio diferenciador a tus clientes. Planes desde 99€/mes." 
        />
        <meta 
          name="keywords" 
          content="análisis contratos gestoría, administrador fincas contratos, software gestión alquiler, herramienta contratos IA, gestoría administrativa" 
        />
        <link rel="canonical" href="https://acroxia.com/profesionales/gestorias" />
        <script type="application/ld+json">
          {JSON.stringify(schemaService)}
        </script>
      </Helmet>

      <Header />
      
      <Breadcrumbs items={breadcrumbItems} />

      <main>
        {/* Hero Section */}
        <section className="pt-10 pb-20 md:pb-28 bg-background">
          <div className="container mx-auto px-6">
            
            <div className="max-w-4xl mx-auto text-center">
              <FadeIn>
                <span className="inline-block px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-full mb-6">
                  Para Gestorías y Administradores de Fincas
                </span>
              </FadeIn>
              
              <FadeIn delay={0.1}>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6 leading-tight">
                  Simplifica la gestión de contratos de tus clientes
                </h1>
              </FadeIn>
              
              <FadeIn delay={0.2}>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Herramienta de análisis con IA que ayuda a tu equipo a identificar cláusulas 
                  potencialmente problemáticas en contratos de arrendamiento.
                </p>
              </FadeIn>
              
              <FadeIn delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="rounded-full px-8" asChild>
                    <Link to="/contacto">
                      Contratar Plan Profesional
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  ¿Te resultan familiares estos desafíos?
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  La gestión de contratos de alquiler puede consumir recursos valiosos de tu equipo
                </p>
              </div>
            </FadeIn>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {painPoints.map((point, index) => (
                <FadeIn key={index} delay={0.1 * (index + 1)}>
                  <div className="bg-background rounded-2xl p-8 shadow-lg">
                    <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-6">
                      <point.icon className="h-6 w-6 text-destructive" />
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
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Cómo ACROXIA puede ayudarte
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Herramientas diseñadas para optimizar tu trabajo diario
                </p>
              </div>
            </FadeIn>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <FadeIn key={index} delay={0.1 * (index + 1)}>
                  <div className="bg-muted rounded-2xl p-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                      <benefit.icon className="h-6 w-6 text-primary" />
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
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Casos de uso en tu día a día
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  ACROXIA se adapta a las necesidades específicas de gestorías y administradores
                </p>
              </div>
            </FadeIn>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {useCases.map((useCase, index) => (
                <FadeIn key={index} delay={0.1 * (index + 1)}>
                  <div className="bg-background rounded-2xl p-8 shadow-lg border border-border/50">
                    <div className="w-12 h-12 bg-secondary/50 rounded-xl flex items-center justify-center mb-6">
                      <useCase.icon className="h-6 w-6 text-foreground" />
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
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="text-center mb-16">
                <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-4">
                  Planes para gestorías y administradores
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Elige el plan que mejor se adapte al volumen de tu gestoría
                </p>
              </div>
            </FadeIn>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, index) => (
                <FadeIn key={index} delay={0.1 * (index + 1)}>
                  <div className={`rounded-2xl p-8 ${plan.highlighted ? 'bg-foreground text-background ring-2 ring-foreground' : 'bg-muted text-foreground'}`}>
                    <h3 className={`font-serif text-2xl font-medium mb-2 ${plan.highlighted ? 'text-background' : 'text-foreground'}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-sm mb-6 ${plan.highlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
                      {plan.description}
                    </p>
                    
                    <div className="flex items-baseline mb-8">
                      <span className={`text-4xl font-serif font-medium ${plan.highlighted ? 'text-background' : 'text-foreground'}`}>
                        {plan.price}€
                      </span>
                      <span className={`ml-1 ${plan.highlighted ? 'text-background/70' : 'text-muted-foreground'}`}>
                        {plan.period}
                      </span>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-background/80' : 'text-primary'}`} />
                          <span className={plan.highlighted ? 'text-background/90' : 'text-foreground'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full rounded-full ${plan.highlighted ? 'bg-background text-foreground hover:bg-background/90' : ''}`}
                      variant={plan.highlighted ? "secondary" : "default"}
                      asChild
                    >
                      <Link to="/contacto">Contratar</Link>
                    </Button>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-6" />
                <h3 className="font-serif text-2xl font-medium text-foreground mb-4">
                  Herramienta de apoyo profesional
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  ACROXIA es una herramienta de apoyo informativo que utiliza inteligencia artificial 
                  para analizar contratos de alquiler. Los resultados tienen carácter orientativo y 
                  no sustituyen el asesoramiento legal profesional. Recomendamos consultar con un 
                  abogado especializado para decisiones legales.
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 bg-foreground text-background">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="font-serif text-3xl md:text-4xl font-medium mb-6">
                  Ofrece un servicio más completo a tus clientes
                </h2>
                <p className="text-background/80 text-lg mb-8 max-w-2xl mx-auto">
                  Únete a las gestorías y administradores de fincas que ya utilizan ACROXIA 
                  como herramienta de apoyo en la gestión de contratos de alquiler.
                </p>
                <Button 
                  size="lg" 
                  className="rounded-full px-8 bg-background text-foreground hover:bg-background/90"
                  asChild
                >
                  <Link to="/contacto">
                    Contratar ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
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

export default Gestorias;

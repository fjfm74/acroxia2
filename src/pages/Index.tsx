import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";


const Index = () => {
  // Schema Organization - Enriquecido para E-E-A-T
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ACROXIA",
    "legalName": "ACROXIA",
    "url": "https://acroxia.com",
    "logo": "https://acroxia.com/acroxia-logo.png",
    "image": "https://acroxia.com/og-image.jpg",
    "description": "Plataforma de IA para análisis de contratos de alquiler y protección de derechos del inquilino en España. Detecta cláusulas abusivas en menos de 2 minutos.",
    "slogan": "Protege tus derechos como inquilino con IA",
    "foundingDate": "2025",
    "foundingLocation": {
      "@type": "Place",
      "name": "España"
    },
    "areaServed": {
      "@type": "Country",
      "name": "España"
    },
    "knowsLanguage": "es",
    "sameAs": [
      "https://twitter.com/acroxia",
      "https://linkedin.com/company/acroxia"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contacto@acroxia.com",
      "availableLanguage": "Spanish"
    }
  };

  // Schema SoftwareApplication
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ACROXIA - Analizador de Contratos de Alquiler",
    "applicationCategory": "LegalApplication",
    "operatingSystem": "Web",
    "description": "Analiza tu contrato de alquiler con IA y detecta cláusulas abusivas en menos de 2 minutos",
    "offers": {
      "@type": "Offer",
      "price": "39",
      "priceCurrency": "EUR",
      "description": "Informe completo de análisis (preview gratuito disponible)"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    }
  };

  // Schema HowTo
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cómo analizar tu contrato de alquiler con IA",
    "description": "Guía paso a paso para detectar cláusulas abusivas en tu contrato de alquiler usando inteligencia artificial",
    "totalTime": "PT2M",
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Sube tu contrato",
        "text": "Arrastra tu PDF o imagen del contrato. Aceptamos cualquier formato legible."
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Análisis IA",
        "text": "Nuestra inteligencia artificial revisa cada cláusula según la LAU y jurisprudencia vigente."
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Recibe tu informe",
        "text": "Obtén un informe detallado con cláusulas potencialmente problemáticas identificadas y orientaciones claras."
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>ACROXIA - Analiza tu Contrato de Alquiler con IA | Detecta Cláusulas Abusivas</title>
        <meta 
          name="description" 
          content="Detecta cláusulas abusivas en tu contrato de alquiler en menos de 2 minutos. IA legal para inquilinos en España. Preview gratuito, informe completo desde 39€." 
        />
        <meta 
          name="keywords" 
          content="analizar contrato alquiler, cláusulas abusivas alquiler, derechos inquilino España, LAU 2026, IA legal, contrato arrendamiento" 
        />
        <link rel="canonical" href="https://acroxia.com/" />
        
        {/* Open Graph específico para homepage */}
        <meta property="og:title" content="ACROXIA - Protege tus Derechos como Inquilino" />
        <meta property="og:description" content="Analiza tu contrato con IA y descubre cláusulas potencialmente ilegales. Preview gratuito." />
        <meta property="og:url" content="https://acroxia.com/" />
        
        {/* Schema markup */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(softwareAppSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSection />
          <StatsSection />
          <HowItWorksSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LatestArticlesSection from "@/components/landing/LatestArticlesSection";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";


const Index = () => {
  // Schema Organization - Enriquecido para E-E-A-T con image, address y sameAs
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ACROXIA",
    "legalName": "ACROXIA",
    "url": "https://acroxia.com",
    "logo": "https://acroxia.com/acroxia-logo.png",
    "image": "https://acroxia.com/og-image.jpg",
    "description": "Plataforma de IA para análisis de contratos de alquiler y protección de derechos del inquilino en España. Detecta cláusulas abusivas en menos de 2 minutos.",
    "slogan": "Tu contrato de alquiler, analizado por IA",
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
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Madrid",
      "addressCountry": "ES"
    },
    "sameAs": [
      "https://twitter.com/acroxia",
      "https://linkedin.com/company/acroxia",
      "https://www.instagram.com/acroxia"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "contacto@acroxia.com",
      "availableLanguage": "Spanish"
    }
  };

  // Schema WebSite (sin SearchAction hasta implementar buscador funcional)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ACROXIA",
    "url": "https://acroxia.com",
    "description": "Plataforma de análisis de contratos de alquiler con IA",
    "inLanguage": "es-ES"
  };

  // Schema SoftwareApplication (sin aggregateRating falso)
  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ACROXIA - Analizador de Contratos de Alquiler",
    "applicationCategory": "LegalApplication",
    "operatingSystem": "Web",
    "description": "Analiza tu contrato de alquiler con IA y detecta cláusulas abusivas en menos de 2 minutos",
    "image": "https://acroxia.com/og-image.jpg",
    "offers": {
      "@type": "Offer",
      "price": "39",
      "priceCurrency": "EUR",
      "description": "Informe completo de análisis (preview gratuito disponible)",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "url": "https://acroxia.com/precios"
    }
  };

  // Schema HowTo con speakable
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
        "text": "Arrastra tu PDF, DOCX o imagen del contrato. Aceptamos los formatos más comunes."
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
    ],
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".speakable-summary"]
    }
  };

  return (
    <>
      <Helmet>
        <html lang="es-ES" />
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
        <link rel="alternate" hrefLang="es-ES" href="https://acroxia.com/" />
        <link rel="alternate" hrefLang="x-default" href="https://acroxia.com/" />
        
        {/* Open Graph completo */}
        <meta property="og:title" content="ACROXIA - Tu Contrato de Alquiler, Analizado por IA" />
        <meta property="og:description" content="Analiza tu contrato con IA y descubre cláusulas potencialmente ilegales. Preview gratuito." />
        <meta property="og:url" content="https://acroxia.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:site_name" content="ACROXIA" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@acroxia" />
        <meta name="twitter:title" content="ACROXIA - Analiza tu Contrato de Alquiler con IA" />
        <meta name="twitter:description" content="Detecta cláusulas abusivas en menos de 2 minutos. Preview gratuito." />
        <meta name="twitter:image" content="https://acroxia.com/og-image.jpg" />
        
        {/* Schema markup */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(websiteSchema)}
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
          <LatestArticlesSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

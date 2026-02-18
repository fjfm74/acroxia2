import SEOHead from "@/components/seo/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LatestArticlesSection from "@/components/landing/LatestArticlesSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
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
    "foundingLocation": { "@type": "Place", "name": "España" },
    "areaServed": { "@type": "Country", "name": "España" },
    "knowsLanguage": "es",
    "address": { "@type": "PostalAddress", "addressLocality": "Madrid", "addressCountry": "ES" },
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

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ACROXIA",
    "url": "https://acroxia.com",
    "description": "Plataforma de análisis de contratos de alquiler con IA",
    "inLanguage": "es-ES"
  };

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
      "price": "14.99",
      "priceCurrency": "EUR",
      "description": "Informe completo de análisis (preview gratuito disponible)",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "url": "https://acroxia.com/precios"
    }
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "Cómo analizar tu contrato de alquiler con IA",
    "description": "Guía paso a paso para detectar cláusulas abusivas en tu contrato de alquiler usando inteligencia artificial",
    "totalTime": "PT2M",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Sube tu contrato", "text": "Arrastra tu PDF, DOCX o imagen del contrato. Aceptamos los formatos más comunes." },
      { "@type": "HowToStep", "position": 2, "name": "Análisis IA", "text": "Nuestra inteligencia artificial revisa cada cláusula según la LAU y jurisprudencia vigente." },
      { "@type": "HowToStep", "position": 3, "name": "Recibe tu informe", "text": "Obtén un informe detallado con cláusulas potencialmente problemáticas identificadas y orientaciones claras." }
    ],
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".speakable-summary"]
    }
  };

  return (
    <>
      <SEOHead
        title="ACROXIA - Analiza tu Contrato de Alquiler con IA | Detecta Cláusulas Abusivas"
        description="Sube tu contrato de alquiler y descubre en menos de 2 minutos si contiene cláusulas abusivas. Análisis con IA basado en la LAU 2026. Preview gratuito sin registro."
        canonical="https://acroxia.com/"
        keywords="analizar contrato alquiler, cláusulas abusivas alquiler, derechos inquilino España, LAU 2026, IA legal, contrato arrendamiento"
        jsonLd={[organizationSchema, websiteSchema, softwareAppSchema, howToSchema]}
      />

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

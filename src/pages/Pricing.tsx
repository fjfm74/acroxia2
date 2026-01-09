import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import PricingHero from "@/components/pricing/PricingHero";
import B2CPricing from "@/components/pricing/B2CPricing";
import B2BPricing from "@/components/pricing/B2BPricing";
import MarketplaceTeaser from "@/components/pricing/MarketplaceTeaser";
import PricingFAQ from "@/components/pricing/PricingFAQ";

const Pricing = () => {
  // Schema para ofertas de precio
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ACROXIA - Análisis de Contratos de Alquiler",
    "description": "Servicio de análisis de contratos de alquiler con IA para identificar cláusulas potencialmente problemáticas",
    "brand": {
      "@type": "Brand",
      "name": "ACROXIA"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Plan Gratis",
        "price": "0",
        "priceCurrency": "EUR",
        "description": "1 análisis básico gratuito"
      },
      {
        "@type": "Offer",
        "name": "Análisis Único",
        "price": "39",
        "priceCurrency": "EUR",
        "description": "1 análisis completo con informe detallado"
      },
      {
        "@type": "Offer",
        "name": "Pack Comparador",
        "price": "79",
        "priceCurrency": "EUR",
        "description": "3 análisis completos para comparar contratos"
      },
      {
        "@type": "Offer",
        "name": "Suscripción Mensual",
        "price": "12",
        "priceCurrency": "EUR",
        "description": "Alertas de renovación y cambios legislativos"
      },
      {
        "@type": "Offer",
        "name": "Suscripción Anual",
        "price": "99",
        "priceCurrency": "EUR",
        "description": "Alertas de renovación y cambios legislativos (ahorro 45€)"
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Precios - Análisis de Contratos de Alquiler con IA | ACROXIA</title>
        <meta 
          name="description" 
          content="Planes de análisis de contratos de alquiler desde 0€. Primer análisis gratis. Packs para particulares y soluciones enterprise para inmobiliarias." 
        />
        <meta 
          name="keywords" 
          content="precio analisis contrato alquiler, identificar cláusulas problemáticas precio, revisar contrato alquiler coste" 
        />
        <link rel="canonical" href="https://acroxia.com/precios" />
        
        <meta property="og:title" content="Precios ACROXIA - Análisis de Contratos desde 0€" />
        <meta property="og:description" content="Primer análisis de contrato gratis. Packs desde 9.99€." />
        <meta property="og:url" content="https://acroxia.com/precios" />
        
        <script type="application/ld+json">
          {JSON.stringify(pricingSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <PricingHero />
          <B2CPricing />
          <B2BPricing />
          <MarketplaceTeaser />
          <PricingFAQ />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Pricing;

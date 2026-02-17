import SEOHead from "@/components/seo/SEOHead";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import PricingHero from "@/components/pricing/PricingHero";
import B2CPricing from "@/components/pricing/B2CPricing";
import LandlordPricing from "@/components/pricing/LandlordPricing";
import B2BPricing from "@/components/pricing/B2BPricing";
import MarketplaceTeaser from "@/components/pricing/MarketplaceTeaser";
import PricingFAQ from "@/components/pricing/PricingFAQ";

const Pricing = () => {
  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ACROXIA - Análisis de Contratos de Alquiler",
    "description": "Servicio de análisis de contratos de alquiler con IA para identificar cláusulas potencialmente problemáticas",
    "image": "https://acroxia.com/og-image.jpg",
    "brand": { "@type": "Brand", "name": "ACROXIA" },
    "offers": [
      { "@type": "Offer", "name": "Plan Gratis", "price": "0", "priceCurrency": "EUR", "description": "1 análisis básico gratuito", "priceValidUntil": "2026-12-31", "availability": "https://schema.org/InStock", "url": "https://acroxia.com/precios" },
      { "@type": "Offer", "name": "Análisis Único", "price": "39", "priceCurrency": "EUR", "description": "1 análisis completo con informe detallado", "priceValidUntil": "2026-12-31", "availability": "https://schema.org/InStock", "url": "https://acroxia.com/precios" },
      { "@type": "Offer", "name": "Pack Comparador", "price": "79", "priceCurrency": "EUR", "description": "3 análisis completos para comparar contratos", "priceValidUntil": "2026-12-31", "availability": "https://schema.org/InStock", "url": "https://acroxia.com/precios" },
      { "@type": "Offer", "name": "Propietario Único", "price": "49", "priceCurrency": "EUR", "description": "Análisis + generador de contratos LAU 2026", "priceValidUntil": "2026-12-31", "availability": "https://schema.org/InStock", "url": "https://acroxia.com/propietarios" },
      { "@type": "Offer", "name": "Suscripción Mensual", "price": "12", "priceCurrency": "EUR", "description": "Alertas de renovación y cambios legislativos", "priceValidUntil": "2026-12-31", "availability": "https://schema.org/InStock", "url": "https://acroxia.com/precios" },
      { "@type": "Offer", "name": "Suscripción Anual", "price": "99", "priceCurrency": "EUR", "description": "Alertas de renovación y cambios legislativos (ahorro 45€)", "priceValidUntil": "2026-12-31", "availability": "https://schema.org/InStock", "url": "https://acroxia.com/precios" }
    ]
  };

  return (
    <>
      <SEOHead
        title="Precios ACROXIA 2026 | Análisis de Contratos desde 39€"
        description="Planes transparentes para inquilinos, propietarios y profesionales. Desde preview gratuito hasta análisis ilimitados con API. Todos los precios incluyen IVA."
        canonical="https://acroxia.com/precios"
        keywords="precio analisis contrato alquiler, identificar cláusulas problemáticas precio, revisar contrato alquiler coste"
        jsonLd={pricingSchema}
      />

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <PricingHero />
          <B2CPricing />
          <LandlordPricing />
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

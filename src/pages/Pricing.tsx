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
  const offer = (name: string, price: string, description: string, url = "https://acroxia.com/precios") => ({
    "@type": "Offer",
    name,
    price,
    priceCurrency: "EUR",
    description,
    availability: "https://schema.org/InStock",
    validFrom: "2026-01-01",
    priceValidUntil: "2026-12-31",
    url,
  });

  const pricingSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ACROXIA",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Servicio de análisis de contratos de alquiler con IA para identificar cláusulas potencialmente problemáticas según la LAU 2026.",
    "image": "https://acroxia.com/og-image.jpg",
    "url": "https://acroxia.com",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "149",
      "priceCurrency": "EUR",
      "offerCount": 10,
      "offers": [
        // Inquilinos (B2C)
        offer("Escaneo Rápido", "0", "Preview gratuito: puntuación de riesgo, alertas detectadas y 2 cláusulas parcialmente visibles. Sin registro."),
        offer("Análisis Completo", "14.99", "1 análisis completo con informe detallado de todas las cláusulas."),
        offer("Pack Comparador", "34.99", "3 análisis completos para comparar contratos antes de firmar."),
        offer("Suscripción Mensual", "12", "Análisis ilimitados, alertas de renovación y cambios legislativos."),
        offer("Suscripción Anual", "99", "Análisis ilimitados durante 12 meses. Ahorro de 45€ vs mensual."),
        // Propietarios (B2C)
        offer("Propietario Único", "49", "Análisis de contrato + generador de contratos conformes a la LAU 2026.", "https://acroxia.com/propietarios"),
        offer("Propietario Múltiple", "99", "Hasta 5 propiedades, alertas de renovación y verificador de zona tensionada.", "https://acroxia.com/propietarios"),
        offer("Cartera Premium", "149", "Propiedades ilimitadas, generador de contratos y soporte prioritario.", "https://acroxia.com/propietarios"),
        // Profesionales (B2B)
        offer("Profesional", "99", "10 análisis/mes con informes con marca propia para gestorías e inmobiliarias."),
        offer("Profesional Plus", "149", "Análisis ilimitados, API de integración e informes personalizados."),
      ]
    }
  };

  return (
    <>
      <SEOHead
        title="Precios ACROXIA 2026 | Análisis de Contratos desde 14,99€"
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

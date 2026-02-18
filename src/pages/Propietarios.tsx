import SEOHead from "@/components/seo/SEOHead";
import { Shield } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import PropietariosHero from "@/components/propietarios/PropietariosHero";
import PropietariosPainPoints from "@/components/propietarios/PropietariosPainPoints";
import PropietariosFeatures from "@/components/propietarios/PropietariosFeatures";
import PropietariosPricing from "@/components/propietarios/PropietariosPricing";
import PropietariosFAQ from "@/components/propietarios/PropietariosFAQ";
import PropietariosCTA from "@/components/propietarios/PropietariosCTA";
import FadeIn from "@/components/animations/FadeIn";
import BlogSubscriptionForm from "@/components/blog/BlogSubscriptionForm";

const schemaService = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "ACROXIA para Propietarios",
  "image": "https://acroxia.com/og-image.jpg",
  "provider": {
    "@type": "Organization",
    "name": "ACROXIA",
    "url": "https://acroxia.com",
    "logo": "https://acroxia.com/acroxia-logo.png"
  },
  "serviceType": "Análisis de contratos de alquiler para propietarios",
  "areaServed": {
    "@type": "Country",
    "name": "España"
  },
  "description": "Herramienta de análisis de contratos de alquiler para propietarios. Verifica que tu contrato cumple con la LAU 2026, zonas tensionadas y genera contratos conformes a la ley.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Propietario",
      "price": "29",
      "priceCurrency": "EUR",
      "description": "Análisis + generador de contratos LAU 2026. Pago único por contrato.",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "url": "https://acroxia.com/propietarios"
    },
    {
      "@type": "Offer",
      "name": "Propietario Pro",
      "price": "149",
      "priceCurrency": "EUR",
      "description": "Análisis ilimitados, gestión multi-propiedad y alertas de renovación",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "url": "https://acroxia.com/propietarios",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "149",
        "priceCurrency": "EUR",
        "billingDuration": "P1Y"
      }
    }
  ]
};

const Propietarios = () => {
  const breadcrumbItems = [
    { label: "Para Particulares" },
    { label: "Propietarios" },
  ];

  return (
    <>
      <SEOHead
        title="Herramientas para Propietarios de Alquiler | Contratos LAU 2026 | ACROXIA"
        description="Crea contratos conformes a la LAU 2026, gestiona fianzas, consulta zonas tensionadas y protege tu inversión inmobiliaria con herramientas de IA para propietarios."
        canonical="https://acroxia.com/propietarios"
        keywords="contrato alquiler propietario, análisis contrato arrendador, zonas tensionadas 2026, LAU propietarios, generador contrato alquiler"
        jsonLd={schemaService}
      />

      <Header />

      <Breadcrumbs items={breadcrumbItems} />

      <main>
        <PropietariosHero />
        <PropietariosPainPoints />
        <PropietariosFeatures />
        <PropietariosPricing />
        <PropietariosFAQ />

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
                  ACROXIA es una herramienta de apoyo informativo. Los análisis tienen carácter orientativo y no sustituyen 
                  el asesoramiento legal profesional. El cálculo del IRAV y la verificación de zonas tensionadas debe realizarse 
                  en las fuentes oficiales (INE, MIVAU o webs autonómicas).
                </p>
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Newsletter Propietarios */}
        <section className="bg-background py-16">
          <div className="container mx-auto px-6">
            <FadeIn>
              <div className="max-w-xl mx-auto text-center">
                <h2 className="font-serif text-2xl font-medium text-foreground mb-3">
                  Mantente al día como propietario
                </h2>
                <p className="text-muted-foreground mb-6">
                  Recibe artículos sobre contratos, gestión de alquileres y novedades legales para arrendadores.
                </p>
                <BlogSubscriptionForm selectedAudience="propietario" />
              </div>
            </FadeIn>
          </div>
        </section>

        <PropietariosCTA />
      </main>

      <Footer />
    </>
  );
};

export default Propietarios;

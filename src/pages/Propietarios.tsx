import { Helmet } from "react-helmet-async";
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
  "provider": {
    "@type": "Organization",
    "name": "ACROXIA",
    "url": "https://acroxia.com"
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
      "name": "Propietario Único",
      "price": "49",
      "priceCurrency": "EUR"
    },
    {
      "@type": "Offer",
      "name": "Propietario Múltiple",
      "price": "99",
      "priceCurrency": "EUR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "99",
        "priceCurrency": "EUR",
        "billingDuration": "P1Y"
      }
    },
    {
      "@type": "Offer",
      "name": "Cartera Premium",
      "price": "149",
      "priceCurrency": "EUR",
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
      <Helmet>
        <title>ACROXIA para Propietarios | Contratos de Alquiler Conformes a la LAU 2026</title>
        <meta 
          name="description" 
          content="Analiza tus contratos de alquiler desde la perspectiva del propietario. Verifica zonas tensionadas, genera contratos LAU 2026 y recibe alertas de renovación. Planes desde 49€." 
        />
        <meta 
          name="keywords" 
          content="contrato alquiler propietario, análisis contrato arrendador, zonas tensionadas 2026, LAU propietarios, generador contrato alquiler" 
        />
        <link rel="canonical" href="https://acroxia.com/propietarios" />
        <meta property="og:title" content="ACROXIA para Propietarios | Contratos de Alquiler Conformes" />
        <meta property="og:description" content="Analiza y genera contratos de alquiler conformes a la LAU 2026. Planes desde 49€." />
        <meta property="og:url" content="https://acroxia.com/propietarios" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(schemaService)}
        </script>
      </Helmet>

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

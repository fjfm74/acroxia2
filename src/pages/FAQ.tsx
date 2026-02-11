import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FAQHero from "@/components/faq/FAQHero";
import FAQCategories, { faqCategories } from "@/components/faq/FAQCategories";
import FAQContactCTA from "@/components/faq/FAQContactCTA";

const FAQ = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqCategories.flatMap(cat =>
      cat.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    )
  };

  return (
    <>
      <Helmet>
        <html lang="es-ES" />
        <title>Preguntas Frecuentes sobre Alquiler en España 2026 | ACROXIA</title>
        <meta 
          name="description" 
          content="Resuelve tus dudas sobre alquiler en España: IRAV 2026, penalizaciones por resolución anticipada, gastos de comunidad, derechos del inquilino y cláusulas abusivas. Actualizado enero 2026." 
        />
        <meta 
          name="keywords" 
          content="preguntas alquiler españa 2026, IRAV 2026, subida alquiler, gastos comunidad inquilino, penalización alquiler, derechos inquilino, cláusulas abusivas, fianza alquiler, LAU 2026" 
        />
        <link rel="canonical" href="https://acroxia.com/faq" />
        <link rel="alternate" hrefLang="es-ES" href="https://acroxia.com/faq" />
        <link rel="alternate" hrefLang="x-default" href="https://acroxia.com/faq" />
        <meta property="og:title" content="Preguntas Frecuentes sobre Alquiler en España 2026 | ACROXIA" />
        <meta property="og:description" content="Resuelve tus dudas sobre alquiler: IRAV, derechos del inquilino, cláusulas abusivas y más." />
        <meta property="og:url" content="https://acroxia.com/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://acroxia.com/og-image.jpg" />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <FAQHero />
          <FAQCategories />
          <FAQContactCTA />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default FAQ;

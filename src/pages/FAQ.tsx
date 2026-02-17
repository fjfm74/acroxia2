import SEOHead from "@/components/seo/SEOHead";
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
      <SEOHead
        title="Preguntas Frecuentes sobre Alquiler en España 2026 | ACROXIA"
        description="Resolvemos las 43 dudas más comunes sobre alquiler: fianzas, cláusulas abusivas, IRAV 2026, derechos del inquilino, subidas de renta y más. Respuestas basadas en la LAU."
        canonical="https://acroxia.com/faq"
        keywords="preguntas alquiler españa 2026, IRAV 2026, subida alquiler, gastos comunidad inquilino, penalización alquiler, derechos inquilino, cláusulas abusivas, fianza alquiler, LAU 2026"
        jsonLd={faqSchema}
      />

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

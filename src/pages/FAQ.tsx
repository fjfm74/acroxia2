import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FAQHero from "@/components/faq/FAQHero";
import FAQCategories from "@/components/faq/FAQCategories";
import FAQContactCTA from "@/components/faq/FAQContactCTA";

const FAQ = () => {
  // Schema markup for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuáles son mis derechos básicos como inquilino en España?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Como inquilino en España tienes derecho a: ocupar la vivienda durante el plazo acordado (mínimo 5 años si el arrendador es persona física, 7 si es jurídica), prórrogas obligatorias, a que te devuelvan la fianza en 30 días, a no pagar gastos de gestión inmobiliaria, y a que el casero realice las reparaciones necesarias para mantener la habitabilidad del inmueble."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es una cláusula abusiva en un contrato de alquiler?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Una cláusula abusiva es aquella que va contra la Ley de Arrendamientos Urbanos (LAU) o que genera un desequilibrio importante entre los derechos del inquilino y el arrendador. Estas cláusulas son nulas de pleno derecho, es decir, no tienen ningún efecto legal aunque las hayas firmado."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuánto tiempo tiene el casero para devolverme la fianza?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El propietario tiene 30 días desde la entrega de llaves para devolverte la fianza. Si no lo hace en ese plazo, la fianza empieza a generar intereses legales a tu favor."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuánto puede subir mi alquiler en 2025?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Desde enero de 2025, las subidas de alquiler están limitadas al índice IRAV (Índice de Referencia de Arrendamientos de Vivienda), que sustituye al IPC. El IRAV actualmente ronda el 2-3% anual."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puede el casero echarme antes de que termine el contrato?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Solo en casos muy específicos: impago de rentas, daños graves a la vivienda, actividades molestas o ilícitas, subarriendo no autorizado, o si necesita la vivienda para sí mismo o familiares de primer grado."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Preguntas Frecuentes sobre Alquiler en España | ACROXIA</title>
        <meta 
          name="description" 
          content="Resuelve tus dudas sobre alquiler en España: derechos del inquilino, cláusulas abusivas, fianzas, subidas de renta y más. Respuestas actualizadas a 2025." 
        />
        <meta 
          name="keywords" 
          content="preguntas alquiler españa, derechos inquilino, cláusulas abusivas contrato, fianza alquiler, subida alquiler 2025, LAU" 
        />
        <link rel="canonical" href="https://acroxia.com/faq" />
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

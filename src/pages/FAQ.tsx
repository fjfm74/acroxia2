import { Helmet } from "react-helmet-async";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FAQHero from "@/components/faq/FAQHero";
import FAQCategories from "@/components/faq/FAQCategories";
import FAQContactCTA from "@/components/faq/FAQContactCTA";

const FAQ = () => {
  // Schema markup for FAQPage - optimizado para Google AI Overviews 2026
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuánto puede subir mi alquiler en 2026?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Desde enero de 2026, las subidas de alquiler están limitadas al índice IRAV (Índice de Referencia de Arrendamientos de Vivienda), que ronda el 2-3% anual. Tu casero no puede subir más de este porcentaje en la actualización anual."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es el IRAV y cómo afecta a mi alquiler?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El IRAV es el índice creado por la Ley de Vivienda para limitar las subidas de alquiler, sustituyendo al IPC. Es más estable (2-3%) y solo aplica en la actualización anual de contratos vigentes de vivienda habitual."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la penalización legal por irme antes de tiempo del alquiler?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La LAU permite una penalización máxima de 1 mensualidad por cada año que falte por cumplir, prorrateada por meses. Ejemplo: si te faltan 8 meses, la penalización máxima sería 8/12 = 0,67 mensualidades. Cualquier penalización mayor es abusiva."
        }
      },
      {
        "@type": "Question",
        "name": "¿Tengo que pagar los gastos de comunidad como inquilino?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Solo si está expresamente pactado en el contrato. Si el contrato no dice nada sobre gastos de comunidad, corresponden al propietario. Si hay pacto, debe especificar la cantidad mensual o el porcentaje."
        }
      },
      {
        "@type": "Question",
        "name": "¿Es legal que el inquilino pague el IBI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No en vivienda habitual según la LAU. El IBI es un impuesto sobre la propiedad y corresponde siempre al propietario. Si tu contrato incluye una cláusula que te obliga a pagar el IBI, esa cláusula es nula."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuáles son mis derechos básicos como inquilino en España?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Como inquilino tienes derecho a: ocupar la vivienda durante el plazo acordado (mínimo 5 años si el arrendador es persona física, 7 si es jurídica), prórrogas obligatorias, devolución de fianza en 30 días, y a no pagar gastos de gestión inmobiliaria."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es una cláusula abusiva en un contrato de alquiler?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Una cláusula abusiva es aquella que va contra la LAU o genera un desequilibrio importante entre inquilino y arrendador. Son nulas de pleno derecho: no tienen efecto legal aunque las hayas firmado."
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
        "name": "¿Quién paga las derramas extraordinarias en un alquiler?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Las derramas para mejoras o reparaciones estructurales corresponden al propietario, no al inquilino. Solo podrían repercutirte servicios que disfrutes directamente, y aun así es discutible legalmente."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puede el casero echarme antes de que termine el contrato?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Solo en casos específicos: impago de rentas, daños graves a la vivienda, actividades molestas o ilícitas, subarriendo no autorizado, o si necesita la vivienda para sí mismo o familiares de primer grado."
        }
      }
    ]
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

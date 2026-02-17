import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import FadeIn from "@/components/animations/FadeIn";
import { Badge } from "@/components/ui/badge";

interface GlossaryTerm {
  term: string;
  definition: string;
  legalRef?: string;
  relatedLink?: string;
  relatedLabel?: string;
}

const glossaryTerms: GlossaryTerm[] = [
  {
    term: "Arrendador",
    definition: "Persona física o jurídica propietaria del inmueble que cede su uso y disfrute a cambio de una renta. El arrendador tiene la obligación de mantener la vivienda en condiciones de habitabilidad y realizar las reparaciones necesarias.",
    legalRef: "Art. 2 LAU",
    relatedLink: "/contrato-alquiler-propietarios",
    relatedLabel: "Guía para propietarios",
  },
  {
    term: "Arrendatario",
    definition: "Persona que ocupa un inmueble en régimen de alquiler a cambio del pago de una renta periódica. También conocido como inquilino, tiene derecho a disfrutar de la vivienda durante la vigencia del contrato y a que se respeten las condiciones pactadas.",
    legalRef: "Art. 2 LAU",
    relatedLink: "/analizar-gratis",
    relatedLabel: "Analiza tu contrato",
  },
  {
    term: "Cláusula abusiva",
    definition: "Estipulación contractual que genera un desequilibrio importante entre los derechos y obligaciones de las partes, en perjuicio del consumidor. En contratos de alquiler, son nulas de pleno derecho y el inquilino puede solicitar su anulación judicial.",
    legalRef: "Art. 82 TRLGDCU",
    relatedLink: "/clausulas-abusivas-alquiler",
    relatedLabel: "Guía de cláusulas abusivas",
  },
  {
    term: "Contrato de arrendamiento",
    definition: "Acuerdo por el que el propietario de un inmueble cede temporalmente su uso a otra persona a cambio de una renta. Debe formalizarse por escrito e inscribirse en el Registro de la Propiedad si alguna de las partes lo solicita.",
    legalRef: "Art. 37 LAU",
    relatedLink: "/contrato-alquiler-propietarios",
    relatedLabel: "Cómo redactar un contrato",
  },
  {
    term: "Depósito de fianza",
    definition: "Cantidad equivalente a una o dos mensualidades de renta que el inquilino entrega al propietario al firmar el contrato. El arrendador está obligado a depositar esta fianza en el organismo autonómico correspondiente (INCASOL, IVIMA, etc.).",
    legalRef: "Art. 36.1 LAU",
    relatedLink: "/deposito-fianza-propietarios",
    relatedLabel: "Guía de depósito de fianza",
  },
  {
    term: "Derecho de adquisición preferente",
    definition: "Conjunto de derechos (tanteo y retracto) que otorgan al arrendatario la posibilidad de adquirir la vivienda con prioridad sobre terceros en caso de venta. El arrendador debe notificar al inquilino su intención de vender con al menos 30 días de antelación.",
    legalRef: "Art. 25 LAU",
  },
  {
    term: "Derecho de tanteo",
    definition: "Derecho del inquilino a adquirir la vivienda arrendada por el mismo precio y condiciones que un tercero comprador, antes de que se formalice la venta. El arrendatario dispone de 30 días naturales desde la notificación para ejercer este derecho.",
    legalRef: "Art. 25.1 LAU",
  },
  {
    term: "Derecho de retracto",
    definition: "Derecho del arrendatario a subrogarse en la posición del comprador de la vivienda cuando no se le ha notificado correctamente la venta o las condiciones comunicadas difieren de las reales. Puede ejercerse en los 30 días siguientes a la escritura.",
    legalRef: "Art. 25.3 LAU",
  },
  {
    term: "Desahucio",
    definition: "Procedimiento judicial por el que el propietario solicita la resolución del contrato y la recuperación de la posesión del inmueble. Las causas más habituales son el impago de la renta, la finalización del contrato o la realización de actividades ilícitas.",
    legalRef: "Art. 27 LAU",
    relatedLink: "/impago-alquiler-propietarios",
    relatedLabel: "Gestión de impagos",
  },
  {
    term: "Desahucio express",
    definition: "Procedimiento judicial acelerado para la recuperación de la vivienda en caso de impago de rentas. Permite al propietario obtener la resolución del contrato y el lanzamiento del inquilino en plazos más breves que el procedimiento ordinario.",
    legalRef: "Ley 5/2018",
    relatedLink: "/impago-alquiler-propietarios",
    relatedLabel: "Guía de impagos",
  },
  {
    term: "Desistimiento",
    definition: "Facultad del inquilino de resolver anticipadamente el contrato de alquiler una vez transcurridos al menos 6 meses desde su firma, con un preaviso mínimo de 30 días. El contrato puede establecer una indemnización de una mensualidad por cada año que reste de contrato.",
    legalRef: "Art. 11 LAU",
  },
  {
    term: "Duración mínima del contrato",
    definition: "Periodo mínimo de vigencia del contrato de alquiler de vivienda habitual. Desde la Ley de Vivienda 2023, es de 5 años si el arrendador es persona física y de 7 años si es persona jurídica, independientemente de lo pactado en el contrato.",
    legalRef: "Art. 9.1 LAU",
    relatedLink: "/fin-contrato-alquiler-propietarios",
    relatedLabel: "Fin de contrato",
  },
  {
    term: "Fianza legal",
    definition: "Garantía obligatoria equivalente a una mensualidad de renta para vivienda (dos para uso distinto) que el inquilino debe entregar al arrendador al inicio del contrato. Su devolución debe realizarse en el plazo de un mes desde la entrega de llaves.",
    legalRef: "Art. 36 LAU",
    relatedLink: "/devolucion-fianza-alquiler",
    relatedLabel: "Devolución de fianza",
  },
  {
    term: "Garantía adicional",
    definition: "Garantía complementaria a la fianza legal que el arrendador puede exigir al inquilino, como un aval bancario o un depósito extra. En contratos de vivienda habitual, está limitada a un máximo de dos mensualidades de renta adicionales.",
    legalRef: "Art. 36.5 LAU",
    relatedLink: "/deposito-fianza-propietarios",
    relatedLabel: "Depósito y garantías",
  },
  {
    term: "IBI",
    definition: "Impuesto sobre Bienes Inmuebles. Tributo municipal que grava la propiedad de inmuebles. Corresponde legalmente al propietario, aunque en algunos contratos se pacta su repercusión al inquilino. Una cláusula que obligue al inquilino a pagarlo sin negociación puede considerarse abusiva.",
    relatedLink: "/clausulas-abusivas-alquiler",
    relatedLabel: "Cláusulas abusivas",
  },
  {
    term: "INCASOL",
    definition: "Institut Català del Sòl. Organismo público de la Generalitat de Catalunya donde los arrendadores deben depositar obligatoriamente las fianzas de los contratos de alquiler de inmuebles ubicados en Cataluña. Gestiona el registro y devolución de fianzas.",
    legalRef: "Ley 13/1996 Catalunya",
    relatedLink: "/deposito-fianza-propietarios",
    relatedLabel: "Depósito de fianza",
  },
  {
    term: "IRAV",
    definition: "Índice de Referencia de Arrendamientos de Vivienda. Índice oficial publicado por el INE que sustituye al IPC como referencia para la actualización anual de las rentas de alquiler desde 2026. Se calcula con una metodología específica que refleja la evolución del mercado del alquiler.",
    legalRef: "Disposición final 6ª Ley de Vivienda",
    relatedLink: "/subida-alquiler-2026",
    relatedLabel: "Subida alquiler 2026",
  },
  {
    term: "IVIMA",
    definition: "Instituto de la Vivienda de Madrid. Organismo autonómico de la Comunidad de Madrid encargado de gestionar el depósito obligatorio de fianzas de alquiler. Los propietarios de inmuebles en Madrid deben depositar las fianzas en este organismo.",
    relatedLink: "/deposito-fianza-propietarios",
    relatedLabel: "Depósito de fianza",
  },
  {
    term: "LAU",
    definition: "Ley de Arrendamientos Urbanos (Ley 29/1994). Marco normativo principal que regula los contratos de alquiler de vivienda y de uso distinto de vivienda en España. Ha sido modificada por el Real Decreto-ley 7/2019 y por la Ley de Vivienda 12/2023.",
    legalRef: "Ley 29/1994",
  },
  {
    term: "Moratoria hipotecaria",
    definition: "Medida excepcional que permite aplazar temporalmente el pago de cuotas hipotecarias en situaciones de vulnerabilidad económica. Aunque afecta principalmente a propietarios, puede repercutir en los inquilinos si el arrendador solicita la moratoria por impago del alquiler.",
  },
  {
    term: "Penalización por desistimiento",
    definition: "Indemnización que el inquilino puede estar obligado a pagar al propietario si abandona la vivienda antes de finalizar el contrato. La LAU permite pactar una penalización equivalente a una mensualidad de renta por cada año del contrato que reste por cumplir.",
    legalRef: "Art. 11 LAU",
  },
  {
    term: "Prórroga obligatoria",
    definition: "Derecho del inquilino a que el contrato se prorrogue anualmente hasta completar los 5 años (persona física) o 7 años (persona jurídica) de duración mínima, salvo que comunique su voluntad de no renovar con 30 días de antelación.",
    legalRef: "Art. 9 LAU",
    relatedLink: "/fin-contrato-alquiler-propietarios",
    relatedLabel: "Prórrogas y fin de contrato",
  },
  {
    term: "Prórroga tácita",
    definition: "Renovación automática del contrato por periodos anuales hasta un máximo de 3 años adicionales, que se produce cuando ni arrendador ni arrendatario comunican su voluntad de no renovar con al menos 4 meses (arrendador) o 2 meses (arrendatario) de antelación.",
    legalRef: "Art. 10 LAU",
    relatedLink: "/fin-contrato-alquiler-propietarios",
    relatedLabel: "Fin de contrato",
  },
  {
    term: "Renta",
    definition: "Cantidad que el arrendatario debe pagar periódicamente al arrendador como contraprestación por el uso de la vivienda. Su actualización anual se rige por el IRAV desde 2026. En zonas tensionadas, la renta inicial puede estar limitada por la normativa vigente.",
    legalRef: "Art. 17 LAU",
    relatedLink: "/subida-alquiler-2026",
    relatedLabel: "Límites a la subida",
  },
  {
    term: "SERPAVI",
    definition: "Sistema Estatal de Referencia de Precios de Alquiler de Vivienda. Herramienta oficial del Ministerio de Vivienda que establece el índice de precios de referencia para cada zona. Es obligatorio consultarlo en zonas tensionadas para fijar el precio máximo de alquiler.",
    legalRef: "Art. 17.7 LAU",
    relatedLink: "/zonas-tensionadas-propietarios",
    relatedLabel: "Zonas tensionadas",
  },
  {
    term: "Subarriendo",
    definition: "Cesión parcial del uso de la vivienda arrendada por parte del inquilino a un tercero. Requiere el consentimiento previo y por escrito del arrendador. El subarriendo total está prohibido en vivienda habitual y puede dar lugar a la resolución del contrato.",
    legalRef: "Art. 8 LAU",
  },
  {
    term: "Subrogación",
    definition: "Sustitución del inquilino titular del contrato por otra persona que asume sus derechos y obligaciones. Puede producirse por fallecimiento del arrendatario (mortis causa) o por divorcio/separación, conforme a las reglas establecidas en la LAU.",
    legalRef: "Arts. 12, 15 y 16 LAU",
  },
  {
    term: "Tanteo",
    definition: "Derecho preferente del inquilino a comprar la vivienda arrendada cuando el propietario decide venderla, igualando el precio y condiciones ofrecidas por un tercero. Debe ejercerse en un plazo de 30 días naturales desde la notificación fehaciente del arrendador.",
    legalRef: "Art. 25.1 LAU",
  },
  {
    term: "Zona tensionada",
    definition: "Área geográfica declarada oficialmente como zona de mercado residencial tensionado por la comunidad autónoma correspondiente. En estas zonas se aplican límites a la renta de nuevos contratos y la obligación de consultar el SERPAVI para fijar el precio máximo.",
    legalRef: "Art. 18 Ley 12/2023",
    relatedLink: "/zonas-tensionadas-propietarios",
    relatedLabel: "Guía zonas tensionadas",
  },
  {
    term: "Zona de mercado residencial tensionado",
    definition: "Denominación oficial completa de lo que coloquialmente se conoce como 'zona tensionada'. Se declara cuando la carga del alquiler supera el 30% de la renta media de los hogares o cuando el precio ha subido más de 3 puntos por encima del IPC en los últimos 5 años.",
    legalRef: "Art. 18.3 Ley 12/2023",
    relatedLink: "/zonas-tensionadas-propietarios",
    relatedLabel: "Zonas tensionadas",
  },
];

const Glosario = () => {
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const groupedTerms = useMemo(() => {
    const groups: Record<string, GlossaryTerm[]> = {};
    glossaryTerms
      .sort((a, b) => a.term.localeCompare(b.term, "es"))
      .forEach((t) => {
        const letter = t.term[0].toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(t);
      });
    return groups;
  }, []);

  const availableLetters = Object.keys(groupedTerms).sort((a, b) => a.localeCompare(b, "es"));

  const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "name": "Glosario Legal de Alquiler en España 2026",
    "description": "Definiciones claras de más de 30 términos legales del alquiler en España, actualizados a la normativa vigente en 2026.",
    "url": "https://acroxia.com/glosario",
    "hasDefinedTerm": glossaryTerms.map((t) => ({
      "@type": "DefinedTerm",
      "name": t.term,
      "description": t.definition,
      "inDefinedTermSet": "https://acroxia.com/glosario",
    })),
  };

  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Glosario legal" },
  ];

  return (
    <>
      <SEOHead
        title="Glosario Legal de Alquiler en España 2026 | ACROXIA"
        description="Definiciones claras de 30+ términos legales del alquiler: LAU, IRAV, SERPAVI, fianza, cláusula abusiva, zona tensionada y más. Actualizado a la normativa 2026."
        canonical="https://acroxia.com/glosario"
        jsonLd={jsonLd}
        keywords="glosario alquiler, términos legales alquiler, LAU, IRAV, SERPAVI, fianza, cláusula abusiva, zona tensionada, arrendador, arrendatario"
      />
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-28 pb-20">
          <div className="container mx-auto px-6">
            <FadeIn>
              <Breadcrumbs items={breadcrumbItems} />
            </FadeIn>

            {/* Hero */}
            <FadeIn delay={0.1}>
              <div className="max-w-3xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 mb-6">
                  <BookOpen className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm text-foreground/70 font-medium">
                    {glossaryTerms.length} términos definidos
                  </span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
                  Glosario Legal de Alquiler en España
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Todos los términos legales que necesitas conocer sobre el alquiler de vivienda, explicados de forma clara y con referencia a la normativa vigente en 2026.
                </p>
              </div>
            </FadeIn>

            {/* A-Z Navigation */}
            <FadeIn delay={0.2}>
              <nav className="sticky top-20 z-30 bg-background/95 backdrop-blur-sm py-4 mb-12 border-b border-border" aria-label="Navegación alfabética">
                <div className="flex flex-wrap justify-center gap-1.5">
                  {alphabet.map((letter) => {
                    const isAvailable = availableLetters.includes(letter);
                    return (
                      <a
                        key={letter}
                        href={isAvailable ? `#letra-${letter}` : undefined}
                        onClick={() => isAvailable && setActiveLetter(letter)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isAvailable
                            ? activeLetter === letter
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground hover:bg-foreground/10"
                            : "text-muted-foreground/30 cursor-default"
                        }`}
                        aria-disabled={!isAvailable}
                      >
                        {letter}
                      </a>
                    );
                  })}
                </div>
              </nav>
            </FadeIn>

            {/* Terms */}
            <div className="max-w-3xl mx-auto">
              {availableLetters.map((letter, letterIdx) => (
                <FadeIn key={letter} delay={0.1 + letterIdx * 0.03}>
                  <section id={`letra-${letter}`} className="mb-12 scroll-mt-36">
                    <h2 className="font-serif text-3xl font-medium text-foreground mb-6 border-b border-border pb-3">
                      {letter}
                    </h2>
                    <div className="space-y-6">
                      {groupedTerms[letter].map((item) => (
                        <article
                          key={item.term}
                          id={item.term.toLowerCase().replace(/\s+/g, "-").replace(/[áà]/g, "a").replace(/[éè]/g, "e").replace(/[íì]/g, "i").replace(/[óò]/g, "o").replace(/[úù]/g, "u")}
                          className="bg-muted/50 rounded-2xl p-6 scroll-mt-36"
                        >
                          <div className="flex flex-wrap items-start gap-3 mb-3">
                            <h3 className="font-serif text-xl font-semibold text-foreground">
                              {item.term}
                            </h3>
                            {item.legalRef && (
                              <Badge variant="secondary" className="text-xs font-mono bg-muted text-muted-foreground">
                                {item.legalRef}
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground leading-relaxed mb-3">
                            {item.definition}
                          </p>
                          {item.relatedLink && (
                            <Link
                              to={item.relatedLink}
                              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                            >
                              {item.relatedLabel}
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                </FadeIn>
              ))}
            </div>

            {/* CTA */}
            <FadeIn delay={0.3}>
              <div className="max-w-2xl mx-auto text-center mt-20 bg-muted rounded-2xl p-10">
                <h2 className="font-serif text-2xl font-medium text-foreground mb-4">
                  ¿Tienes dudas sobre tu contrato de alquiler?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Analiza tu contrato con inteligencia artificial y descubre si contiene cláusulas abusivas en menos de 2 minutos.
                </p>
                <Link
                  to="/analizar-gratis"
                  className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-3 text-sm font-medium transition-colors"
                >
                  Analizar mi contrato gratis
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Glosario;

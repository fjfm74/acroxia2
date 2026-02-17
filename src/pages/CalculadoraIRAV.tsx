import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Calculator, Info, AlertTriangle, HelpCircle, Calendar } from "lucide-react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import SEOHead from "@/components/seo/SEOHead";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import FadeIn from "@/components/animations/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Fecha de corte: contratos firmados antes de esta fecha pueden usar IPC, 
// después usan IRAV obligatoriamente
const IRAV_CUTOFF_DATE = new Date("2025-01-01");

type ZonaTensionada = "si" | "no" | "no-se";

interface CalculatorResult {
  indexApplied: "IRAV" | "IPC" | "indeterminado";
  explanation: string;
  legalRef: string;
  zoneLimits?: string;
  formula: string;
  officialLink: string;
  officialLinkLabel: string;
}

function getResult(
  contractDate: Date | undefined,
  revisionDate: Date | undefined,
  zonaTensionada: ZonaTensionada
): CalculatorResult | null {
  if (!contractDate || !revisionDate) return null;

  const isPostCutoff = contractDate >= IRAV_CUTOFF_DATE;
  const revisionAfter2026 = revisionDate >= new Date("2026-01-01");

  if (revisionAfter2026) {
    // Desde 2026, todos los contratos usan IRAV
    const base: CalculatorResult = {
      indexApplied: "IRAV",
      explanation:
        "Desde enero de 2026, la actualización de la renta se rige por el IRAV (Índice de Referencia de Arrendamientos de Vivienda) publicado por el INE, que sustituye al IPC como referencia para todos los contratos de vivienda habitual.",
      legalRef: "Disposición final 6ª de la Ley 12/2023 de Vivienda",
      formula: "Nueva renta = Renta actual × (1 + IRAV / 100)",
      officialLink: "https://www.ine.es/buscar/searchResults.do?searchString=%C3%8Dndice+de+Precios+de+Vivienda+en+Alquiler&Menu_botonBuscador=&searchType=DEF_SEARCH&startat=0&L=0",
      officialLinkLabel: "Consultar IRAV actual en el INE",
    };

    if (zonaTensionada === "si") {
      base.zoneLimits =
        "En zonas tensionadas, además del IRAV, la renta de nuevos contratos no puede superar la renta del contrato anterior ni el índice de referencia del SERPAVI. Esta limitación se aplica tanto a personas físicas como jurídicas (Art. 17.6 y 17.7 LAU).";
    }

    return base;
  }

  // Revisión antes de 2026
  if (isPostCutoff) {
    return {
      indexApplied: "IPC",
      explanation:
        "Para revisiones anteriores a 2026 en contratos firmados desde 2025, se aplica el límite temporal del 3% de subida máxima (o el IPC si es inferior). Este tope estuvo vigente como medida antiinflación.",
      legalRef: "Real Decreto-ley 6/2022 (prorrogado)",
      formula: "Nueva renta = Renta actual × (1 + min(IPC, 3%) / 100)",
      officialLink: "https://www.ine.es/varipc/",
      officialLinkLabel: "Consultar IPC actual en el INE",
    };
  }

  return {
    indexApplied: "IPC",
    explanation:
      "Para contratos anteriores a 2025 con revisión antes de 2026, se aplicaba el IPC o el tope del 3% según la normativa temporal antiinflación. Para futuras revisiones a partir de 2026, se aplicará el IRAV.",
    legalRef: "Art. 18 LAU y Real Decreto-ley 6/2022",
    formula: "Nueva renta = Renta actual × (1 + IPC aplicable / 100)",
    officialLink: "https://www.ine.es/varipc/",
    officialLinkLabel: "Consultar IPC actual en el INE",
  };
}

const CalculadoraIRAV = () => {
  const [renta, setRenta] = useState<string>("");
  const [contractDate, setContractDate] = useState<Date>();
  const [revisionDate, setRevisionDate] = useState<Date>();
  const [zonaTensionada, setZonaTensionada] = useState<ZonaTensionada>("no");
  const [showResult, setShowResult] = useState(false);

  const result = useMemo(() => {
    if (!showResult) return null;
    return getResult(contractDate, revisionDate, zonaTensionada);
  }, [showResult, contractDate, revisionDate, zonaTensionada]);

  const handleCalculate = () => {
    setShowResult(true);
  };

  const canCalculate = renta && contractDate && revisionDate;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Calculadora IRAV 2026 - Revisión de Alquiler",
      "description": "Herramienta orientativa para saber qué índice se aplica a la actualización de tu alquiler en 2026: IRAV o IPC.",
      "url": "https://acroxia.com/calculadora-irav",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR",
      },
      "provider": {
        "@type": "Organization",
        "name": "ACROXIA",
        "url": "https://acroxia.com",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Qué es el IRAV y cuándo se aplica?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "El IRAV (Índice de Referencia de Arrendamientos de Vivienda) es el nuevo índice oficial publicado por el INE que sustituye al IPC para la actualización de las rentas de alquiler de vivienda habitual desde enero de 2026.",
          },
        },
        {
          "@type": "Question",
          "name": "¿Puedo calcular exactamente cuánto subirá mi alquiler?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Esta herramienta te indica qué índice se aplica a tu caso. Para conocer el porcentaje exacto, debes consultar el valor actualizado del IRAV en la web del INE (ine.es).",
          },
        },
      ],
    },
  ];

  const breadcrumbItems = [
    { label: "Inicio", href: "/" },
    { label: "Subida alquiler 2026", href: "/subida-alquiler-2026" },
    { label: "Calculadora IRAV" },
  ];

  return (
    <>
      <SEOHead
        title="Calculadora IRAV 2026: ¿Cuánto Puede Subir tu Alquiler? | ACROXIA"
        description="Descubre qué índice se aplica a la revisión de tu alquiler en 2026: IRAV o IPC. Herramienta orientativa gratuita con enlaces a fuentes oficiales del INE y SERPAVI."
        canonical="https://acroxia.com/calculadora-irav"
        jsonLd={jsonLd}
        keywords="calculadora IRAV, subida alquiler 2026, revisión renta alquiler, IRAV INE, índice referencia arrendamientos vivienda, actualización alquiler"
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
                  <Calculator className="w-4 h-4 text-foreground/60" />
                  <span className="text-sm text-foreground/70 font-medium">
                    Herramienta gratuita
                  </span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-foreground mb-6">
                  ¿Cuánto puede subir tu alquiler en 2026?
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Introduce los datos de tu contrato y te indicamos qué índice se aplica a tu revisión de renta, con enlaces a las fuentes oficiales para consultar el valor exacto.
                </p>
              </div>
            </FadeIn>

            <div className="max-w-2xl mx-auto">
              {/* Calculator Form */}
              <FadeIn delay={0.2}>
                <div className="bg-muted/50 rounded-2xl p-6 md:p-8 mb-8">
                  <div className="space-y-6">
                    {/* Renta */}
                    <div>
                      <Label htmlFor="renta" className="text-sm font-medium text-foreground mb-2 block">
                        Renta mensual actual (€)
                      </Label>
                      <Input
                        id="renta"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej: 850"
                        value={renta}
                        onChange={(e) => {
                          setRenta(e.target.value);
                          setShowResult(false);
                        }}
                        className="max-w-xs bg-background"
                      />
                    </div>

                    {/* Fecha contrato */}
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">
                        Fecha de firma del contrato
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full max-w-xs justify-start text-left font-normal bg-background",
                              !contractDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {contractDate
                              ? format(contractDate, "d 'de' MMMM 'de' yyyy", { locale: es })
                              : "Selecciona una fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={contractDate}
                            onSelect={(d) => {
                              setContractDate(d);
                              setShowResult(false);
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Fecha revisión */}
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-2 block">
                        Fecha de la próxima revisión de renta
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full max-w-xs justify-start text-left font-normal bg-background",
                              !revisionDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {revisionDate
                              ? format(revisionDate, "d 'de' MMMM 'de' yyyy", { locale: es })
                              : "Selecciona una fecha"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={revisionDate}
                            onSelect={(d) => {
                              setRevisionDate(d);
                              setShowResult(false);
                            }}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Zona tensionada */}
                    <div>
                      <Label className="text-sm font-medium text-foreground mb-3 block">
                        ¿Tu vivienda está en una zona tensionada?
                      </Label>
                      <RadioGroup
                        value={zonaTensionada}
                        onValueChange={(v) => {
                          setZonaTensionada(v as ZonaTensionada);
                          setShowResult(false);
                        }}
                        className="flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="si" id="zona-si" />
                          <Label htmlFor="zona-si" className="font-normal cursor-pointer">Sí</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no" id="zona-no" />
                          <Label htmlFor="zona-no" className="font-normal cursor-pointer">No</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="no-se" id="zona-nose" />
                          <Label htmlFor="zona-nose" className="font-normal cursor-pointer">No lo sé</Label>
                        </div>
                      </RadioGroup>

                      {zonaTensionada === "no-se" && (
                        <div className="mt-3 p-3 bg-background rounded-xl border border-border flex items-start gap-3">
                          <HelpCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Puedes consultar si tu vivienda está en zona tensionada en el{" "}
                              <a
                                href="https://serpavi.mivau.gob.es/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                              >
                                SERPAVI (Ministerio de Vivienda)
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <Button
                      onClick={handleCalculate}
                      disabled={!canCalculate}
                      className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8"
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Consultar qué índice aplica
                    </Button>
                  </div>
                </div>
              </FadeIn>

              {/* Result */}
              {result && (
                <FadeIn>
                  <div className="bg-muted rounded-2xl p-6 md:p-8 mb-8 border border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
                        <Info className="w-6 h-6 text-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Índice aplicable</p>
                        <p className="font-serif text-2xl font-semibold text-foreground">
                          {result.indexApplied}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Explanation */}
                      <div>
                        <h3 className="text-sm font-medium text-foreground mb-2">
                          ¿Por qué se aplica este índice?
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {result.explanation}
                        </p>
                      </div>

                      {/* Formula */}
                      <div className="bg-background rounded-xl p-4">
                        <p className="text-xs text-muted-foreground mb-1">Fórmula de cálculo</p>
                        <p className="font-mono text-sm text-foreground">{result.formula}</p>
                        {renta && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Con tu renta de {Number(renta).toLocaleString("es-ES")} €, consulta el valor actual del {result.indexApplied} para calcular la nueva renta.
                          </p>
                        )}
                      </div>

                      {/* Zone limits */}
                      {result.zoneLimits && (
                        <div className="flex items-start gap-3 bg-background rounded-xl p-4 border border-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">
                              Límites adicionales en zona tensionada
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {result.zoneLimits}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Legal ref */}
                      <div>
                        <Badge variant="secondary" className="text-xs font-mono bg-muted text-muted-foreground">
                          {result.legalRef}
                        </Badge>
                      </div>

                      {/* Official link */}
                      <a
                        href={result.officialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                      >
                        {result.officialLinkLabel}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {zonaTensionada !== "no" && (
                        <div>
                          <a
                            href="https://serpavi.mivau.gob.es/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
                          >
                            Consultar precios de referencia en SERPAVI
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Legal disclaimer */}
              <FadeIn delay={0.3}>
                <div className="bg-muted/30 border border-border rounded-xl p-4 mb-12 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Nota legal:</strong> Esta herramienta es orientativa y no constituye asesoramiento legal.
                    Los valores oficiales del IRAV y del IPC deben consultarse directamente en la web del{" "}
                    <a href="https://www.ine.es" target="_blank" rel="noopener noreferrer" className="underline">INE</a>.
                    Consulte con un profesional para su caso concreto.
                  </p>
                </div>
              </FadeIn>

              {/* CTA */}
              <FadeIn delay={0.4}>
                <div className="text-center bg-muted rounded-2xl p-10">
                  <h2 className="font-serif text-2xl font-medium text-foreground mb-4">
                    ¿Quieres verificar si tu contrato cumple los límites?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Analiza tu contrato de alquiler con inteligencia artificial y descubre si contiene cláusulas abusivas o incumplimientos normativos.
                  </p>
                  <Link
                    to="/analizar-gratis"
                    className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6 py-3 text-sm font-medium transition-colors"
                  >
                    Analizar mi contrato con IA
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </FadeIn>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CalculadoraIRAV;

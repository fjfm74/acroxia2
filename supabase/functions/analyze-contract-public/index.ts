import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SupportedLanguage = "es" | "ca" | "mixed_es_ca" | "unsupported";
type LanguageDetectionResult = {
  detectedLanguage: SupportedLanguage;
  supported: boolean;
  esScore: number;
  caScore: number;
};

const ES_LANGUAGE_PATTERNS: RegExp[] = [
  /\barrendador(?:a)?\b/gi,
  /\barrendatari[oa]\b/gi,
  /\balquiler\b/gi,
  /\bvivienda\b/gi,
  /\bfianza\b/gi,
  /\bcl[áa]usula\b/gi,
  /\bpr[óo]rroga\b/gi,
  /\bdesistimiento\b/gi,
  /\bcertificado de eficiencia energ[ée]tica\b/gi,
  /\bc[ée]dula de habitabilidad\b/gi,
  /\brenta\b/gi,
  /\bgastos\b/gi,
];

const CA_LANGUAGE_PATTERNS: RegExp[] = [
  /\barrendament\b/gi,
  /\barrendatari[ae]\b/gi,
  /\blloguer\b/gi,
  /\bhabitatge\b/gi,
  /\bfian[cç]a\b/gi,
  /\bcl[àa]usula\b/gi,
  /\bpr[òo]rroga\b/gi,
  /\bdesistiment\b/gi,
  /\bcertificat d['’]efici[èe]ncia energ[èe]tica\b/gi,
  /\bc[èe]dula d['’]habitabilitat\b/gi,
  /\brenda\b/gi,
  /\bdespeses\b/gi,
];

function countLanguageMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((acc, pattern) => acc + (text.match(pattern)?.length || 0), 0);
}

function detectSupportedLanguage(text: string): LanguageDetectionResult {
  const sample = text.toLowerCase().slice(0, 50000);
  const esScore = countLanguageMatches(sample, ES_LANGUAGE_PATTERNS);
  const caScore = countLanguageMatches(sample, CA_LANGUAGE_PATTERNS);
  const total = esScore + caScore;
  if (total < 3) return { detectedLanguage: "unsupported", supported: false, esScore, caScore };
  if (esScore >= 3 && esScore >= caScore * 1.6) return { detectedLanguage: "es", supported: true, esScore, caScore };
  if (caScore >= 3 && caScore >= esScore * 1.6) return { detectedLanguage: "ca", supported: true, esScore, caScore };
  if (esScore >= 2 && caScore >= 2) return { detectedLanguage: "mixed_es_ca", supported: true, esScore, caScore };
  if (esScore >= 3) return { detectedLanguage: "es", supported: true, esScore, caScore };
  if (caScore >= 3) return { detectedLanguage: "ca", supported: true, esScore, caScore };
  return { detectedLanguage: "unsupported", supported: false, esScore, caScore };
}

function getFileType(filePath: string, mimeType?: string): "pdf" | "docx" | "image" {
  if (mimeType?.includes("pdf") || filePath.toLowerCase().endsWith(".pdf")) return "pdf";
  if (
    mimeType?.includes("wordprocessingml") ||
    filePath.toLowerCase().endsWith(".docx") ||
    filePath.toLowerCase().endsWith(".doc")
  )
    return "docx";
  return "image";
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawText = decoder.decode(uint8Array);
  const textSegments = rawText.match(/[\x20-\x7E\xC0-\xFF\n\r\t]+/g) || [];
  return textSegments
    .filter((s) => s.length > 10)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);
  const result = await mammoth.extractRawText({ buffer: uint8 });
  return result.value;
}

async function extractImageText(buffer: ArrayBuffer, mimeType: string, apiKey: string): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
  const base64 = btoa(binary);
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe TODO el texto visible en esta imagen de un contrato de alquiler español. Extrae el texto completo manteniendo la estructura del documento. Devuelve SOLO el texto transcrito sin comentarios adicionales.",
            },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error("Error al procesar la imagen con OCR");
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractPdfTextWithVision(buffer: ArrayBuffer, apiKey: string): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
  const base64 = btoa(binary);
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe TODO el texto legible de este PDF de alquiler en España. Mantén estructura por secciones cuando sea posible. Devuelve SOLO texto plano transcrito, sin comentarios.",
            },
            { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } },
          ],
        },
      ],
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error OCR PDF (vision): ${response.status} ${errorText.slice(0, 200)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function looksLikeLowQualityPdfExtraction(text: string): boolean {
  if (!text || text.length < 1200) return true;
  const lower = text.toLowerCase();
  const legalSignals = ["arrend", "claus", "renta", "fianza", "vivienda", "arrendador", "arrendatario"];
  const hits = legalSignals.filter((s) => lower.includes(s)).length;
  if (hits < 2) return true;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return wordCount < 200;
}

function splitContractCoreAndAnnexes(text: string): { coreText: string; annexText: string; splitApplied: boolean } {
  const markers = [
    /\banexo(?:s)?\b/i,
    /\bannex(?:os)?\b/i,
    /c[ée]dula\s+de\s+habitabilidad/i,
    /c[èe]dula\s+d['’]habitabilitat/i,
    /licencia\s+de\s+(?:primera|segunda)\s+ocupaci[oó]n/i,
    /llic[eè]ncia\s+de\s+(?:primera|segona)\s+ocupaci[oó]/i,
    /certificado\s+de\s+eficiencia\s+energ[ée]tica/i,
    /certificat\s+d['’]efici[èe]ncia\s+energ[èe]tica/i,
    /etiqueta\s+energ[ée]tica/i,
    /etiqueta\s+energ[èe]tica/i,
  ];
  let splitIndex = -1;
  for (const marker of markers) {
    const match = marker.exec(text);
    if (match && match.index >= 0 && (splitIndex === -1 || match.index < splitIndex)) splitIndex = match.index;
  }
  if (splitIndex > 5000)
    return { coreText: text.slice(0, splitIndex).trim(), annexText: text.slice(splitIndex).trim(), splitApplied: true };
  return { coreText: text, annexText: "", splitApplied: false };
}

// ============================================================================
// RAG: detección territorial + búsqueda de chunks legales
// ============================================================================

function extractMunicipality(text: string): string | null {
  const patterns = [
    /(?:situada?\s+en|domicilio\s+en|ubicad[ao]\s+en|localidad\s+de|municipio\s+de|población\s+de|ciudad\s+de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|d['’]|la|el|les|l['’]|dels?)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    /(?:situad[ao]?\s+a|domicili\s+a|ubicad[ao]?\s+a|localitat\s+de|municipi\s+de|poblaci[oó]\s+de|ciutat\s+de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|d['’]|la|el|les|l['’]|dels?)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    /C\.?P\.?\s*\d{5}\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    /\ben\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)\s*[,(]\s*(?:provincia\s+(?:de\s+)?)?[A-ZÀ-Ú]/gi,
    /finca\s+sita\s+en\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    /finca\s+situada?\s+a\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
  ];
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        const municipality = match[1]
          .trim()
          .split(/\s+/)
          .map((word) => {
            if (/^(de|del|la|el|les|l['’]|d['’]|dels?)$/i.test(word)) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(" ");
        const excluded = [
          "calle",
          "avenida",
          "plaza",
          "paseo",
          "carrer",
          "avinguda",
          "plaça",
          "número",
          "piso",
          "puerta",
          "escalera",
          "portal",
          "bloque",
        ];
        if (!excluded.some((ex) => municipality.toLowerCase().startsWith(ex))) return municipality;
      }
    }
  }
  return null;
}

function extractProvince(text: string): string | null {
  const provinces = [
    "Álava",
    "Albacete",
    "Alicante",
    "Almería",
    "Asturias",
    "Ávila",
    "Badajoz",
    "Barcelona",
    "Burgos",
    "Cáceres",
    "Cádiz",
    "Cantabria",
    "Castellón",
    "Ciudad Real",
    "Córdoba",
    "Cuenca",
    "Girona",
    "Granada",
    "Guadalajara",
    "Guipúzcoa",
    "Huelva",
    "Huesca",
    "Illes Balears",
    "Jaén",
    "La Coruña",
    "La Rioja",
    "Las Palmas",
    "León",
    "Lleida",
    "Lugo",
    "Madrid",
    "Málaga",
    "Murcia",
    "Navarra",
    "Ourense",
    "Palencia",
    "Pontevedra",
    "Salamanca",
    "Santa Cruz de Tenerife",
    "Segovia",
    "Sevilla",
    "Soria",
    "Tarragona",
    "Teruel",
    "Toledo",
    "Valencia",
    "Valladolid",
    "Vizcaya",
    "Zamora",
    "Zaragoza",
  ];
  for (const province of provinces) {
    const patterns = [
      new RegExp(`provincia\\s+de\\s+${province}`, "i"),
      new RegExp(`\\(${province}\\)`, "i"),
      new RegExp(`,\\s*${province}\\s*[,\\)]`, "i"),
      new RegExp(`\\b${province}\\b`, "i"),
    ];
    if (patterns.some((p) => p.test(text))) return province;
  }
  return null;
}

function detectTerritory(text: string): string | null {
  const territories: Record<string, string[]> = {
    Cataluña: ["barcelona", "girona", "lleida", "tarragona", "catalunya", "cataluña", "catalan"],
    Madrid: ["madrid"],
    Andalucía: [
      "sevilla",
      "málaga",
      "malaga",
      "granada",
      "córdoba",
      "cordoba",
      "cádiz",
      "cadiz",
      "almería",
      "almeria",
      "huelva",
      "jaén",
      "jaen",
    ],
    "Comunidad Valenciana": ["valencia", "alicante", "castellón", "castellon"],
    "País Vasco": ["bilbao", "san sebastián", "san sebastian", "vitoria", "euskadi", "vizcaya", "guipúzcoa"],
    Galicia: ["a coruña", "coruña", "vigo", "santiago", "lugo", "ourense", "pontevedra"],
    Canarias: ["tenerife", "gran canaria", "las palmas", "santa cruz"],
    Baleares: ["mallorca", "ibiza", "menorca", "palma"],
    Aragón: ["zaragoza", "huesca", "teruel"],
    "Castilla y León": ["valladolid", "burgos", "salamanca", "león", "leon"],
    "Castilla-La Mancha": ["toledo", "ciudad real", "albacete", "guadalajara", "cuenca"],
    Murcia: ["murcia", "cartagena"],
    Asturias: ["oviedo", "gijón", "gijon", "asturias"],
    Navarra: ["pamplona", "navarra"],
    Cantabria: ["santander", "cantabria"],
    Extremadura: ["badajoz", "cáceres", "caceres"],
    "La Rioja": ["logroño", "rioja"],
  };
  const lowerText = text.toLowerCase();
  for (const [territory, keywords] of Object.entries(territories)) {
    if (keywords.some((kw) => lowerText.includes(kw))) return territory;
  }
  return null;
}

// Build system prompt incluyendo el contexto legal RAG.
function buildSystemPrompt(
  perspective: "tenant" | "landlord",
  legalContext: string,
  hasLegalContext: boolean,
  availableSources: string[],
  territorialFilter: string | null,
  detectedMunicipality: string | null,
  detectedProvince: string | null,
  hasZonaTensionadaInfo: boolean,
): string {
  const commonIntro = `Eres el sistema de análisis de ACROXIA, plataforma española de protección de inquilinos.
Analiza contratos de alquiler de vivienda habitual identificando cláusulas ilegales, abusivas o sospechosas con rigor jurídico.
El contrato puede estar redactado en español o catalán; interpreta equivalencias jurídicas en ambos idiomas.`;

  const zonaTensionadaSection = detectedMunicipality
    ? `
VERIFICACIÓN DE ZONA TENSIONADA
================================
Municipio detectado: ${detectedMunicipality}
${detectedProvince ? `Provincia: ${detectedProvince}` : ""}
${territorialFilter ? `Comunidad Autónoma: ${territorialFilter}` : ""}
${
  hasZonaTensionadaInfo
    ? `
HAY información de zonas tensionadas en el contexto legal.
Si "${detectedMunicipality}" aparece en alguna lista de municipios tensionados:
- Añade una cláusula con category: "RENTA Y ACTUALIZACIONES", type: "suspicious"
- En "explanation": indica que el inmueble está en zona de mercado residencial tensionado y la renta puede estar sujeta a límites legales
- En "recommendation": "Verifique la renta máxima aplicable en https://serpavi.mivau.gob.es/"
- NO determines automáticamente si la renta es abusiva (depende de superficie, año construcción, etc. que no están en el contrato)
`
    : `
No se detectó información específica de zonas tensionadas. Si la renta parece elevada, sugiere consultar https://serpavi.mivau.gob.es/`
}
`
    : "";

  const legalContextSection = hasLegalContext
    ? `
DOCUMENTOS LEGALES INDEXADOS EN LA BASE DE DATOS ACROXIA
=========================================================
Fuentes disponibles: ${availableSources.join(", ")}
Territorio detectado: ${territorialFilter || "No detectado (aplicar normativa estatal)"}

CONTEXTO LEGAL VERIFICADO (extraído de la base de datos):
${legalContext}

INSTRUCCIONES CRÍTICAS:
- SOLO marca "verified": true si el artículo aparece literalmente en el contexto anterior
- Si citas por conocimiento general pero no está en el contexto, marca "verified": false
- Sé conservador: NO marques cláusulas como ilegales sin base legal sólida
- En contratos cortos o especiales (habitación, temporal), reconoce las limitaciones del análisis
`
    : `
AVISO: No se encontraron documentos legales específicos en la base de datos para este análisis.
- Todas las referencias legales deben tener "verified": false
- Sé conservador, recomienda consultar con un profesional ante dudas
- Aplica normativa estatal: Ley 29/1994 (LAU), Ley 12/2023, RD 7/2019
`;

  const commonFormat = `
FORMATO DE RESPUESTA (JSON estricto):
{
  "total_clauses": número,
  "valid_clauses": número,
  "suspicious_clauses": número,
  "illegal_clauses": número,
  "recommendation": "firmar" | "negociar" | "no_firmar",
  "clauses": [
    {
      "category": "FIANZA Y GARANTÍAS" | "DURACIÓN Y PRÓRROGAS" | "RENTA Y ACTUALIZACIONES" | "GASTOS E IMPUESTOS" | "OBRAS Y REPARACIONES" | "PENALIZACIONES" | "HONORARIOS" | "OTRAS",
      "type": "legal" | "suspicious" | "illegal",
      "original_text": "texto exacto del contrato",
      "explanation": "explicación clara y específica",
      "legal_reference": "artículo aplicable",
      "verified": true | false
    }
  ]
}

PRINCIPIOS DE CALIFICACIÓN (CRÍTICOS):
- "illegal" se reserva ESTRICTAMENTE para cláusulas que contradicen explícitamente una norma imperativa que aplica DIRECTAMENTE a este contrato. Si dudas, usa "suspicious".
- NUNCA marques como "illegal" la AUSENCIA de cláusulas o información (ej. "no menciona depósito autonómico", "falta referencia catastral", "no informa de la prórroga forzosa"). Las omisiones del CONTRATO, aunque sean obligaciones del ARRENDADOR, son "suspicious" (alertan al user) o ni siquiera se mencionan si el contrato es válido sin esa información.
- NUNCA marques como "illegal" cláusulas aplicando una norma "por analogía" (ej. aplicar LAU vivienda habitual a un contrato de habitación temporal). Si la norma no aplica directamente, usa "suspicious" y explica el matiz.
- Si el contrato es claramente uso distinto al de vivienda (habitación, temporal estudiantes, art. 3 LAU), recórdalo en una cláusula "OTRAS" tipo "suspicious" o "legal" indicando que se rige por autonomía de la voluntad y no por LAU vivienda habitual; no apliques restricciones de vivienda habitual como ilegales.
- Una cláusula que es subóptima, mejorable o discutible NO es ilegal. Es "suspicious".
- El conteo de "illegal" debe ser conservador. Mejor sub-contar que sobre-contar (un cliente que vea 0-1 ilegales en un contrato razonable confiará más que uno que vea 5 ilegalidades dudosas en un contrato simple).
- Rigor jurídico real: no infles para "asustar al user". El objetivo es darle información veraz.
`;

  if (perspective === "landlord") {
    return `${commonIntro}

Analiza DESDE LA PERSPECTIVA DEL PROPIETARIO/ARRENDADOR:
- ILEGALES: cláusulas que incumplen LAU y dejarían al propietario desprotegido
- SOSPECHOSAS: posibles problemas legales o cláusulas ausentes que deberían incluirse
- LEGALES: conformes y que protegen al arrendador
${zonaTensionadaSection}
${legalContextSection}

PUNTOS CRÍTICOS PARA EL PROPIETARIO:
1. Fianza: 1 mes obligatorio + 2 meses garantías adicionales máximo
2. Duración mínima y prórrogas correctamente redactadas
3. Índice de actualización válido (IRAV/IPC según corresponda)
4. Cláusula de obras: delimita responsabilidades
5. Penalización por desistimiento del inquilino
6. Suministros, IBI, comunidad: quién asume cada gasto
7. Cláusulas protectoras ausentes que deberían incluirse
${commonFormat}`;
  }

  return `${commonIntro}

Analiza DESDE LA PERSPECTIVA DEL INQUILINO:
- ILEGALES: contravienen LAU u otra normativa aplicable
- SOSPECHOSAS: pueden ser abusivas o perjudiciales
- LEGALES: conformes a normativa vigente
${zonaTensionadaSection}
${legalContextSection}

PUNTOS CRÍTICOS:
1. Fianza: máximo 1 mensualidad + 2 garantías adicionales
2. Duración: mínimo 5 años (persona física) o 7 años (jurídica) en vivienda habitual
3. Honorarios inmobiliaria: a cargo del arrendador si es empresa (Ley 12/2023)
4. Actualización renta: índice oficial (IRAV), no IPC libre desde 2025
5. Obras y reparaciones: conservación a cargo del propietario (art. 21 LAU)
6. Penalizaciones por desistimiento: máximo 1 mes por año restante
7. IBI, comunidad: por defecto a cargo del propietario salvo pacto explícito
${commonFormat}`;
}

function buildNegotiationGuidePrompt(problematicClauses: any[], summary: any): string {
  const clausesList = problematicClauses
    .map(
      (c, i) => `
${i + 1}. CLAUSULA: "${c.original_text || c.text}"
   - Tipo: ${c.type === "illegal" ? "Potencialmente ilegal" : "Sospechosa/Negociable"}
   - Categoria: ${c.category || "General"}
   - Problema: ${c.explanation}
   - Nivel de riesgo: ${c.risk_level || "No especificado"}/10
`,
    )
    .join("\n");

  return `IDENTIDAD Y TONO
================
Eres un asesor profesional y cercano que explica las cosas con claridad. Este documento es PARA EL USUARIO (inquilino), no para el propietario. Es una guia practica y accesible.

TONO OBLIGATORIO:
- Profesional pero accesible, como un buen asesor que se preocupa por ti
- Trato de usted NO: usa "tu" en todo momento, pero con respeto
- Explicaciones claras y directas, sin jerga legal innecesaria
- Enfoque practico: que significa esto para ti y que puedes hacer
- PROHIBIDO usar jerga o expresiones excesivamente coloquiales (por ejemplo: colega, tio, mola, chaval o similares)
- PROHIBIDO: tono condescendiente o paternalista

REGLAS DE FORMATO ESTRICTAS:
- NO uses emojis bajo ninguna circunstancia (ni en titulos ni en texto)
- NO uses caracteres especiales como numeros en circulos (1, 2, 3)
- Usa solo numeros normales: 1., 2., 3.
- NO uses asteriscos dobles (**texto**) para negrita. Para enfasis usa comillas simples o MAYUSCULAS
- NO uses asteriscos simples (*texto*) para cursiva
- Escribe tildes normales (a, e, i, o, u) - evita caracteres unicode raros
- Los titulos con # deben ser texto plano sin emojis, signos de exclamacion ni interrogacion

CLAUSULAS PROBLEMATICAS DETECTADAS
==================================
${clausesList}

CONTEXTO DEL ANALISIS
=====================
- Riesgo general del contrato: ${summary?.overall_risk || "medio"}
- Numero de puntos a revisar: ${problematicClauses.length}

ESTRUCTURA DEL DOCUMENTO (OBLIGATORIO)
======================================

# Resumen de tu contrato

## Lo que hemos encontrado

[1-2 parrafos breves y claros explicando la situacion general. Ejemplo: "Hemos revisado tu contrato y hemos detectado ${problematicClauses.length} puntos que conviene revisar antes de firmar. A continuacion te explicamos cada uno y que opciones tienes."]

---

## Los puntos que deberias revisar

[Para CADA clausula, crear una seccion asi. Maximo 2-3 frases por apartado:]

### Punto 1: [Titulo muy corto y claro del problema]

Que pone en el contrato:
"[Extracto breve de la clausula, simplificado si es muy largo]"

Por que es importante:
[Explicacion en 1-2 frases claras. Ejemplo: "Esto significa que si te vas antes de tiempo, tendrias que pagar X meses. Sin embargo, la ley establece que solo puede ser 1 mes como maximo."]

Que puedes hacer:
[Sugerencia practica y respetuosa. Ejemplo: "Puedes comentarle al propietario que este punto no se ajusta a la normativa vigente y proponer una redaccion alternativa. Por ejemplo: 'He revisado el contrato y creo que podriamos ajustar esta clausula para que sea conforme a la ley.'"]

---

[Repetir para cada punto problematico: Punto 2, Punto 3, etc.]

---

## Consejos para la conversacion

[3-4 consejos muy breves y practicos, en formato lista:]

- Elige un buen momento: Busca un momento tranquilo para hablar con el propietario
- Lleva el contrato: Asi podeis revisar los puntos juntos sobre el documento
- Manten un tono constructivo: El objetivo es llegar a un acuerdo beneficioso para ambas partes
- Deja constancia por escrito: Si acordais modificar algo, aseguraos de que quede reflejado en el contrato

---

## Si no llegais a un acuerdo

[2-3 frases tranquilizadoras sobre que hacer si la negociacion no funciona. Tono calmado y profesional:]

Si no conseguis acordar todos los puntos, puedes valorar si el piso te compensa igualmente o buscar otras opciones. Tambien puedes consultar con una asociacion de inquilinos de tu zona, que suelen ofrecer orientacion gratuita.

---

Este resumen tiene caracter orientativo e informativo. Para asesoramiento legal vinculante, consulta con un abogado colegiado.

---
Generado por ACROXIA - Analisis de contratos con IA`;
}

// Categorías semánticas inferidas del contrato (para ranking de chunks)
function inferSemanticCategories(text: string): string[] {
  const cats: string[] = [];
  const lower = text.toLowerCase();
  if (/fian[zç]a|garant[íi]a/i.test(lower)) cats.push("fianza");
  if (/renta|actualizaci[óo]n|ipc|irav/i.test(lower)) cats.push("renta_actualizacion");
  if (/duraci[óo]n|pr[óo]rroga|prorroga/i.test(lower)) cats.push("duracion_prorroga");
  if (/obra|reparaci[óo]n|conservaci[óo]n/i.test(lower)) cats.push("obras_reparaciones");
  if (/penalizaci[óo]n|desistimiento|incumplimiento/i.test(lower)) cats.push("penalizaciones");
  if (/ibi|gasto|comunidad|suministro/i.test(lower)) cats.push("gastos_impuestos");
  if (/honorar|inmobiliaria|agencia/i.test(lower)) cats.push("honorarios");
  return cats;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { analysisId, filePath, fileType, sessionId, fileName, perspective: rawPerspective } = await req.json();
    const perspective = rawPerspective === "landlord" ? "landlord" : "tenant";

    if (!filePath) throw new Error("Faltan parámetros requeridos");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let effectiveAnalysisId = analysisId;
    if (!effectiveAnalysisId) {
      const { data: newAnalysis, error: insertError } = await supabase
        .from("anonymous_analyses")
        .insert({
          session_id: sessionId || "unknown",
          file_name: fileName || "unknown",
          file_path: filePath,
          contract_status: perspective === "landlord" ? "propietario" : "inquilino",
        })
        .select("id")
        .single();
      if (insertError) throw new Error(`Error creating analysis record: ${insertError.message}`);
      effectiveAnalysisId = newAnalysis.id;
    }

    console.log(`Processing public analysis: ${effectiveAnalysisId}, file: ${filePath}`);

    const { data: fileData, error: downloadError } = await supabase.storage.from("contracts").download(filePath);
    if (downloadError || !fileData) throw new Error(`Error descargando archivo: ${downloadError?.message}`);

    const detectedFileType = getFileType(filePath, fileType);
    const buffer = await fileData.arrayBuffer();
    let contractText = "";

    switch (detectedFileType) {
      case "pdf":
        contractText = await extractPdfText(buffer);
        if (looksLikeLowQualityPdfExtraction(contractText)) {
          try {
            const visionText = await extractPdfTextWithVision(buffer, apiKey);
            if (visionText.length > contractText.length) contractText = visionText;
          } catch (visionError) {
            console.warn("Public vision OCR fallback failed:", visionError);
          }
        }
        break;
      case "docx":
        contractText = await extractDocxText(buffer);
        break;
      case "image":
        contractText = await extractImageText(buffer, fileType || "image/jpeg", apiKey);
        break;
    }

    if (!contractText || contractText.length < 100)
      throw new Error("No se pudo extraer suficiente texto del documento");
    console.log(`Extracted ${contractText.length} characters`);

    const languageDetection = detectSupportedLanguage(contractText);
    if (!languageDetection.supported) {
      await supabase
        .from("anonymous_analyses")
        .update({
          analysis_result: {
            error: "No se puede validar el contrato: idioma no soportado. Solo se admiten español y catalán.",
            code: "UNSUPPORTED_LANGUAGE",
            detected_language: languageDetection.detectedLanguage,
            language_scores: { es: languageDetection.esScore, ca: languageDetection.caScore },
          },
        })
        .eq("id", effectiveAnalysisId);
      return new Response(
        JSON.stringify({
          error: "No se puede validar el contrato: idioma no soportado. Solo se admiten español y catalán.",
          code: "UNSUPPORTED_LANGUAGE",
          detected_language: languageDetection.detectedLanguage,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ========================================================================
    // RAG: detectar territorio + buscar chunks legales relevantes
    // ========================================================================
    const detectedMunicipality = extractMunicipality(contractText);
    const detectedProvince = extractProvince(contractText);
    const territorialFilter = detectTerritory(contractText);
    const semanticCategories = inferSemanticCategories(contractText);

    console.log(
      `[RAG] municipio="${detectedMunicipality}" provincia="${detectedProvince}" territorio="${territorialFilter}" categorías=[${semanticCategories.join(",")}]`,
    );

    // Búsqueda general (texto completo, filtrada por territorio)
    const searchQuery =
      `arrendamiento vivienda fianza renta actualización IRAV duración prórroga ${semanticCategories.join(" ")}`.trim();
    const { data: generalChunks, error: gErr } = await supabase.rpc("search_legal_chunks", {
      search_query: searchQuery,
      match_count: 12,
      territorial_filter: territorialFilter,
    });
    if (gErr) console.warn("[RAG] search_legal_chunks error:", gErr.message);

    // Búsqueda específica por ubicación (zona tensionada / municipio)
    let locationChunks: any[] = [];
    if (detectedMunicipality || detectedProvince) {
      const { data: locChunks, error: lErr } = await supabase.rpc("search_legal_chunks_by_location", {
        search_query: "zona mercado residencial tensionado límite renta precio índice referencia municipal",
        municipality_name: detectedMunicipality,
        province_name: detectedProvince,
        match_count: 8,
      });
      if (lErr) console.warn("[RAG] search_legal_chunks_by_location error:", lErr.message);
      locationChunks = locChunks || [];
    }

    // Combinar y deduplicar chunks
    const allChunksMap = new Map<string, any>();
    (generalChunks || []).forEach((c: any) => allChunksMap.set(c.id, c));
    locationChunks.forEach((c: any) => {
      c.is_location_match = true;
      allChunksMap.set(c.id, c);
    });

    const combinedChunks = Array.from(allChunksMap.values()).sort((a, b) => {
      if (a.is_location_match && !b.is_location_match) return -1;
      if (!a.is_location_match && b.is_location_match) return 1;
      return (b.rank || 0) - (a.rank || 0);
    });

    // Limit a 15 chunks para preview gratuito
    const usedChunks = combinedChunks.slice(0, 15);

    let legalContext = "";
    let hasZonaTensionadaInfo = false;
    const uniqueSources = new Set<string>();

    legalContext = usedChunks
      .map((c: any) => {
        uniqueSources.add(c.document_title);
        if (c.content?.toLowerCase().includes("tensionad") || c.affected_municipalities?.length > 0) {
          hasZonaTensionadaInfo = true;
        }
        const muni =
          c.affected_municipalities?.length > 0
            ? `\nMunicipios afectados: ${c.affected_municipalities.slice(0, 12).join(", ")}${c.affected_municipalities.length > 12 ? "..." : ""}`
            : "";
        const locMatch = c.is_location_match ? " [COINCIDENCIA DE UBICACIÓN]" : "";
        return `[FUENTE: ${c.document_title}]${locMatch}
${c.article_reference ? `Artículo: ${c.article_reference}` : ""}
${c.section_title ? `Sección: ${c.section_title}` : ""}
${c.territorial_scope ? `Ámbito: ${c.territorial_scope}` : ""}${muni}
Contenido: ${c.content}
---`;
      })
      .join("\n\n");

    const hasLegalContext = usedChunks.length > 0;
    const availableSources = Array.from(uniqueSources);
    console.log(
      `[RAG] usados ${usedChunks.length} chunks de ${availableSources.length} fuentes (${locationChunks.length} location-specific)`,
    );

    // ========================================================================
    // AI analysis
    // ========================================================================
    const systemPrompt = buildSystemPrompt(
      perspective,
      legalContext,
      hasLegalContext,
      availableSources,
      territorialFilter,
      detectedMunicipality,
      detectedProvince,
      hasZonaTensionadaInfo,
    );

    const { coreText, annexText } = splitContractCoreAndAnnexes(contractText);
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analiza el siguiente contrato de alquiler:\n\nCONTRATO BASE:\n${coreText.substring(0, 13000)}\n\nANEXOS:\n${annexText.substring(0, 3000)}\n\nTEXTO COMPLETO DE RESPALDO:\n${contractText.substring(0, 2000)}`,
          },
        ],
        temperature: 0,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("Error al procesar el contrato con IA");
    }

    const aiData = await aiResponse.json();
    let analysisContent = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Respuesta de IA no válida");

    const analysisResult = JSON.parse(jsonMatch[0]);
    analysisResult.perspective = perspective;
    analysisResult.contract_metadata = {
      ...(analysisResult.contract_metadata || {}),
      detected_language: languageDetection.detectedLanguage,
      language_scores: { es: languageDetection.esScore, ca: languageDetection.caScore },
      perspective,
      detected_municipality: detectedMunicipality,
      detected_province: detectedProvince,
      detected_territory: territorialFilter,
      legal_context_chunks: usedChunks.length,
      legal_context_sources: availableSources.length,
    };

    console.log(
      `Analysis complete: ${analysisResult.total_clauses} clauses, ${analysisResult.illegal_clauses} illegal`,
    );

    // Si hay cláusulas problemáticas, generar guía de negociación (mismo patrón que el privado)
    const problematicClauses = (analysisResult.clauses || []).filter(
      (c: any) => c.type === "illegal" || c.type === "suspicious",
    );

    if (problematicClauses.length > 0) {
      try {
        const guidePrompt = buildNegotiationGuidePrompt(problematicClauses, analysisResult.summary);
        const guideResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: guidePrompt },
              {
                role: "user",
                content:
                  "Genera una guia de negociacion clara y practica para el inquilino. Incluye todos los puntos problematicos detectados con sugerencias de conversacion y consejos practicos. El tono debe ser profesional pero accesible, sin jerga legal innecesaria. No uses expresiones coloquiales como 'colega', 'tio' o similares. No uses emojis ni asteriscos para negrita. Los titulos con # deben ser texto plano.",
              },
            ],
          }),
        });

        if (guideResponse.ok) {
          const guideData = await guideResponse.json();
          analysisResult.generated_letter = guideData.choices?.[0]?.message?.content || null;
          console.log(`[analyze-contract-public] Generated negotiation letter (${analysisResult.generated_letter?.length || 0} chars)`);
        } else {
          console.warn("[analyze-contract-public] Negotiation letter generation failed:", await guideResponse.text());
        }
      } catch (e: any) {
        console.error("[analyze-contract-public] Error generating negotiation letter:", e?.message || e);
      }
    }

    const { error: updateError } = await supabase
      .from("anonymous_analyses")
      .update({ analysis_result: analysisResult })
      .eq("id", effectiveAnalysisId);
    if (updateError) throw new Error("Error guardando resultados");

    return new Response(
      JSON.stringify({
        success: true,
        analysisId: effectiveAnalysisId,
        preview: {
          total_clauses: analysisResult.total_clauses,
          valid_clauses: analysisResult.valid_clauses,
          suspicious_clauses: analysisResult.suspicious_clauses,
          illegal_clauses: analysisResult.illegal_clauses,
          recommendation: analysisResult.recommendation,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Public analysis error:", error);
    return new Response(JSON.stringify({ error: error.message || "Error procesando el análisis" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

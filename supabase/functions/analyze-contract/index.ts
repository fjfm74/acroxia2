import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";
import { MODELS } from "../_shared/models.ts";
import { buildAnalysisSystemPrompt } from "../_shared/analysis-prompt.ts";
import {
  AiProviderError,
  bytesToBase64,
  callAnalysisModel,
  parseAnalysisJson,
  pickProvider,
} from "../_shared/ai-client.ts";
import { verifyClauseQuotes } from "../_shared/analysis-verify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequiredDocSignals = {
  hasHabitabilityDocument: boolean;
  hasCedulaHabitabilidad: boolean;
  hasOccupancyLicense: boolean;
  hasEnergyCertificate: boolean;
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
  /\bcertificat d['']efici[èe]ncia energ[èe]tica\b/gi,
  /\bc[èe]dula d['']habitabilitat\b/gi,
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

  if (total < 3) {
    return { detectedLanguage: "unsupported", supported: false, esScore, caScore };
  }

  if (esScore >= 3 && esScore >= caScore * 1.6) {
    return { detectedLanguage: "es", supported: true, esScore, caScore };
  }

  if (caScore >= 3 && caScore >= esScore * 1.6) {
    return { detectedLanguage: "ca", supported: true, esScore, caScore };
  }

  if (esScore >= 2 && caScore >= 2) {
    return { detectedLanguage: "mixed_es_ca", supported: true, esScore, caScore };
  }

  if (esScore >= 3) {
    return { detectedLanguage: "es", supported: true, esScore, caScore };
  }

  if (caScore >= 3) {
    return { detectedLanguage: "ca", supported: true, esScore, caScore };
  }

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

// Extraer términos clave del contrato para búsqueda RAG contextual
function extractKeyTerms(text: string): string {
  const terms: string[] = [];
  const lowerText = text.toLowerCase();

  if (/fianza|deposito|garantia|aval|fian[çc]a|dip[oò]sit/.test(lowerText))
    terms.push("fianza garantia deposito fiança dipòsit");
  if (/mensualidad|renta|euros|€|precio|lloguer|renda|preu/.test(lowerText)) {
    terms.push("renta precio mensualidad");
    // Si hay indicios de precio/renta, añadir términos de zona tensionada
    terms.push("zona mercado residencial tensionado límite precio índice referencia");
  }
  if (/año|años|meses|duracion|prorroga|renovacion|durada|pr[òo]rroga|renovaci[oó]/.test(lowerText))
    terms.push("duracion prorroga plazo");
  if (
    /obra|reforma|reparacion|mantenimiento|conservacion|obres|reparaci[oó]|manteniment|conservaci[oó]/.test(lowerText)
  )
    terms.push("obras reparaciones conservacion");
  if (
    /penalizacion|indemnizacion|resolucion|desistimiento|penalitzaci[oó]|indemnitzaci[oó]|resoluci[oó]|desistiment/.test(
      lowerText,
    )
  )
    terms.push("penalizacion resolucion desistimiento");
  if (/subarr|cesion|tercero|subarrend|cessi[oó]|tercer/.test(lowerText)) terms.push("subarriendo cesion");
  if (/ibi|impuesto|comunidad|gastos|impost|comunitat|despeses/.test(lowerText))
    terms.push("gastos impuestos comunidad");
  if (/inmobiliaria|honorarios|gestion|immobili[aà]ria|honoraris|gesti[oó]/.test(lowerText))
    terms.push("honorarios inmobiliaria");
  if (/mascota|animal|perro|gato|gos|gat/.test(lowerText)) terms.push("mascotas prohibicion");
  if (/seguro|responsabilidad|asseguran[cç]a|responsabilitat/.test(lowerText)) terms.push("seguro responsabilidad");

  // Siempre incluir términos de habitabilidad y certificado energético (obligatorios en todo contrato)
  terms.push("habitabilidad cédula certificado energético vivienda habitual habitabilitat cèdula certificat energètic");
  // Siempre incluir términos base de arrendamiento
  terms.push(
    "arrendamiento vivienda habitual clausula ilegal abusiva LAU arrendament lloguer habitatge clàusula abusiva",
  );

  return terms.join(" ");
}

// Map contract terms to semantic categories for enhanced RAG search
function mapTermsToSemanticCategories(text: string): string[] {
  const categories: Set<string> = new Set();
  const lowerText = text.toLowerCase();

  if (/fianza|deposito|garantia|aval|fian[çc]a|dip[oò]sit/.test(lowerText)) {
    categories.add("garantia");
    categories.add("obligacion");
  }
  if (/mensualidad|renta|euros|€|precio|pago|lloguer|renda|preu|pagament/.test(lowerText)) {
    categories.add("limite_precio");
    categories.add("actualizacion");
  }
  if (/año|años|meses|duracion|prorroga|renovacion|plazo|durada|pr[òo]rroga|renovaci[oó]|termini/.test(lowerText)) {
    categories.add("plazo");
    categories.add("derecho");
  }
  if (
    /obra|reforma|reparacion|mantenimiento|conservacion|obres|reparaci[oó]|manteniment|conservaci[oó]/.test(lowerText)
  ) {
    categories.add("obligacion");
  }
  if (
    /penalizacion|indemnizacion|resolucion|desistimiento|penalitzaci[oó]|indemnitzaci[oó]|resoluci[oó]|desistiment/.test(
      lowerText,
    )
  ) {
    categories.add("sancion");
    categories.add("prohibicion");
  }
  if (/subarr|cesion|tercero|subarrend|cessi[oó]|tercer/.test(lowerText)) {
    categories.add("prohibicion");
    categories.add("requisito");
  }
  if (/ibi|impuesto|comunidad|gastos|impost|comunitat|despeses/.test(lowerText)) {
    categories.add("obligacion");
  }
  if (/mascota|animal|gos|gat/.test(lowerText)) {
    categories.add("prohibicion");
    categories.add("excepcion");
  }
  if (/zona\s+tensionada|mercado\s+tensionado|zona\s+tensionada|mercat\s+tensionat/.test(lowerText)) {
    categories.add("limite_precio");
    categories.add("lista_entidades");
  }
  if (/procedimiento|demanda|desahucio|juicio|procediment|judici|desnonament/.test(lowerText)) {
    categories.add("procedimiento");
  }

  // Siempre incluir categorías de requisitos documentales (habitabilidad, certificado energético)
  categories.add("requisito");
  categories.add("obligacion");

  return Array.from(categories);
}

// Extraer el municipio del contrato
function extractMunicipality(text: string): string | null {
  // Patrones comunes en contratos para detectar ubicación
  const patterns = [
    // "situada en Cervera", "domicilio en Barcelona", etc.
    /(?:situada?\s+en|domicilio\s+en|ubicad[ao]\s+en|localidad\s+de|municipio\s+de|población\s+de|ciudad\s+de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|d['']|la|el|les|l['']|dels?)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    // Catalán: "situat a", "domicili a", "municipi de", etc.
    /(?:situad[ao]?\s+a|domicili\s+a|ubicad[ao]?\s+a|localitat\s+de|municipi\s+de|poblaci[oó]\s+de|ciutat\s+de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|d['']|la|el|les|l['']|dels?)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    // "C.P. 25200 Cervera"
    /C\.?P\.?\s*\d{5}\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    // "en Cervera (Lleida)" o "en Cervera, Lleida"
    /\ben\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)\s*[,(]\s*(?:provincia\s+(?:de\s+)?)?[A-ZÀ-Ú]/gi,
    // "finca sita en Cervera"
    /finca\s+sita\s+en\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    // Catalán: "finca situada a Cervera"
    /finca\s+situada?\s+a\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        // Normalizar: primera letra mayúscula, resto minúscula
        const municipality = match[1]
          .trim()
          .split(/\s+/)
          .map((word) => {
            // Mantener preposiciones en minúscula
            if (/^(de|del|la|el|les|l['']|d['']|dels?)$/i.test(word)) {
              return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(" ");

        // Filtrar palabras comunes que no son municipios
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
        if (!excluded.some((ex) => municipality.toLowerCase().startsWith(ex))) {
          return municipality;
        }
      }
    }
  }

  return null;
}

// Extraer la provincia del contrato
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

  const lowerText = text.toLowerCase();

  for (const province of provinces) {
    // Buscar patrones como "provincia de Lleida", "(Lleida)", ", Lleida"
    const patterns = [
      new RegExp(`provincia\\s+de\\s+${province}`, "i"),
      new RegExp(`\\(${province}\\)`, "i"),
      new RegExp(`,\\s*${province}\\s*[,\\)]`, "i"),
      new RegExp(`\\b${province}\\b`, "i"),
    ];

    if (patterns.some((p) => p.test(text))) {
      return province;
    }
  }

  return null;
}

// Detectar territorio para aplicar normativa autonómica
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
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return territory;
    }
  }
  return null;
}

// Anonimizar datos sensibles antes de enviar a la IA (protección de terceros)
function sanitizeSensitiveData(text: string): string {
  let sanitized = text;

  // Anonimizar DNI/NIE: 12345678A o X1234567A -> ****5678* o X***4567*
  sanitized = sanitized.replace(/\b([A-Z]?)(\d{7,8})([A-Z])\b/gi, (match, prefix, digits, suffix) => {
    const visibleDigits = digits.slice(-4, -1);
    return prefix ? `${prefix}***${visibleDigits}*` : `****${visibleDigits}*`;
  });

  // Anonimizar IBAN español: ES12 3456 7890 1234 5678 9012 -> ES** **** **** **** ****
  sanitized = sanitized.replace(
    /\b(ES)\s?(\d{2})\s?(\d{4})\s?(\d{4})\s?(\d{4})\s?(\d{4})\s?(\d{4})\b/gi,
    "[IBAN-ANONIMIZADO]",
  );

  // Anonimizar otros IBAN europeos
  sanitized = sanitized.replace(/\b([A-Z]{2})\s?(\d{2})\s?([\d\s]{10,30})\b/gi, (match, country, check, account) => {
    if (/^[A-Z]{2}$/.test(country) && account.replace(/\s/g, "").length >= 10) {
      return "[IBAN-ANONIMIZADO]";
    }
    return match;
  });

  // Anonimizar números de cuenta bancaria (20 dígitos españoles)
  sanitized = sanitized.replace(/\b(\d{4})\s?(\d{4})\s?(\d{2})\s?(\d{10})\b/g, "[CUENTA-ANONIMIZADA]");

  // Anonimizar teléfonos españoles: +34 612 345 678 o 612345678 -> +34 6** *** ***
  sanitized = sanitized.replace(
    /(\+34\s?)?([6789])(\d{2})\s?(\d{3})\s?(\d{3})/g,
    (match, prefix, first, rest1, rest2, rest3) => {
      return `${prefix || ""}${first}** *** ***`;
    },
  );

  // Anonimizar teléfonos fijos españoles: 91 234 56 78 -> 9* *** ** **
  sanitized = sanitized.replace(
    /\b([89]\d)\s?(\d{3})\s?(\d{2})\s?(\d{2})\b/g,
    (match, prefix) => `${prefix[0]}* *** ** **`,
  );

  console.log(`Sanitized ${text.length - sanitized.length} characters of sensitive data`);
  return sanitized;
}

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const decoder = new TextDecoder("utf-8", { fatal: false });
  const rawText = decoder.decode(uint8Array);

  const textSegments = rawText.match(/[\x20-\x7E\xC0-\xFF\n\r\t]+/g) || [];
  return textSegments
    .filter((segment) => segment.length > 10)
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
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELS.GEMINI_FAST,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe TODO el texto visible en esta imagen de un contrato de alquiler español. Extrae el texto completo manteniendo la estructura del documento. Si hay varias páginas o secciones, transcríbelas todas. Devuelve SOLO el texto transcrito sin comentarios adicionales.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Error al procesar la imagen con OCR");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function extractPdfTextWithVision(buffer: ArrayBuffer, apiKey: string): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = btoa(binary);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELS.GEMINI_FAST,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe TODO el texto legible de este PDF de alquiler en España. Mantén estructura por secciones cuando sea posible. Devuelve SOLO texto plano transcrito, sin comentarios.",
            },
            {
              type: "image_url",
              image_url: { url: `data:application/pdf;base64,${base64}` },
            },
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
    /c[èe]dula\s+d['']habitabilitat/i,
    /licencia\s+de\s+(?:primera|segunda)\s+ocupaci[oó]n/i,
    /llic[eè]ncia\s+de\s+(?:primera|segona)\s+ocupaci[oó]/i,
    /certificado\s+de\s+eficiencia\s+energ[ée]tica/i,
    /certificat\s+d['']efici[èe]ncia\s+energ[èe]tica/i,
    /etiqueta\s+energ[ée]tica/i,
  ];

  let splitIndex = -1;
  for (const marker of markers) {
    const match = marker.exec(text);
    if (match && match.index >= 0 && (splitIndex === -1 || match.index < splitIndex)) {
      splitIndex = match.index;
    }
  }

  if (splitIndex > 5000) {
    return {
      coreText: text.slice(0, splitIndex).trim(),
      annexText: text.slice(splitIndex).trim(),
      splitApplied: true,
    };
  }

  return {
    coreText: text,
    annexText: "",
    splitApplied: false,
  };
}

function detectRequiredDocumentSignals(text: string): RequiredDocSignals {
  const lower = text.toLowerCase();
  const hasCedulaHabitabilidad =
    /c[ée]dula\s+de\s+habitabilidad/.test(lower) || /c[èe]dula\s+d['']habitabilitat/.test(lower);
  const hasOccupancyLicense =
    /licencia\s+de\s+(?:primera|segunda)\s+ocupaci[oó]n/.test(lower) ||
    /llic[eè]ncia\s+de\s+(?:primera|segona)\s+ocupaci[oó]/.test(lower);
  const hasEnergyCertificate =
    /certificado\s+de\s+eficiencia\s+energ[ée]tica/.test(lower) ||
    /certificat\s+d['']efici[èe]ncia\s+energ[èe]tica/.test(lower) ||
    /etiqueta\s+energ[ée]tica/.test(lower) ||
    /etiqueta\s+energ[èe]tica/.test(lower) ||
    /\bcee\b/.test(lower);

  return {
    hasHabitabilityDocument: hasCedulaHabitabilidad || hasOccupancyLicense,
    hasCedulaHabitabilidad,
    hasOccupancyLicense,
    hasEnergyCertificate,
  };
}


// Construye prompt para generar 2 documentos en JSON: guía y email.
function buildNegotiationGuidePrompt(
  problematicClauses: any[],
  summary: any,
  perspective: "tenant" | "landlord" = "tenant",
): string {
  const overallRisk = String(summary?.overall_risk || "medio").toLowerCase();
  const isLandlord = perspective === "landlord";

  const audienceLabel = isLandlord ? "propietario/arrendador" : "inquilino/arrendatario";
  const counterpartyLabel = isLandlord ? "inquilino" : "propietario";

  const toneByPerspective = isLandlord
    ? "Tono colaborativo: el objetivo es asegurar que el contrato cumpla la LAU para evitar futuras impugnaciones del inquilino. Constructivo, profesional, sin acusaciones."
    : "Tono firme pero conciliador: defensa de los derechos del inquilino sin agresividad. Directo, profesional, basado en la normativa.";

  const firmnessByRisk =
    overallRisk === "alto" || overallRisk === "critico"
      ? "ASERTIVO: hay puntos que DEBEN negociarse urgentemente antes de firmar/continuar."
      : overallRisk === "medio"
      ? "FIRME: hay puntos que recomendamos modificar para que el contrato sea conforme a derecho."
      : "EDUCATIVO: son puntos a revisar que conviene aclarar, sin alarmar.";

  const clausesList = problematicClauses
    .map(
      (c, i) => `${i + 1}. [${(c.type || "suspicious").toUpperCase()} · riesgo ${c.risk_level || "?"}/10 · ${c.category || "General"}]
   Cláusula: "${(c.original_text || c.text || "").slice(0, 400)}"
   Problema detectado: ${c.explanation || "no especificado"}`,
    )
    .join("\n\n");

  return `Eres un asesor legal experto en LAU (Ley 29/1994 de Arrendamientos Urbanos) en España. Tu tarea: generar 2 documentos para el ${audienceLabel}, basados EXCLUSIVAMENTE en las cláusulas problemáticas REALES detectadas en el contrato analizado.

CONTEXTO
========
- Audiencia: ${audienceLabel}
- Riesgo general del contrato: ${overallRisk}
- Tono según perspectiva: ${toneByPerspective}
- Firmeza según riesgo: ${firmnessByRisk}
- Número de puntos problemáticos: ${problematicClauses.length}

CLÁUSULAS PROBLEMÁTICAS DETECTADAS (datos reales del contrato)
==============================================================
${clausesList}

INSTRUCCIONES CRÍTICAS
======================
- Cada documento debe REFERENCIAR las cláusulas reales detectadas, una por una. NO uses lenguaje genérico.
- Cita la LAU cuando proceda (ej: "art. 36 LAU sobre fianza", "art. 9 LAU sobre duración").
- Trato: "tú" en el email.
- NO uses emojis, NI **negritas** markdown, NI colores, NI cumplidos vacíos.
- Números arábigos (1, 2, 3), no romanos.

OUTPUT OBLIGATORIO
==================
Devuelve EXACTAMENTE un objeto JSON válido, sin texto fuera del JSON, sin code fences. Schema:

{
  "informative_guide": "<markdown ~700-900 palabras. Estructura obligatoria con encabezados '#':
    1) Resumen del análisis (1 párrafo)
    2) Puntos a ${overallRisk === "bajo" ? "revisar" : overallRisk === "medio" ? "negociar" : "exigir"} — UNO por cada cláusula problemática REAL detectada arriba, con sub-secciones 'Qué pone tu contrato' / 'Por qué importa (con cita LAU)' / 'Qué decir o hacer'
    3) Consejos para la conversación (3-4 bullets)
    4) Disclaimer legal (carácter informativo, no asesoramiento)>",

  "email_draft": "<email completo listo para copiar y pegar. ~250-400 palabras. Estructura: 'Asunto: ...' en primera línea, línea en blanco, saludo ('Hola [nombre del ${counterpartyLabel}],'), motivo (acabo de revisar el contrato), puntos concretos referenciando las cláusulas reales detectadas, propuesta constructiva, despedida cordial. Tono según las reglas anteriores. Tutea.>"
}

REGLAS DE FORMATO ESTRICTAS
===========================
- NO añadas texto antes ni después del JSON.
- NO uses backticks ni code fences.
- Escapa correctamente los saltos de línea dentro de los strings JSON con \\n.
- NO incluyas comentarios JSON.`;
}

// Parsea respuesta del modelo intentando extraer los 2 campos. Robusto a code fences y texto extra.
function parseGuideResponse(raw: string): {
  informative_guide: string | null;
  email_draft: string | null;
} {
  if (!raw) return { informative_guide: null, email_draft: null };
  const stripped = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    const obj = JSON.parse(stripped);
    return {
      informative_guide: typeof obj.informative_guide === "string" ? obj.informative_guide : null,
      email_draft: typeof obj.email_draft === "string" ? obj.email_draft : null,
    };
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const obj = JSON.parse(match[0]);
        return {
          informative_guide: typeof obj.informative_guide === "string" ? obj.informative_guide : null,
          email_draft: typeof obj.email_draft === "string" ? obj.email_draft : null,
        };
      } catch {
        // fall through
      }
    }
  }
  return { informative_guide: stripped, email_draft: null };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let creditConsumed = false;
  let userId: string | null = null;

  try {
    const body = await req.json();
    const { contractId, filePath, fileType: mimeType } = body;
    const perspective: "tenant" | "landlord" = body?.perspective === "landlord" ? "landlord" : "tenant";

    const ACCEPTED_MIME_TYPES = new Set([
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ]);
    if (mimeType && !ACCEPTED_MIME_TYPES.has(String(mimeType).toLowerCase())) {
      return new Response(
        JSON.stringify({
          error: "Formato no soportado",
          detail: `Formato ${mimeType} no aceptado. Use PDF, DOCX, JPG, PNG o WEBP.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Autenticación obligatoria
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    // 2. El contrato debe existir y pertenecer al usuario
    const { data: contractRow } = await supabase
      .from("contracts")
      .select("id, user_id")
      .eq("id", contractId)
      .single();
    if (!contractRow || contractRow.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Contrato no encontrado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Admin no consume créditos
    const { data: isAdmin } = await supabase.rpc("is_admin", { check_user_id: userId });

    // 4. Consumo atómico del crédito ANTES de descargar el fichero y llamar a la IA
    if (!isAdmin) {
      const { data: ok } = await supabase.rpc("consume_credit", { p_user_id: userId });
      if (ok !== true) {
        await supabase.from("contracts").update({ status: "failed" }).eq("id", contractId);
        return new Response(JSON.stringify({ error: "Sin créditos", code: "NO_CREDITS" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      creditConsumed = true;
    }

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage.from("contracts").download(filePath);

    if (downloadError) {
      if (creditConsumed) { await supabase.rpc("refund_credit", { p_user_id: userId }); creditConsumed = false; }
      throw downloadError;
    }

    // Determine file type and extract text
    const detectedType = getFileType(filePath, mimeType);
    const buffer = await fileData.arrayBuffer();
    let contractText = "";

    // Camino PDF nativo: solo con Anthropic activo, PDF y < 30 MB.
    const useNativePdf =
      pickProvider("paid") === "anthropic" && detectedType === "pdf" && buffer.byteLength < 30 * 1024 * 1024;
    let lowQualityExtraction = false;

    console.log(`Processing file as: ${detectedType} (nativePdf=${useNativePdf})`);

    switch (detectedType) {
      case "pdf":
        contractText = await extractPdfText(buffer);
        lowQualityExtraction = looksLikeLowQualityPdfExtraction(contractText);
        // Fallback to AI OCR vision if extraction quality is poor (solo si no enviamos el PDF nativo)
        if (!useNativePdf && lowQualityExtraction) {
          console.log("Low-quality PDF text extraction detected, retrying with vision OCR...");
          try {
            const visionText = await extractPdfTextWithVision(buffer, lovableApiKey);
            if (visionText.length > contractText.length) {
              contractText = visionText;
              console.log(`Vision OCR improved extraction to ${contractText.length} chars`);
            }
          } catch (visionError) {
            console.warn("Vision OCR fallback failed, keeping native extraction:", visionError);
          }
        }
        break;
      case "docx":
        contractText = await extractDocxText(buffer);
        if (!contractText || contractText.length < 200) {
          console.log("DOCX text extraction returned little content, retrying with vision OCR...");
          try {
            const visionText = await extractPdfTextWithVision(buffer, lovableApiKey);
            if (visionText && visionText.length > contractText.length) {
              contractText = visionText;
              console.log(`Vision OCR improved DOCX extraction to ${contractText.length} chars`);
            }
          } catch (visionError) {
            console.warn("Vision OCR fallback for DOCX failed:", visionError);
          }
        }
        break;
      case "image":
        contractText = await extractImageText(buffer, mimeType || "image/jpeg", lovableApiKey);
        break;
    }

    console.log(`Extracted ${contractText.length} characters from ${detectedType}`);

    const languageDetection = detectSupportedLanguage(contractText);
    console.log(
      `Language detection: ${languageDetection.detectedLanguage} (es=${languageDetection.esScore}, ca=${languageDetection.caScore})`,
    );

    if (!languageDetection.supported && !(useNativePdf && lowQualityExtraction)) {
      if (creditConsumed) { await supabase.rpc("refund_credit", { p_user_id: userId }); creditConsumed = false; }
      await supabase.from("contracts").update({ status: "failed" }).eq("id", contractId);
      return new Response(
        JSON.stringify({
          error: "No se puede validar el contrato: idioma no soportado. Actualmente solo se admiten español y catalán.",
          code: "UNSUPPORTED_LANGUAGE",
          detected_language: languageDetection.detectedLanguage,
          language_scores: { es: languageDetection.esScore, ca: languageDetection.caScore },
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Detect required documents across the full text (contract + annexes)
    const requiredDocSignals = detectRequiredDocumentSignals(contractText);

    // Separate contract core from annexes to avoid large variance in RAG when attachments are included
    const { coreText, annexText, splitApplied } = splitContractCoreAndAnnexes(contractText);
    const ragBaseText = coreText.length > 1000 ? coreText : contractText;

    // Extract key terms and detect territory for enhanced RAG search (use contract core first)
    const keyTerms = extractKeyTerms(ragBaseText);
    const territorialFilter = detectTerritory(ragBaseText);
    const detectedMunicipality = extractMunicipality(ragBaseText);
    const detectedProvince = extractProvince(ragBaseText);
    const searchQuery = `${keyTerms} arrendamiento vivienda habitual clausula ilegal abusiva LAU`;

    // Map key terms to semantic categories for enhanced search
    const semanticCategories = mapTermsToSemanticCategories(ragBaseText);

    console.log(`RAG search query: ${searchQuery}`);
    console.log(`Detected territory: ${territorialFilter || "none"}`);
    console.log(`Detected municipality: ${detectedMunicipality || "none"}`);
    console.log(`Detected province: ${detectedProvince || "none"}`);
    console.log(`Semantic categories: ${semanticCategories.join(", ") || "none"}`);
    console.log(
      `Contract split applied: ${splitApplied} (core=${coreText.length} chars, annex=${annexText.length} chars)`,
    );
    console.log(
      `Required docs detected: habitability=${requiredDocSignals.hasHabitabilityDocument}, energy=${requiredDocSignals.hasEnergyCertificate}`,
    );

    // Sanitize sensitive data (DNI, IBAN, phone) before sending to AI
    const sanitizedContractText = sanitizeSensitiveData(contractText);
    const sanitizedCoreText = sanitizeSensitiveData(coreText);
    const sanitizedAnnexText = annexText ? sanitizeSensitiveData(annexText) : "";
    console.log(
      `Contract text sanitized. Original: ${contractText.length} chars, Sanitized: ${sanitizedContractText.length} chars`,
    );

    // Search legal knowledge base with enhanced query and territorial filter
    const { data: generalChunks } = await supabase.rpc("search_legal_chunks", {
      search_query: searchQuery,
      match_count: 20,
      territorial_filter: territorialFilter,
    });

    // Semantic search with categories
    let semanticChunks: any[] = [];
    if (semanticCategories.length > 0) {
      const { data: semChunks } = await supabase.rpc("search_legal_chunks_semantic", {
        search_query: searchQuery,
        semantic_categories: semanticCategories,
        municipality_name: detectedMunicipality,
        province_name: detectedProvince,
        match_count: 15,
      });
      semanticChunks = semChunks || [];
      console.log(
        `Semantic search found ${semanticChunks.length} chunks for categories [${semanticCategories.join(", ")}]`,
      );
    }

    // Búsqueda específica por ubicación (municipio/provincia)
    let locationChunks: any[] = [];
    if (detectedMunicipality || detectedProvince) {
      const { data: locChunks } = await supabase.rpc("search_legal_chunks_by_location", {
        search_query: "zona mercado residencial tensionado límite renta precio índice referencia municipal",
        municipality_name: detectedMunicipality,
        province_name: detectedProvince,
        match_count: 15,
      });
      locationChunks = locChunks || [];
      console.log(
        `Location-specific search found ${locationChunks.length} chunks for ${detectedMunicipality || detectedProvince}`,
      );
    }

    // Combine and deduplicate chunks
    const allChunksMap = new Map<string, any>();

    // Add general chunks
    (generalChunks || []).forEach((chunk: any) => {
      allChunksMap.set(chunk.id, chunk);
    });

    // Add semantic chunks
    semanticChunks.forEach((chunk: any) => {
      chunk.is_semantic_match = true;
      allChunksMap.set(chunk.id, chunk);
    });

    // Add location-specific chunks (may override with higher priority)
    locationChunks.forEach((chunk: any) => {
      // Mark location chunks as high priority
      chunk.is_location_match = true;
      allChunksMap.set(chunk.id, chunk);
    });

    const combinedChunks = Array.from(allChunksMap.values());

    // Sort: location matches first, then semantic, then by rank
    combinedChunks.sort((a, b) => {
      if (a.is_location_match && !b.is_location_match) return -1;
      if (!a.is_location_match && b.is_location_match) return 1;
      if (a.is_semantic_match && !b.is_semantic_match) return -1;
      if (!a.is_semantic_match && b.is_semantic_match) return 1;
      return (b.rank || 0) - (a.rank || 0);
    });

    // Build legal context with verification metadata
    let legalContext = "";
    let hasLegalContext = false;
    const availableSources: string[] = [];
    let hasZonaTensionadaInfo = false;

    if (combinedChunks.length > 0) {
      hasLegalContext = true;
      const uniqueSources = new Set<string>();

      legalContext = combinedChunks
        .slice(0, 30)
        .map((chunk: any) => {
          uniqueSources.add(chunk.document_title);

          // Check if this chunk contains zona tensionada info
          if (
            chunk.content?.toLowerCase().includes("tensionado") ||
            chunk.content?.toLowerCase().includes("tensionada") ||
            (chunk.affected_municipalities && chunk.affected_municipalities.length > 0)
          ) {
            hasZonaTensionadaInfo = true;
          }

          const municipalitiesInfo =
            chunk.affected_municipalities?.length > 0
              ? `\nMunicipios afectados: ${chunk.affected_municipalities.slice(0, 20).join(", ")}${chunk.affected_municipalities.length > 20 ? "..." : ""}`
              : "";
          const locationMatch = chunk.is_location_match ? " [COINCIDENCIA DE UBICACIÓN]" : "";

          return `[FUENTE: ${chunk.document_title}]${locationMatch}
${chunk.article_reference ? `Artículo: ${chunk.article_reference}` : ""}
${chunk.section_title ? `Sección: ${chunk.section_title}` : ""}
${chunk.territorial_scope ? `Ámbito: ${chunk.territorial_scope}` : ""}${municipalitiesInfo}
Contenido: ${chunk.content}
---`;
        })
        .join("\n\n");

      availableSources.push(...Array.from(uniqueSources));
      console.log(
        `Found ${combinedChunks.length} legal chunks from ${availableSources.length} sources (${locationChunks.length} location-specific)`,
      );
    } else {
      legalContext =
        "AVISO: No se encontraron documentos legales indexados relevantes para este contrato. El análisis se basará en conocimiento general de la LAU y normativa aplicable, pero las referencias NO están verificadas contra la base de datos de ContratoAlquiler.";
      console.log("No legal chunks found - using general knowledge");
    }

    const failAnalysis = async (status: number, payload: Record<string, unknown>) => {
      if (creditConsumed) {
        await supabase.rpc("refund_credit", { p_user_id: userId });
        creditConsumed = false;
      }
      await supabase.from("contracts").update({ status: "failed" }).eq("id", contractId);
      return new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    const systemPrompt = buildAnalysisSystemPrompt({
      perspective,
      tier: "paid",
      legalContext,
      hasLegalContext,
      availableSources,
      territorialFilter,
      detectedMunicipality,
      detectedProvince,
      hasZonaTensionadaInfo,
    });

    let pdfBase64: string | undefined;
    if (useNativePdf) {
      pdfBase64 = bytesToBase64(new Uint8Array(buffer));
    }

    const docSignalsBlock = `SEÑALES ESTRUCTURADAS DE DOCUMENTACIÓN OBLIGATORIA (usar como fuente de verdad):
- cédula de habitabilidad detectada: ${requiredDocSignals.hasCedulaHabitabilidad ? "SI" : "NO"}
- licencia primera/segunda ocupación detectada: ${requiredDocSignals.hasOccupancyLicense ? "SI" : "NO"}
- documento de habitabilidad (cédula o licencia) detectado: ${requiredDocSignals.hasHabitabilityDocument ? "SI" : "NO"}
- certificado/etiqueta de eficiencia energética detectado: ${requiredDocSignals.hasEnergyCertificate ? "SI" : "NO"}`;

    const userText = pdfBase64
      ? `Analiza el contrato de alquiler español. Identifica todas las cláusulas relevantes, clasifícalas y proporciona un análisis detallado siguiendo el formato JSON especificado.

El contrato completo va adjunto como documento PDF; usa el PDF como fuente principal y el texto extraído solo como apoyo.

NOTA: En el texto extraído algunos datos sensibles (DNI, IBAN, teléfonos) han sido anonimizados por motivos de privacidad. No los reproduzcas en tu respuesta.

${docSignalsBlock}
${
  lowQualityExtraction
    ? "\nLa extracción automática de texto fue de baja calidad, así que no se adjunta: trabaja solo con el PDF."
    : `
TEXTO EXTRAÍDO (apoyo):
=======================
${sanitizedContractText}`
}`
      : `Analiza el siguiente contrato de alquiler español. Identifica todas las cláusulas relevantes, clasifícalas y proporciona un análisis detallado siguiendo el formato JSON especificado.

Si el texto parece incompleto o parcialmente ilegible, analiza las partes que puedas identificar e indica las limitaciones.

NOTA: Algunos datos sensibles (DNI, IBAN, teléfonos) han sido anonimizados por motivos de privacidad. Esto no afecta al análisis de las cláusulas.

${docSignalsBlock}

REGLA DE ESTABILIDAD:
- Evalúa el contrato principal en base al bloque "CONTRATO BASE".
- Usa "ANEXOS" solo para validar documentación adicional (habitabilidad/energético), sin alterar de forma arbitraria el resto de categorías.

CONTRATO BASE (prioritario para el análisis de cláusulas):
==========================================================
${sanitizedCoreText}

ANEXOS / DOCUMENTACIÓN ADICIONAL (solo verificación documental):
===============================================================
${sanitizedAnnexText || "Sin anexos detectados o no diferenciables del cuerpo principal."}`;

    // deno-lint-ignore no-explicit-any
    let analysis: any = null;
    let usedProvider = "";
    let usedModel = "";
    for (let attempt = 1; attempt <= 2 && !analysis; attempt++) {
      try {
        const out = await callAnalysisModel({ systemPrompt, userText, pdfBase64, tier: "paid" });
        usedProvider = out.provider;
        usedModel = out.model;
        analysis = parseAnalysisJson(out.raw);
        if (!analysis || typeof analysis !== "object") throw new Error("JSON no es un objeto");
      } catch (err) {
        if (err instanceof AiProviderError) {
          console.error(`AI provider error (${err.provider}/${err.model}) ${err.status}:`, err.message.slice(0, 500));
          if (err.status === 429) {
            return await failAnalysis(429, {
              error: "Servicio temporalmente no disponible. Por favor, intenta de nuevo en unos minutos.",
            });
          }
          if (err.status === 402) {
            return await failAnalysis(402, { error: "Créditos de IA agotados. Por favor, contacta con soporte." });
          }
          return await failAnalysis(502, { error: "Error en el análisis de IA" });
        }
        analysis = null;
        console.error(`Parse error on attempt ${attempt}:`, err instanceof Error ? err.message : err);
      }
    }
    if (!analysis) {
      return await failAnalysis(502, {
        error: "El análisis no devolvió un resultado válido",
        code: "ANALYSIS_PARSE_ERROR",
      });
    }
    console.log(`Analysis generated by ${usedProvider}/${usedModel}`);

    const quoteCheck = verifyClauseQuotes(analysis, sanitizedContractText);
    console.log(`quotes_verified=${quoteCheck.verified} quotes_total=${quoteCheck.total}`);

    // Extract counts from new format or fallback to old format
    const clauses = analysis.clauses || [];
    const validCount = analysis.summary?.valid_count ?? clauses.filter((c: any) => c.type === "valid").length;
    const suspiciousCount =
      analysis.summary?.suspicious_count ?? clauses.filter((c: any) => c.type === "suspicious").length;
    const illegalCount = analysis.summary?.illegal_count ?? clauses.filter((c: any) => c.type === "illegal").length;

    // Add legal disclaimer based on database state
    if (!analysis.summary) {
      analysis.summary = {};
    }

    analysis.summary.legal_disclaimer =
      hasLegalContext && availableSources.length >= 3
        ? `Las referencias legales han sido verificadas contra ${availableSources.length} fuentes de nuestra base de datos jurídica.`
        : hasLegalContext && availableSources.length < 3
          ? `Análisis realizado con documentación parcial (${availableSources.length} fuente${availableSources.length > 1 ? "s" : ""}). Algunas referencias pueden requerir verificación adicional.`
          : "La base de datos legal de ContratoAlquiler está siendo ampliada. Las referencias citadas son de conocimiento general y se recomienda verificarlas con un profesional.";

    // Ensure contract_metadata exists
    if (!analysis.contract_metadata) {
      analysis.contract_metadata = {};
    }
    analysis.contract_metadata.legal_context_available = hasLegalContext;
    analysis.contract_metadata.sources_count = availableSources.length;
    analysis.contract_metadata.detected_territory = territorialFilter;
    analysis.contract_metadata.detected_language = languageDetection.detectedLanguage;
    analysis.contract_metadata.language_scores = { es: languageDetection.esScore, ca: languageDetection.caScore };
    analysis.contract_metadata.required_docs_detected = requiredDocSignals;
    analysis.contract_metadata.contract_split_applied = splitApplied;
    analysis.contract_metadata.perspective = perspective;
    analysis.contract_metadata.ai_provider = usedProvider;
    analysis.contract_metadata.ai_model = usedModel;
    analysis.perspective = perspective;

    // If there are problematic clauses (illegal or suspicious), generate a negotiation guide
    const problematicClauses = clauses.filter((c: any) => c.type === "illegal" || c.type === "suspicious");

    if (problematicClauses.length > 0) {
      const guidePrompt = buildNegotiationGuidePrompt(problematicClauses, analysis.summary, perspective);

      const guideResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODELS.GEMINI_FAST,
          temperature: 0.4,
          messages: [
            { role: "system", content: guidePrompt },
            {
              role: "user",
              content:
                "Genera los 2 documentos solicitados (informative_guide, email_draft) en JSON estricto, basados en las cláusulas reales detectadas.",
            },
          ],
        }),
      });

      if (guideResponse.ok) {
        const guideData = await guideResponse.json();
        const raw = guideData.choices?.[0]?.message?.content || "";
        const parsed = parseGuideResponse(raw);
        analysis.generated_letter = parsed.informative_guide;
        analysis.generated_email = parsed.email_draft;
        console.log(
          `[analyze-contract] Guide generated. guide=${!!parsed.informative_guide} email=${!!parsed.email_draft}`,
        );
      } else {
        console.warn("[analyze-contract] Guide generation failed:", await guideResponse.text());
      }
    }

    // Save results with enhanced data
    await supabase.from("analysis_results").insert({
      contract_id: contractId,
      total_clauses: clauses.length,
      valid_clauses: validCount,
      suspicious_clauses: suspiciousCount,
      illegal_clauses: illegalCount,
      full_report: analysis,
      summary: analysis.summary?.executive_summary || analysis.summary?.overall_assessment || "",
    });

    // Update contract status
    await supabase.from("contracts").update({ status: "completed" }).eq("id", contractId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";

    // Bug L: marcar el contract como failed para no dejar zombies en "processing".
    try {
      const body = await req.clone().json().catch(() => null);
      const cid = body?.contractId;
      if (cid) {
        const sb = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await sb.from("contracts").update({ status: "failed" }).eq("id", cid);
        // Devolver el crédito si ya se había descontado
        if (creditConsumed && userId) {
          await sb.rpc("refund_credit", { p_user_id: userId });
        }
      }
    } catch (cleanupErr) {
      console.warn("No se pudo marcar el contract como failed en catch:", cleanupErr);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

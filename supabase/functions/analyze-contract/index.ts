import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "https://esm.sh/mammoth@1.6.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getFileType(filePath: string, mimeType?: string): "pdf" | "docx" | "image" {
  if (mimeType?.includes("pdf") || filePath.toLowerCase().endsWith(".pdf")) return "pdf";
  if (mimeType?.includes("wordprocessingml") || filePath.toLowerCase().endsWith(".docx") || filePath.toLowerCase().endsWith(".doc")) return "docx";
  return "image";
}

// Extraer términos clave del contrato para búsqueda RAG contextual
function extractKeyTerms(text: string): string {
  const terms: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (/fianza|deposito|garantia|aval/.test(lowerText)) terms.push("fianza garantia deposito");
  if (/mensualidad|renta|euros|€|precio/.test(lowerText)) {
    terms.push("renta precio mensualidad");
    // Si hay indicios de precio/renta, añadir términos de zona tensionada
    terms.push("zona mercado residencial tensionado límite precio índice referencia");
  }
  if (/año|años|meses|duracion|prorroga|renovacion/.test(lowerText)) terms.push("duracion prorroga plazo");
  if (/obra|reforma|reparacion|mantenimiento|conservacion/.test(lowerText)) terms.push("obras reparaciones conservacion");
  if (/penalizacion|indemnizacion|resolucion|desistimiento/.test(lowerText)) terms.push("penalizacion resolucion desistimiento");
  if (/subarr|cesion|tercero/.test(lowerText)) terms.push("subarriendo cesion");
  if (/ibi|impuesto|comunidad|gastos/.test(lowerText)) terms.push("gastos impuestos comunidad");
  if (/inmobiliaria|honorarios|gestion/.test(lowerText)) terms.push("honorarios inmobiliaria");
  if (/mascota|animal|perro|gato/.test(lowerText)) terms.push("mascotas prohibicion");
  if (/seguro|responsabilidad/.test(lowerText)) terms.push("seguro responsabilidad");
  
  return terms.length > 0 ? terms.join(" ") : "arrendamiento vivienda clausula";
}

// Extraer el municipio del contrato
function extractMunicipality(text: string): string | null {
  // Patrones comunes en contratos para detectar ubicación
  const patterns = [
    // "situada en Cervera", "domicilio en Barcelona", etc.
    /(?:situada?\s+en|domicilio\s+en|ubicad[ao]\s+en|localidad\s+de|municipio\s+de|población\s+de|ciudad\s+de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|d['']|la|el|les|l['']|dels?)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    // "C.P. 25200 Cervera"
    /C\.?P\.?\s*\d{5}\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
    // "en Cervera (Lleida)" o "en Cervera, Lleida"
    /\ben\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)\s*[,(]\s*(?:provincia\s+(?:de\s+)?)?[A-ZÀ-Ú]/gi,
    // "finca sita en Cervera"
    /finca\s+sita\s+en\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:de(?:l)?|la|el)?\s*[A-ZÀ-Ú][a-zà-ú]+)*)/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        // Normalizar: primera letra mayúscula, resto minúscula
        const municipality = match[1].trim()
          .split(/\s+/)
          .map(word => {
            // Mantener preposiciones en minúscula
            if (/^(de|del|la|el|les|l['']|d['']|dels?)$/i.test(word)) {
              return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(' ');
        
        // Filtrar palabras comunes que no son municipios
        const excluded = ['calle', 'avenida', 'plaza', 'paseo', 'carrer', 'avinguda', 'plaça', 
                         'número', 'piso', 'puerta', 'escalera', 'portal', 'bloque'];
        if (!excluded.some(ex => municipality.toLowerCase().startsWith(ex))) {
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
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", 
    "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", 
    "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", 
    "Huesca", "Illes Balears", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", 
    "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", 
    "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", 
    "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const province of provinces) {
    // Buscar patrones como "provincia de Lleida", "(Lleida)", ", Lleida"
    const patterns = [
      new RegExp(`provincia\\s+de\\s+${province}`, 'i'),
      new RegExp(`\\(${province}\\)`, 'i'),
      new RegExp(`,\\s*${province}\\s*[,\\)]`, 'i'),
      new RegExp(`\\b${province}\\b`, 'i'),
    ];
    
    if (patterns.some(p => p.test(text))) {
      return province;
    }
  }
  
  return null;
}

// Detectar territorio para aplicar normativa autonómica
function detectTerritory(text: string): string | null {
  const territories: Record<string, string[]> = {
    "Cataluña": ["barcelona", "girona", "lleida", "tarragona", "catalunya", "cataluña", "catalan"],
    "Madrid": ["madrid"],
    "Andalucía": ["sevilla", "málaga", "malaga", "granada", "córdoba", "cordoba", "cádiz", "cadiz", "almería", "almeria", "huelva", "jaén", "jaen"],
    "Comunidad Valenciana": ["valencia", "alicante", "castellón", "castellon"],
    "País Vasco": ["bilbao", "san sebastián", "san sebastian", "vitoria", "euskadi", "vizcaya", "guipúzcoa"],
    "Galicia": ["a coruña", "coruña", "vigo", "santiago", "lugo", "ourense", "pontevedra"],
    "Canarias": ["tenerife", "gran canaria", "las palmas", "santa cruz"],
    "Baleares": ["mallorca", "ibiza", "menorca", "palma"],
    "Aragón": ["zaragoza", "huesca", "teruel"],
    "Castilla y León": ["valladolid", "burgos", "salamanca", "león", "leon"],
    "Castilla-La Mancha": ["toledo", "ciudad real", "albacete", "guadalajara", "cuenca"],
    "Murcia": ["murcia", "cartagena"],
    "Asturias": ["oviedo", "gijón", "gijon", "asturias"],
    "Navarra": ["pamplona", "navarra"],
    "Cantabria": ["santander", "cantabria"],
    "Extremadura": ["badajoz", "cáceres", "caceres"],
    "La Rioja": ["logroño", "rioja"]
  };
  
  const lowerText = text.toLowerCase();
  for (const [territory, keywords] of Object.entries(territories)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      return territory;
    }
  }
  return null;
}

// Anonimizar datos sensibles antes de enviar a la IA (protección de terceros)
function sanitizeSensitiveData(text: string): string {
  let sanitized = text;
  
  // Anonimizar DNI/NIE: 12345678A o X1234567A -> ****5678* o X***4567*
  sanitized = sanitized.replace(
    /\b([A-Z]?)(\d{7,8})([A-Z])\b/gi, 
    (match, prefix, digits, suffix) => {
      const visibleDigits = digits.slice(-4, -1);
      return prefix ? `${prefix}***${visibleDigits}*` : `****${visibleDigits}*`;
    }
  );
  
  // Anonimizar IBAN español: ES12 3456 7890 1234 5678 9012 -> ES** **** **** **** ****
  sanitized = sanitized.replace(
    /\b(ES)\s?(\d{2})\s?(\d{4})\s?(\d{4})\s?(\d{4})\s?(\d{4})\s?(\d{4})\b/gi,
    '[IBAN-ANONIMIZADO]'
  );
  
  // Anonimizar otros IBAN europeos
  sanitized = sanitized.replace(
    /\b([A-Z]{2})\s?(\d{2})\s?([\d\s]{10,30})\b/gi,
    (match, country, check, account) => {
      if (/^[A-Z]{2}$/.test(country) && account.replace(/\s/g, '').length >= 10) {
        return '[IBAN-ANONIMIZADO]';
      }
      return match;
    }
  );
  
  // Anonimizar números de cuenta bancaria (20 dígitos españoles)
  sanitized = sanitized.replace(
    /\b(\d{4})\s?(\d{4})\s?(\d{2})\s?(\d{10})\b/g,
    '[CUENTA-ANONIMIZADA]'
  );
  
  // Anonimizar teléfonos españoles: +34 612 345 678 o 612345678 -> +34 6** *** ***
  sanitized = sanitized.replace(
    /(\+34\s?)?([6789])(\d{2})\s?(\d{3})\s?(\d{3})/g,
    (match, prefix, first, rest1, rest2, rest3) => {
      return `${prefix || ''}${first}** *** ***`;
    }
  );
  
  // Anonimizar teléfonos fijos españoles: 91 234 56 78 -> 9* *** ** **
  sanitized = sanitized.replace(
    /\b([89]\d)\s?(\d{3})\s?(\d{2})\s?(\d{2})\b/g,
    (match, prefix) => `${prefix[0]}* *** ** **`
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
    .filter(segment => segment.length > 10)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
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
      model: "google/gemini-2.5-flash",
      messages: [{
        role: "user",
        content: [
          { 
            type: "text", 
            text: "Transcribe TODO el texto visible en esta imagen de un contrato de alquiler español. Extrae el texto completo manteniendo la estructura del documento. Si hay varias páginas o secciones, transcríbelas todas. Devuelve SOLO el texto transcrito sin comentarios adicionales." 
          },
          { 
            type: "image_url", 
            image_url: { url: `data:${mimeType};base64,${base64}` } 
          }
        ]
      }]
    }),
  });

  if (!response.ok) {
    throw new Error("Error al procesar la imagen con OCR");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Construir el prompt de sistema optimizado
function buildSystemPrompt(
  legalContext: string, 
  hasLegalContext: boolean, 
  availableSources: string[], 
  territorialFilter: string | null,
  detectedMunicipality: string | null,
  detectedProvince: string | null,
  hasZonaTensionadaInfo: boolean
): string {
  // Sección especial para zonas tensionadas si se detectó municipio
  const zonaTensionadaSection = detectedMunicipality ? `
VERIFICACIÓN DE ZONA TENSIONADA (CRÍTICO)
==========================================
Municipio detectado en el contrato: ${detectedMunicipality}
${detectedProvince ? `Provincia: ${detectedProvince}` : ''}
${territorialFilter ? `Comunidad Autónoma: ${territorialFilter}` : ''}

${hasZonaTensionadaInfo ? `⚠️ HAY INFORMACIÓN DE ZONAS TENSIONADAS EN EL CONTEXTO LEGAL.
INSTRUCCIONES OBLIGATORIAS:
1. BUSCA en el contexto si "${detectedMunicipality}" aparece en alguna lista de municipios tensionados
2. Si el municipio ESTÁ en zona tensionada:
   - OBLIGATORIO: Añade una cláusula con category: "RENTA Y ACTUALIZACIONES"
   - Clasifícala como type: "suspicious" (NO "illegal", porque no podemos calcular el precio máximo automáticamente)
   - En "explanation": Indica que el inmueble se encuentra en una zona de mercado residencial tensionado 
     y que la renta puede estar sujeta a límites legales que dependen de factores específicos 
     (características del inmueble, año de construcción, superficie útil, etc.)
   - En "recommendation": Incluir SIEMPRE este texto exacto:
     "Verifique la renta máxima aplicable a este inmueble en el Sistema Estatal de Referencia de Precios: https://serpavi.mivau.gob.es/"
   - En "negotiation_tip": Explicar que pueden solicitar al propietario justificación del precio conforme al índice de referencia
3. IMPORTANTE: NO podemos determinar automáticamente si la renta es abusiva porque el cálculo 
   requiere parámetros que no están en el contrato (año construcción, superficie útil, calidades, etc.)
` : `
No se encontró información específica de zonas tensionadas en la base de datos.
Si la renta parece muy elevada para la zona, indica en "recommendation" que puede verificarse 
la aplicabilidad de límites de renta en: https://serpavi.mivau.gob.es/
`}
` : '';

  const legalContextSection = hasLegalContext
    ? `DOCUMENTOS LEGALES INDEXADOS EN LA BASE DE DATOS ACROXIA
===========================================================
Fuentes disponibles: ${availableSources.join(", ")}
Territorio detectado: ${territorialFilter || "No detectado (se aplicará normativa estatal)"}

CONTEXTO LEGAL VERIFICADO (extraído de la base de datos):
${legalContext}

INSTRUCCIONES CRÍTICAS DE CITACIÓN:
- SOLO puedes marcar "verified": true si el artículo aparece LITERALMENTE en el contexto anterior
- Si citas por conocimiento general pero NO está en el contexto, marca "verified": false
- Incluye "verification_note" explicando el estado de verificación`
    : `AVISO IMPORTANTE SOBRE LA BASE DE DATOS LEGAL
===============================================
La base de datos legal de ACROXIA está siendo ampliada progresivamente con nueva legislación y jurisprudencia.
Actualmente no se encontraron documentos indexados específicos para este análisis.

${legalContext}

INSTRUCCIONES PARA ESTE CASO:
- Todas las referencias legales DEBEN tener "verified": false
- Añade "verification_note": "Referencia basada en conocimiento general - pendiente de indexación en base de datos"
- Sé conservador en las afirmaciones y recomienda consultar con un profesional`;

  return `IDENTIDAD Y ROL
===============
Eres el sistema de análisis legal de ACROXIA, la plataforma española líder en protección de inquilinos. Tu misión es analizar contratos de alquiler de vivienda habitual identificando cláusulas ilegales, abusivas o sospechosas con el máximo rigor jurídico.

${zonaTensionadaSection}

${legalContextSection}

MARCO LEGAL DE REFERENCIA (conocimiento base - usar solo si no hay contexto verificado)
========================================================================================
- Ley 29/1994, de 24 de noviembre, de Arrendamientos Urbanos (LAU)
- Ley 12/2023, de 24 de mayo, por el derecho a la vivienda
- Real Decreto-ley 7/2019, de medidas urgentes en materia de vivienda
- Código Civil español (artículos 1542-1582)
- Normativa autonómica según territorio del inmueble

CATEGORÍAS DE CLÁUSULAS A ANALIZAR (analiza TODAS)
===================================================

1. DURACIÓN Y PRÓRROGAS
   - Duración mínima legal: 5 años (arrendador persona física) / 7 años (persona jurídica)
   - Prórrogas tácitas obligatorias: 3 años adicionales
   - Derecho de desistimiento del inquilino: tras 6 meses, con 30 días de preaviso
   - Recuperación de vivienda por necesidad del arrendador

2. RENTA Y ACTUALIZACIONES
   - Precio inicial y forma de pago
   - Sistema de actualización: nuevo índice de referencia (no IPC desde 2022)
   - Límites en zonas de mercado tensionado (Ley 12/2023)
   - Prohibición de repercutir gastos de gestión al inquilino

3. FIANZA Y GARANTÍAS ADICIONALES
   - Fianza legal obligatoria: exactamente 1 mensualidad (Art. 36.1 LAU)
   - Garantías adicionales: máximo 2 mensualidades (Art. 36.5 LAU, reforma 2019)
   - Total máximo legal: 3 mensualidades (1 fianza + 2 garantías)
   - Depósito obligatorio en organismo autonómico

4. GASTOS E IMPUESTOS
   - IBI: corresponde al arrendador (salvo pacto expreso en persona jurídica >7 años)
   - Comunidad de propietarios: pacto expreso necesario
   - Tasas de basuras: repercutible con pacto
   - Alta de suministros y contadores: a cargo del arrendador

5. HONORARIOS DE GESTIÓN INMOBILIARIA
   - SIEMPRE a cargo del arrendador cuando es persona jurídica (Art. 20.1 LAU)
   - Nula cualquier cláusula que repercuta honorarios al inquilino

6. OBRAS Y REPARACIONES
   - Obras de conservación: obligación del arrendador (Art. 21 LAU)
   - Pequeñas reparaciones por uso ordinario: inquilino (Art. 21.4 LAU)
   - Obras de mejora: derecho a reducción de renta proporcional (Art. 22 LAU)
   - Prohibición de obras que modifiquen configuración: legal con consentimiento

7. CESIÓN Y SUBARRIENDO
   - Cesión total: prohibida sin consentimiento escrito
   - Subarriendo parcial: requiere consentimiento del arrendador (Art. 8 LAU)
   - Precio del subarriendo: no puede exceder el alquiler principal

8. ACCESO A LA VIVIENDA
   - Inviolabilidad del domicilio (Art. 18 Constitución Española)
   - Visitas para venta/nuevo alquiler: requiere acuerdo y preaviso razonable
   - Entrada para reparaciones urgentes: solo en caso de emergencia

9. RESOLUCIÓN Y CAUSAS DE EXTINCIÓN
   - Causas tasadas de resolución por el arrendador (Art. 27 LAU)
   - Resolución por impago de renta o fianza
   - Resolución por actividades molestas, insalubres o ilícitas
   - Causas que NO pueden pactarse: desahucios exprés unilaterales

10. PENALIZACIONES Y DESISTIMIENTO
    - Penalización máxima por desistimiento: 1 mensualidad por año restante (Art. 11 LAU)
    - Penalizaciones superiores: NULAS
    - Cláusulas penales desproporcionadas: abusivas

11. DERECHOS IRRENUNCIABLES DEL INQUILINO
    - Art. 6 LAU: nulidad de estipulaciones que modifiquen en perjuicio del arrendatario
    - Renuncia anticipada a prórrogas: NULA
    - Renuncia a tanteo/retracto: generalmente NULA
    - Sometimiento a tribunales distintos: potencialmente abusivo

12. DEVOLUCIÓN DE FIANZA
    - Plazo máximo de devolución: 1 mes desde entrega de llaves (Art. 36.4 LAU)
    - Retenciones solo por daños acreditados o rentas impagadas
    - Interés legal del dinero si hay retraso injustificado

13. ESTADO DE LA VIVIENDA E INVENTARIO
    - Entrega en condiciones de habitabilidad
    - Inventario y estado inicial documentado
    - Cédula de habitabilidad/certificado energético obligatorios
    - Responsabilidad por vicios ocultos

14. SEGUROS Y RESPONSABILIDAD
    - Seguro de hogar: no obligatorio para inquilino (pacto posible)
    - Responsabilidad civil por daños a terceros
    - Cláusulas de exoneración de responsabilidad del arrendador: potencialmente abusivas

15. CLÁUSULAS ESPECIALES Y RESTRICCIONES
    - Prohibición absoluta de mascotas: potencialmente abusiva si es desproporcionada
    - Restricciones de uso habitual: deben ser razonables
    - Derecho de adquisición preferente (tanteo y retracto): Art. 25 LAU
    - Cláusulas sobre visitas de familiares: ilegales si limitan uso normal

SISTEMA DE CLASIFICACIÓN
=========================

TIPO DE CLÁUSULA:
- "valid": Conforme a derecho, equilibrada, no perjudica al inquilino
- "suspicious": Ambigua, redacción poco clara, potencialmente problemática, requiere revisión profesional
- "illegal": Contraviene claramente la LAU, Código Civil o normativa aplicable - NULA de pleno derecho

NIVEL DE RIESGO (1-10):
- 1-3 (BAJO): Cláusula válida o con mínimo riesgo
- 4-6 (MEDIO): Requiere atención, negociable antes de firmar
- 7-8 (ALTO): Probablemente ilegal, no firmar sin modificar
- 9-10 (CRÍTICO): Claramente ilegal, nula de pleno derecho, riesgo grave para el inquilino

FORMATO DE RESPUESTA JSON (OBLIGATORIO)
========================================
Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:

{
  "contract_metadata": {
    "detected_territory": "string o null",
    "contract_type": "vivienda_habitual | temporal | uso_distinto | desconocido",
    "landlord_type": "persona_fisica | persona_juridica | desconocido",
    "estimated_risk_score": número 1-10,
    "legal_context_available": boolean
  },
  "clauses": [
    {
      "category": "una de las 15 categorías",
      "title": "título descriptivo corto (máx 60 caracteres)",
      "original_text": "extracto LITERAL del contrato (máx 200 caracteres)",
      "type": "valid | suspicious | illegal",
      "risk_level": número 1-10,
      "explanation": "explicación clara para no juristas (máx 150 palabras)",
      "legal_reference": {
        "article": "Art. XX o null",
        "law": "LAU | Código Civil | Ley 12/2023 | Normativa autonómica | null",
        "full_citation": "cita completa o null",
        "verified": boolean,
        "verification_note": "nota si verified es false"
      },
      "recommendation": "acción recomendada para el inquilino",
      "negotiation_tip": "consejo práctico de negociación o null"
    }
  ],
  "summary": {
    "total_analyzed": número,
    "valid_count": número,
    "suspicious_count": número,
    "illegal_count": número,
    "critical_issues": ["lista de los 3-5 problemas más graves"],
    "overall_risk": "bajo | medio | alto | critico",
    "executive_summary": "resumen ejecutivo de 2-3 oraciones para el inquilino",
    "recommendation": "firmar | negociar_antes_de_firmar | no_firmar | consultar_abogado",
    "legal_disclaimer": "nota sobre el estado de verificación de las referencias"
  }
}

REGLAS DE ORO (OBLIGATORIAS)
=============================
1. El campo "original_text" DEBE contener texto LITERAL del contrato, no tu interpretación
2. ORDENA las cláusulas por risk_level DESCENDENTE (críticas primero)
3. NUNCA inventes artículos o números de ley que no conozcas con certeza
4. Si no encuentras algo en el contexto legal, marca verified: false y explica en verification_note
5. Adapta el lenguaje para personas SIN formación jurídica
6. Sé CONSERVADOR: ante la duda, "suspicious" es mejor que "valid"
7. Si detectas contrato temporal/de temporada, indica que aplican reglas diferentes
8. Identifica un MÍNIMO de 8-10 cláusulas relevantes del contrato
9. Incluye SIEMPRE un legal_disclaimer en el summary indicando el estado de la base de datos`;
}

// Construir prompt para guía de negociación amigable (reemplaza carta de reclamación)
function buildNegotiationGuidePrompt(problematicClauses: any[], summary: any): string {
  const clausesList = problematicClauses.map((c, i) => `
${i + 1}. CLÁUSULA: "${c.original_text || c.text}"
   - Tipo: ${c.type === 'illegal' ? 'Potencialmente ilegal' : 'Sospechosa/Negociable'}
   - Categoría: ${c.category || "General"}
   - Problema: ${c.explanation}
   - Nivel de riesgo: ${c.risk_level || 'No especificado'}/10
`).join("\n");

  return `IDENTIDAD Y TONO
================
Eres un amigo con conocimientos legales que ayuda a inquilinos a negociar con sus propietarios de forma CONSTRUCTIVA y EFECTIVA. Tu objetivo es que el inquilino consiga mejores condiciones mientras mantiene una buena relación con el propietario.

TONO OBLIGATORIO:
- Cercano y empático, como un amigo que te aconseja
- Nunca amenazante ni intimidante
- Enfocado en el beneficio mutuo (win-win)
- Práctico y accionable
- Evita jerga legal innecesaria

CLÁUSULAS PROBLEMÁTICAS DETECTADAS
==================================
${clausesList}

CONTEXTO DEL ANÁLISIS
=====================
- Riesgo general del contrato: ${summary?.overall_risk || 'medio'}
- Recomendación del sistema: ${summary?.recommendation || 'negociar_antes_de_firmar'}

ESTRUCTURA DE LA GUÍA (OBLIGATORIO)
===================================

# TU GUÍA DE NEGOCIACIÓN

## 📋 RESUMEN DE TU SITUACIÓN

[2-3 frases en primera persona describiendo la situación general del contrato. Ej: "Tu contrato tiene algunos puntos que deberías comentar con el propietario antes de firmar. Nada grave, pero es importante que los conozcas y negocies."]

## 🎯 PUNTOS CLAVE A NEGOCIAR

[Lista numerada de los puntos más importantes, máximo 5, ordenados por importancia]

1. **[Título corto del problema]**
   Qué dice: [extracto breve]
   Por qué importa: [explicación simple, 1-2 frases]
   
[Repetir para cada punto clave]

## 💬 CÓMO ABORDAR LA CONVERSACIÓN

### Antes de hablar con el propietario

- Elige un buen momento (no cuando esté ocupado o estresado)
- Ten el contrato a mano para señalar los puntos
- Prepárate para escuchar su perspectiva
- Mantén un tono cordial en todo momento

### Frase para empezar la conversación

"Hola [nombre del propietario], he estado revisando el contrato con calma y hay algunos puntos que me gustaría comentar contigo. No es nada grave, pero creo que podríamos ajustar un par de cosas para que los dos estemos más tranquilos."

## 📝 SCRIPTS PARA CADA PUNTO

[Para CADA cláusula problemática, generar una sección así:]

### [Número]. [Título del problema]

**Lo que dice el contrato:**
> "[Extracto literal de la cláusula]"

**El problema en palabras simples:**
[Explicación muy clara de por qué esto es un problema, sin jerga legal]

**Cómo plantearlo:**
"[Script de conversación natural que el inquilino puede usar literalmente. Debe ser conversacional, no formal. Incluir posibles respuestas a objeciones del propietario.]"

**Solución razonable:**
[Propuesta concreta de modificación que beneficie a ambas partes]

**Si el propietario se niega:**
[Qué hacer si no acepta, manteniendo tono constructivo]

---

[Repetir para cada cláusula]

## 🤝 CONSEJOS FINALES

- **Documenta todo**: Si acordáis cambios, pídele que los ponga por escrito en un anexo al contrato
- **Sé flexible**: Prioriza los puntos más importantes y cede en los menores
- **Mantén la calma**: Una buena relación con el propietario te beneficia a largo plazo
- **No tengas miedo**: Es normal negociar contratos, los buenos propietarios lo entienden

## ❓ SI NO LLEGÁIS A UN ACUERDO

Si después de hablar no conseguís poneros de acuerdo en puntos importantes:

1. **Valora si el piso merece la pena** con esas condiciones
2. **Consulta con una asociación de inquilinos** de tu zona (suelen ser gratuitas)
3. **Busca una segunda opinión profesional** si el importe del alquiler es alto

## ℹ️ NOTA IMPORTANTE

Esta guía es orientativa y está pensada para ayudarte en una negociación amistosa. Si la situación se complica o necesitas reclamar formalmente, te recomendamos consultar con un profesional del derecho.

---
Generado con ACROXIA · Tu aliado en el alquiler
Esta guía tiene carácter informativo. Para asesoramiento legal vinculante, consulta con un abogado colegiado.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, filePath, fileType: mimeType } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("contracts")
      .download(filePath);

    if (downloadError) throw downloadError;

    // Determine file type and extract text
    const detectedType = getFileType(filePath, mimeType);
    const buffer = await fileData.arrayBuffer();
    let contractText = "";

    console.log(`Processing file as: ${detectedType}`);

    switch (detectedType) {
      case "pdf":
        contractText = await extractPdfText(buffer);
        // Fallback if extraction was poor
        if (contractText.length < 500) {
          const fallbackText = await fileData.text();
          if (fallbackText.length > contractText.length) {
            contractText = fallbackText;
          }
        }
        break;
      case "docx":
        contractText = await extractDocxText(buffer);
        break;
      case "image":
        contractText = await extractImageText(buffer, mimeType || "image/jpeg", lovableApiKey);
        break;
    }

    console.log(`Extracted ${contractText.length} characters from ${detectedType}`);

    // Extract key terms and detect territory for enhanced RAG search
    const keyTerms = extractKeyTerms(contractText);
    const territorialFilter = detectTerritory(contractText);
    const detectedMunicipality = extractMunicipality(contractText);
    const detectedProvince = extractProvince(contractText);
    const searchQuery = `${keyTerms} arrendamiento vivienda habitual clausula ilegal abusiva LAU`;

    console.log(`RAG search query: ${searchQuery}`);
    console.log(`Detected territory: ${territorialFilter || "none"}`);
    console.log(`Detected municipality: ${detectedMunicipality || "none"}`);
    console.log(`Detected province: ${detectedProvince || "none"}`);

    // Sanitize sensitive data (DNI, IBAN, phone) before sending to AI
    const sanitizedContractText = sanitizeSensitiveData(contractText);
    console.log(`Contract text sanitized. Original: ${contractText.length} chars, Sanitized: ${sanitizedContractText.length} chars`);

    // Search legal knowledge base with enhanced query and territorial filter
    const { data: generalChunks } = await supabase.rpc("search_legal_chunks", {
      search_query: searchQuery,
      match_count: 20,
      territorial_filter: territorialFilter,
    });

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
      console.log(`Location-specific search found ${locationChunks.length} chunks for ${detectedMunicipality || detectedProvince}`);
    }

    // Combine and deduplicate chunks
    const allChunksMap = new Map<string, any>();
    
    // Add general chunks
    (generalChunks || []).forEach((chunk: any) => {
      allChunksMap.set(chunk.id, chunk);
    });
    
    // Add location-specific chunks (may override with higher priority)
    locationChunks.forEach((chunk: any) => {
      // Mark location chunks as high priority
      chunk.is_location_match = true;
      allChunksMap.set(chunk.id, chunk);
    });

    const combinedChunks = Array.from(allChunksMap.values());
    
    // Sort: location matches first, then by rank
    combinedChunks.sort((a, b) => {
      if (a.is_location_match && !b.is_location_match) return -1;
      if (!a.is_location_match && b.is_location_match) return 1;
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
      
      legalContext = combinedChunks.slice(0, 30).map((chunk: any) => {
        uniqueSources.add(chunk.document_title);
        
        // Check if this chunk contains zona tensionada info
        if (chunk.content?.toLowerCase().includes('tensionado') || 
            chunk.content?.toLowerCase().includes('tensionada') ||
            (chunk.affected_municipalities && chunk.affected_municipalities.length > 0)) {
          hasZonaTensionadaInfo = true;
        }
        
        const municipalitiesInfo = chunk.affected_municipalities?.length > 0 
          ? `\nMunicipios afectados: ${chunk.affected_municipalities.slice(0, 20).join(', ')}${chunk.affected_municipalities.length > 20 ? '...' : ''}`
          : '';
        const locationMatch = chunk.is_location_match ? ' [COINCIDENCIA DE UBICACIÓN]' : '';
        
        return `[FUENTE: ${chunk.document_title}]${locationMatch}
${chunk.article_reference ? `Artículo: ${chunk.article_reference}` : ""}
${chunk.section_title ? `Sección: ${chunk.section_title}` : ""}
${chunk.territorial_scope ? `Ámbito: ${chunk.territorial_scope}` : ""}${municipalitiesInfo}
Contenido: ${chunk.content}
---`;
      }).join("\n\n");
      
      availableSources.push(...Array.from(uniqueSources));
      console.log(`Found ${combinedChunks.length} legal chunks from ${availableSources.length} sources (${locationChunks.length} location-specific)`);
    } else {
      legalContext = "AVISO: No se encontraron documentos legales indexados relevantes para este contrato. El análisis se basará en conocimiento general de la LAU y normativa aplicable, pero las referencias NO están verificadas contra la base de datos de ACROXIA.";
      console.log("No legal chunks found - using general knowledge");
    }

    // Build optimized system prompt
    const systemPrompt = buildSystemPrompt(
      legalContext, 
      hasLegalContext, 
      availableSources, 
      territorialFilter,
      detectedMunicipality,
      detectedProvince,
      hasZonaTensionadaInfo
    );

    // Call Lovable AI for contract analysis with enhanced prompt
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Analiza el siguiente contrato de alquiler español. Identifica todas las cláusulas relevantes, clasifícalas y proporciona un análisis detallado siguiendo el formato JSON especificado.

Si el texto parece incompleto o parcialmente ilegible, analiza las partes que puedas identificar e indica las limitaciones.

NOTA: Algunos datos sensibles (DNI, IBAN, teléfonos) han sido anonimizados por motivos de privacidad. Esto no afecta al análisis de las cláusulas.

CONTRATO A ANALIZAR:
====================
${sanitizedContractText.substring(0, 25000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Servicio temporalmente no disponible. Por favor, intenta de nuevo en unos minutos." 
        }), { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos de IA agotados. Por favor, contacta con soporte." 
        }), { 
          status: 402, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      throw new Error("Error en el análisis de IA");
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "{}";
    
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : analysisText);
    } catch {
      console.error("Failed to parse AI response:", analysisText);
      analysis = { 
        clauses: [], 
        summary: { 
          overall_risk: "desconocido",
          executive_summary: analysisText,
          recommendation: "consultar_abogado"
        },
        contract_metadata: {
          legal_context_available: hasLegalContext
        }
      };
    }

    // Extract counts from new format or fallback to old format
    const clauses = analysis.clauses || [];
    const validCount = analysis.summary?.valid_count ?? clauses.filter((c: any) => c.type === "valid").length;
    const suspiciousCount = analysis.summary?.suspicious_count ?? clauses.filter((c: any) => c.type === "suspicious").length;
    const illegalCount = analysis.summary?.illegal_count ?? clauses.filter((c: any) => c.type === "illegal").length;

    // Add legal disclaimer based on database state
    if (!analysis.summary) {
      analysis.summary = {};
    }
    
    analysis.summary.legal_disclaimer = hasLegalContext && availableSources.length >= 3
      ? `Las referencias legales han sido verificadas contra ${availableSources.length} fuentes de nuestra base de datos jurídica.`
      : hasLegalContext && availableSources.length < 3
      ? `Análisis realizado con documentación parcial (${availableSources.length} fuente${availableSources.length > 1 ? 's' : ''}). Algunas referencias pueden requerir verificación adicional.`
      : "La base de datos legal de ACROXIA está siendo ampliada. Las referencias citadas son de conocimiento general y se recomienda verificarlas con un profesional.";

    // Ensure contract_metadata exists
    if (!analysis.contract_metadata) {
      analysis.contract_metadata = {};
    }
    analysis.contract_metadata.legal_context_available = hasLegalContext;
    analysis.contract_metadata.sources_count = availableSources.length;
    analysis.contract_metadata.detected_territory = territorialFilter;

    // If there are problematic clauses (illegal or suspicious), generate a negotiation guide
    const problematicClauses = clauses.filter((c: any) => c.type === "illegal" || c.type === "suspicious");
    
    if (problematicClauses.length > 0) {
      const guidePrompt = buildNegotiationGuidePrompt(problematicClauses, analysis.summary);
      
      const guideResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: guidePrompt
            },
            {
              role: "user",
              content: `Genera una guía de negociación amigable y práctica para el inquilino. Incluye todos los puntos problemáticos detectados con scripts de conversación naturales y consejos prácticos. El tono debe ser cercano, como si fueras un amigo con conocimientos legales.`
            }
          ],
        }),
      });

      if (guideResponse.ok) {
        const guideData = await guideResponse.json();
        analysis.generated_letter = guideData.choices?.[0]?.message?.content || null;
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

    // Deduct credit - skip for admin users
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        // Check if user is admin
        const { data: isAdmin } = await supabase.rpc("is_admin", { check_user_id: user.id });
        
        if (isAdmin) {
          console.log(`Admin user ${user.id} - no credit deducted`);
        } else {
          await supabase.rpc("decrement_credit", { user_id: user.id });
          console.log(`Credit deducted for user ${user.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

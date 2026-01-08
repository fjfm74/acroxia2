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
  if (/mensualidad|renta|euros|€|precio/.test(lowerText)) terms.push("renta precio mensualidad");
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
  territorialFilter: string | null
): string {
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

// Construir prompt para carta de reclamación
function buildLetterPrompt(illegalClauses: any[]): string {
  const clausesList = illegalClauses.map((c, i) => `
${i + 1}. CLÁUSULA: "${c.original_text || c.text}"
   - Categoría: ${c.category || "General"}
   - Motivo de ilegalidad: ${c.explanation}
   - Referencia legal: ${c.legal_reference?.full_citation || "Normativa de arrendamientos aplicable"}
   - Verificada en BD: ${c.legal_reference?.verified ? "Sí" : "No (usar fórmula general)"}
`).join("\n");

  return `IDENTIDAD
=========
Eres el asistente legal de ACROXIA, especializado en redactar cartas de reclamación formales para inquilinos que han identificado cláusulas ilegales en sus contratos de alquiler.

CLÁUSULAS ILEGALES DETECTADAS EN EL CONTRATO
=============================================
${clausesList}

INSTRUCCIONES DE REDACCIÓN
===========================
1. Tono: Formal, respetuoso pero FIRME. No agresivo ni amenazante.
2. Para cláusulas con referencia legal verificada: cita el artículo específico
3. Para cláusulas SIN verificación: usa fórmulas generales como "conforme a la legislación vigente en materia de arrendamientos urbanos"
4. Lenguaje claro y accesible, evitando jerga legal innecesaria

ESTRUCTURA DE LA CARTA
=======================

1. ENCABEZADO
   [LUGAR], a [FECHA_ACTUAL]
   
   De: [NOMBRE_INQUILINO]
       [DNI_INQUILINO]
       [DIRECCIÓN_VIVIENDA]
   
   A: [NOMBRE_ARRENDADOR]
      Arrendador del inmueble
   
2. ASUNTO
   "COMUNICACIÓN FORMAL: Cláusulas nulas en contrato de arrendamiento de vivienda"

3. CUERPO
   a) INTRODUCCIÓN: Identificar el contrato (fecha aproximada, dirección del inmueble)
   
   b) EXPOSICIÓN: Lista NUMERADA de cada cláusula ilegal:
      - Transcripción literal de la cláusula
      - Fundamento jurídico de su nulidad
      - Por qué perjudica al inquilino
   
   c) PETICIÓN: Solicitud formal de:
      - Reconocimiento de la nulidad de dichas cláusulas
      - No aplicación de las mismas
      - Modificación del contrato si procede
   
   d) ADVERTENCIA: Reserva del derecho de:
      - Acudir a las autoridades de consumo
      - Ejercitar acciones judiciales
      - Reclamar daños y perjuicios si corresponde

4. DESPEDIDA
   "En espera de su respuesta en el plazo máximo de 15 días, le saluda atentamente,"
   
   [FIRMA_INQUILINO]
   [NOMBRE_INQUILINO]

5. PIE DE PÁGINA
   "---
   Carta generada con ACROXIA - Tu escudo legal
   Este documento tiene carácter informativo. Para procedimientos judiciales, consulte con un abogado colegiado.
   Se recomienda enviar esta comunicación por burofax o correo certificado con acuse de recibo."

FÓRMULAS LEGALES ESTÁNDAR A UTILIZAR
=====================================
- "En virtud del artículo X de la Ley Y..."
- "Dicha cláusula resulta nula de pleno derecho conforme a..."
- "Le requiero formalmente para que proceda a..."
- "Me reservo expresamente el derecho de ejercitar las acciones legales que me correspondan..."
- "Según lo establecido en la legislación vigente en materia de arrendamientos urbanos..."

PLACEHOLDERS QUE DEBE MANTENER
===============================
[LUGAR] - Ciudad del inmueble o "En [ciudad]"
[FECHA_ACTUAL] - Fecha actual en formato largo
[NOMBRE_INQUILINO] - Nombre completo del inquilino
[DNI_INQUILINO] - DNI/NIE del inquilino
[DIRECCIÓN_VIVIENDA] - Dirección completa del inmueble arrendado
[NOMBRE_ARRENDADOR] - Nombre del arrendador/propietario
[FIRMA_INQUILINO] - Espacio para firma`;
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
    const searchQuery = `${keyTerms} arrendamiento vivienda habitual clausula ilegal abusiva LAU`;

    console.log(`RAG search query: ${searchQuery}`);
    console.log(`Detected territory: ${territorialFilter || "none"}`);

    // Search legal knowledge base with enhanced query
    const { data: legalChunks } = await supabase.rpc("search_legal_chunks", {
      search_query: searchQuery,
      match_count: 25,
    });

    // Build legal context with verification metadata
    let legalContext = "";
    let hasLegalContext = false;
    const availableSources: string[] = [];

    if (legalChunks && legalChunks.length > 0) {
      hasLegalContext = true;
      const uniqueSources = new Set<string>();
      
      legalContext = legalChunks.map((chunk: any) => {
        uniqueSources.add(chunk.document_title);
        return `[FUENTE: ${chunk.document_title}]
${chunk.article_reference ? `Artículo: ${chunk.article_reference}` : ""}
${chunk.section_title ? `Sección: ${chunk.section_title}` : ""}
Contenido: ${chunk.content}
---`;
      }).join("\n\n");
      
      availableSources.push(...Array.from(uniqueSources));
      console.log(`Found ${legalChunks.length} legal chunks from ${availableSources.length} sources`);
    } else {
      legalContext = "AVISO: No se encontraron documentos legales indexados relevantes para este contrato. El análisis se basará en conocimiento general de la LAU y normativa aplicable, pero las referencias NO están verificadas contra la base de datos de ACROXIA.";
      console.log("No legal chunks found - using general knowledge");
    }

    // Build optimized system prompt
    const systemPrompt = buildSystemPrompt(legalContext, hasLegalContext, availableSources, territorialFilter);

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

CONTRATO A ANALIZAR:
====================
${contractText.substring(0, 25000)}`
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

    // If there are illegal clauses, generate a claim letter with enhanced prompt
    if (illegalCount > 0) {
      const illegalClauses = clauses.filter((c: any) => c.type === "illegal");
      const letterPrompt = buildLetterPrompt(illegalClauses);
      
      const letterResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: letterPrompt
            },
            {
              role: "user",
              content: `Genera una carta de reclamación formal profesional para el inquilino, incluyendo todas las cláusulas ilegales listadas. La carta debe estar lista para enviar (solo requiere rellenar los datos personales entre corchetes).`
            }
          ],
        }),
      });

      if (letterResponse.ok) {
        const letterData = await letterResponse.json();
        analysis.generated_letter = letterData.choices?.[0]?.message?.content || null;
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

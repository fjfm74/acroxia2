import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting config
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: Message[];
}

// Interfaces for site_config data
interface B2CPlan {
  name: string;
  price: string;
  description?: string;
  features?: string[];
}

interface B2BPlan {
  name: string;
  price: string;
  audience?: string;
  features?: string[];
}

interface CompanyInfo {
  email: string;
  phone: string;
  address?: string;
  website?: string;
  schedule?: {
    weekdays: string;
    saturday?: string;
    sunday?: string;
  };
}

interface ProductFlow {
  accepted_formats: string[];
  format_note?: string;
  max_file_size_mb?: number;
  free_analysis: {
    description: string;
    includes: string[];
    valid_hours?: number;
  };
  full_report: {
    description: string;
    price_key: string;
  };
  email_capture: {
    description: string;
    sends_report: boolean;
    sends_summary: boolean;
  };
}

interface PlatformInfo {
  pages: { path: string; name: string; description: string }[];
  seo_pages: { path: string; name: string; description: string }[];
  features: string[];
  what_acroxia_is: string;
  what_acroxia_is_not: string[];
}

interface FAQSummary {
  general: { q: string; a: string }[];
  pricing: { q: string; a: string }[];
  technical: { q: string; a: string }[];
}

interface FullSiteConfig {
  b2cPlans: B2CPlan[];
  b2bPlans: B2BPlan[];
  companyInfo: CompanyInfo;
  productFlow: ProductFlow;
  platformInfo: PlatformInfo;
  faqSummary: FAQSummary;
}

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function checkRateLimit(supabase: any, ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .eq("endpoint", "chat-assistant")
    .gte("created_at", windowStart);

  const requestCount = count || 0;
  return {
    allowed: requestCount < RATE_LIMIT_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_REQUESTS - requestCount),
  };
}

async function recordRequest(supabase: any, ip: string): Promise<void> {
  await supabase.from("rate_limits").insert({
    ip_address: ip,
    endpoint: "chat-assistant",
  });
}

async function getSiteConfig(supabase: any): Promise<FullSiteConfig> {
  const { data, error } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", ["b2c_plans", "b2b_plans", "company_info", "product_flow", "platform_info", "faq_summary"]);

  if (error) {
    console.error("Error fetching site config:", error);
  }

  const configMap = new Map<string, any>();
  (data || []).forEach((item: { key: string; value: any }) => {
    configMap.set(item.key, item.value);
  });

  return {
    b2cPlans: configMap.get("b2c_plans")?.plans || [],
    b2bPlans: configMap.get("b2b_plans")?.plans || [],
    companyInfo: configMap.get("company_info") || { email: "contacto@acroxia.com", phone: "+34 91 XXX XX XX" },
    productFlow: configMap.get("product_flow") || {
      accepted_formats: ["PDF", "DOCX", "JPG", "PNG", "WEBP"],
      free_analysis: { description: "Preview gratuito", includes: [] },
      full_report: { description: "Informe completo", price_key: "analisis_unico" },
      email_capture: { sends_report: false, sends_summary: false }
    },
    platformInfo: configMap.get("platform_info") || {
      pages: [],
      seo_pages: [],
      features: [],
      what_acroxia_is: "",
      what_acroxia_is_not: []
    },
    faqSummary: configMap.get("faq_summary") || { general: [], pricing: [], technical: [] }
  };
}

function detectUserProfile(messages: Message[]): "inquilino" | "propietario" | "profesional" | "unknown" {
  const allText = messages.map(m => m.content.toLowerCase()).join(" ");
  
  const profesionalKeywords = [
    "inmobiliaria", "gestoría", "gestoria", "administrador", "api", "integración",
    "volumen", "empresa", "profesional", "múltiples", "clientes", "agencia", "despacho",
    "cartera de propiedades", "muchos pisos"
  ];
  
  const propietarioKeywords = [
    "soy propietario", "mi inquilino", "arrendador", "tengo una vivienda",
    "quiero alquilar", "generar contrato", "mi piso en alquiler", "casero",
    "zona tensionada", "impago", "desahucio", "no me paga", "tengo un piso",
    "alquilar mi piso", "busco inquilino", "tengo varios pisos"
  ];
  
  const inquilinoKeywords = [
    "soy inquilino", "mi contrato", "mi piso", "mi casero", "fianza",
    "arrendador me", "renovar", "firmé", "me quieren subir", "cláusula abusiva",
    "voy a firmar", "me piden", "el propietario", "el casero"
  ];
  
  const profesionalScore = profesionalKeywords.filter(k => allText.includes(k)).length;
  const propietarioScore = propietarioKeywords.filter(k => allText.includes(k)).length;
  const inquilinoScore = inquilinoKeywords.filter(k => allText.includes(k)).length;
  
  // Prioridad: profesional > propietario > inquilino
  if (profesionalScore > propietarioScore && profesionalScore > inquilinoScore && profesionalScore >= 2) {
    return "profesional";
  }
  if (propietarioScore > inquilinoScore && propietarioScore >= 1) {
    return "propietario";
  }
  if (inquilinoScore >= 1) {
    return "inquilino";
  }
  return "unknown";
}

function buildSystemPrompt(config: FullSiteConfig, userProfile: string): string {
  const { b2cPlans, b2bPlans, companyInfo, productFlow, platformInfo, faqSummary } = config;

  // Información de la plataforma
  const whatIs = platformInfo.what_acroxia_is || "ACROXIA es una herramienta de IA para analizar contratos de alquiler.";
  const whatIsNot = platformInfo.what_acroxia_is_not?.join("; ") || "";
  const features = platformInfo.features?.join(", ") || "";

  // Páginas de la web
  const pages = platformInfo.pages?.map(p => `- ${p.name} (${p.path}): ${p.description}`).join("\n") || "";
  const seoPages = platformInfo.seo_pages?.map(p => `- ${p.name} (${p.path}): ${p.description}`).join("\n") || "";

  // FAQs formateadas
  const faqGeneral = faqSummary.general?.map(f => `P: ${f.q}\nR: ${f.a}`).join("\n\n") || "";
  const faqPricing = faqSummary.pricing?.map(f => `P: ${f.q}\nR: ${f.a}`).join("\n\n") || "";
  const faqTechnical = faqSummary.technical?.map(f => `P: ${f.q}\nR: ${f.a}`).join("\n\n") || "";

  // Formatos de archivo
  const formats = productFlow.accepted_formats?.join(", ") || "PDF, DOCX, JPG, PNG, WEBP";
  const maxSize = productFlow.max_file_size_mb || 10;

  // Flujo del producto
  const freeAnalysisDesc = productFlow.free_analysis?.description || "Preview gratuito";
  const freeIncludes = productFlow.free_analysis?.includes?.join(", ") || "";
  const validHours = productFlow.free_analysis?.valid_hours || 24;
  const fullReportDesc = productFlow.full_report?.description || "Informe completo";
  
  // Buscar precio del análisis único en b2cPlans
  const analisisUnico = b2cPlans.find(p => p.name?.toLowerCase().includes("único") || p.name?.toLowerCase().includes("unico"));
  const fullReportPrice = analisisUnico?.price || "39€";

  // Comportamiento del email - CRÍTICO
  const emailBehavior = productFlow.email_capture?.sends_summary
    ? "Enviamos un resumen del análisis por email"
    : "El email es SOLO para recordatorios comerciales. NO enviamos el informe ni resumen por email";

  // Precios B2C
  const b2cInfo = b2cPlans.map(p => `- ${p.name}: ${p.price}${p.description ? ` (${p.description})` : ""}`).join("\n") || "";
  
  // Precios B2B
  const b2bInfo = b2bPlans.map(p => `- ${p.name}: ${p.price}${p.audience ? ` - Para ${p.audience}` : ""}`).join("\n") || "";

  // Horario y contacto
  const schedule = companyInfo.schedule?.weekdays || "Lunes a Viernes, 9:00 - 18:00";

  // Perfil detectado - con instrucciones más específicas
  const profileNote = userProfile === "profesional"
    ? "PERFIL DETECTADO: PROFESIONAL (inmobiliaria, gestoría, etc). Enfócate en los planes B2B (99€/mes o 149€/mes) y menciona /profesionales/inmobiliarias o /profesionales/gestorias."
    : userProfile === "propietario"
    ? "PERFIL DETECTADO: PROPIETARIO particular. Enfócate en los planes para propietarios (29€ pago único por contrato, 149€/año Pro ilimitados) y menciona la página /propietarios."
    : userProfile === "inquilino"
    ? "PERFIL DETECTADO: INQUILINO particular. Enfócate en los planes B2C (14,99€ análisis único) y el análisis gratuito en /analizar-gratis."
    : "PERFIL NO DETECTADO: Tras 2-3 mensajes sin saber el perfil, haz una pregunta natural como: '¿Estás buscando revisar un contrato como inquilino o como propietario?' o '¿Es un contrato que vas a firmar tú o uno que quieres ofrecer a un inquilino?'. NO preguntes directamente '¿eres inquilino o propietario?' - intégralo de forma natural.";

  return `Eres el asistente virtual de ACROXIA. Tu trabajo es resolver dudas sobre la PLATAFORMA y sus servicios. NO das consejos legales.

═══════════════════════════════════════════════════════════════════════════════
¿QUÉ ES ACROXIA?
═══════════════════════════════════════════════════════════════════════════════
${whatIs}

Lo que ACROXIA NO es: ${whatIsNot}

Funcionalidades principales: ${features}

═══════════════════════════════════════════════════════════════════════════════
FLUJO DEL PRODUCTO (MUY IMPORTANTE - MEMORIZA ESTO)
═══════════════════════════════════════════════════════════════════════════════
1. El usuario sube su contrato → GRATIS, sin registro
   - Formatos aceptados: ${formats}
   - Tamaño máximo: ${maxSize}MB

2. Recibe un PREVIEW GRATUITO:
   - ${freeAnalysisDesc}
   - Incluye: ${freeIncludes}
   - Válido durante ${validHours} horas

3. Para ver el INFORME COMPLETO → Pago único de ${fullReportPrice}
   - ${fullReportDesc}

SOBRE EL EMAIL: ${emailBehavior}

═══════════════════════════════════════════════════════════════════════════════
PRECIOS ACTUALES (DATOS OFICIALES)
═══════════════════════════════════════════════════════════════════════════════
📱 PARA PARTICULARES:
${b2cInfo}

🏢 PARA EMPRESAS Y PROFESIONALES:
${b2bInfo}

═══════════════════════════════════════════════════════════════════════════════
PÁGINAS DE LA WEB
═══════════════════════════════════════════════════════════════════════════════
Principales:
${pages}

Artículos informativos (SEO):
${seoPages}

═══════════════════════════════════════════════════════════════════════════════
PREGUNTAS FRECUENTES (USA ESTAS RESPUESTAS)
═══════════════════════════════════════════════════════════════════════════════
GENERALES:
${faqGeneral}

SOBRE PRECIOS:
${faqPricing}

TÉCNICAS:
${faqTechnical}

═══════════════════════════════════════════════════════════════════════════════
CONTACTO
═══════════════════════════════════════════════════════════════════════════════
- Email: ${companyInfo.email}
- Teléfono: ${companyInfo.phone}
- Horario: ${schedule}

═══════════════════════════════════════════════════════════════════════════════
ESTILO DE COMUNICACIÓN
═══════════════════════════════════════════════════════════════════════════════
- Sé cercano y natural, como un compañero de trabajo que ayuda. Nada de respuestas robóticas.
- Usa un tono cálido pero profesional. Puedes tutear al usuario.
- Adapta la longitud de la respuesta a la complejidad: breve para consultas simples, más detallada si el usuario necesita orientación.
- Usa emojis con moderación (máximo 1-2 por respuesta) para dar calidez 😊
- Si el usuario parece frustrado o confundido, muestra empatía antes de dar la información.
- Puedes hacer preguntas de seguimiento si ayudan a entender mejor qué necesita el usuario.
- Cuando des precios, usa formato claro con **negrita**: "El análisis completo cuesta **14,99€** (pago único)".
- Evita sonar repetitivo. Varía tus respuestas y expresiones.
- NO uses encabezados (#), código, tablas ni bloques de código.

REGLAS IMPORTANTES:
- Si preguntan algo LEGAL específico → "Eso requiere analizar tu contrato. Puedes subirlo gratis en /analizar-gratis 📄"
- Si no tienes la información → "No tengo esa información. ¿Quieres que te ponga en contacto con el equipo? Puedes escribirnos a ${companyInfo.email}"
- NUNCA digas que enviamos el informe gratis por email. El email es solo para recordatorios.
- Siempre responde en español.
- Si mencionan una página, incluye el enlace.
- Usa los precios exactos de arriba.

${profileNote}

RECUERDA: Eres un asistente de SOPORTE DE PLATAFORMA, no un asesor legal. Si alguien pregunta "¿es legal esta cláusula?", responde que necesitan subir su contrato para analizarlo.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const clientIP = getClientIP(req);
    const { allowed, remaining } = await checkRateLimit(supabase, clientIP);

    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Has enviado demasiados mensajes. Por favor, espera un momento antes de continuar." 
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record this request
    await recordRequest(supabase, clientIP);

    // Parse request
    const { messages }: ChatRequest = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error("Messages array is required");
    }

    // Validate message length
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.content.length > 1000) {
      return new Response(
        JSON.stringify({ error: "El mensaje es demasiado largo. Máximo 1000 caracteres." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get ALL dynamic site config
    const siteConfig = await getSiteConfig(supabase);

    // Detect user profile from conversation
    const userProfile = detectUserProfile(messages);

    // Build system prompt with ALL dynamic data
    const systemPrompt = buildSystemPrompt(siteConfig, userProfile);

    // Keep only last 8 messages for context
    const recentMessages = messages.slice(-8);

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
        ],
        stream: true,
        max_tokens: 800,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Servicio temporalmente ocupado. Inténtalo de nuevo en unos segundos." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servicio no disponible temporalmente." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al procesar la solicitud");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error desconocido" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

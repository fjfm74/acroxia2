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

interface SiteConfig {
  b2cPlans: any[];
  b2bPlans: any[];
  companyInfo: any;
  assistantConfig: any;
  productFlow: any;
}

async function getSiteConfig(supabase: any): Promise<SiteConfig> {
  const { data, error } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", ["b2c_plans", "b2b_plans", "company_info", "assistant_config", "product_flow"]);

  if (error) {
    console.error("Error fetching site config:", error);
    return {
      b2cPlans: [],
      b2bPlans: [],
      companyInfo: {},
      assistantConfig: {},
      productFlow: {},
    };
  }

  const config: Record<string, any> = {};
  for (const row of data || []) {
    config[row.key] = row.value;
  }

  return {
    b2cPlans: config.b2c_plans || [],
    b2bPlans: config.b2b_plans || [],
    companyInfo: config.company_info || {},
    assistantConfig: config.assistant_config || {},
    productFlow: config.product_flow || {},
  };
}

function detectUserProfile(messages: Message[]): "inquilino" | "profesional" | "unknown" {
  const allContent = messages.map(m => m.content.toLowerCase()).join(" ");
  
  if (allContent.includes("soy inquilino") || allContent.includes("inquilino")) {
    return "inquilino";
  }
  if (allContent.includes("soy profesional") || allContent.includes("profesional") || 
      allContent.includes("inmobiliaria") || allContent.includes("gestoría") ||
      allContent.includes("gestoria") || allContent.includes("agencia")) {
    return "profesional";
  }
  return "unknown";
}

function buildSystemPrompt(config: SiteConfig, userProfile: string): string {
  const { b2cPlans, b2bPlans, companyInfo, productFlow } = config;

  // Generate B2C info dynamically
  const b2cInfo = b2cPlans
    .map((p: any) => `- ${p.name}: ${p.price}${p.description ? ` - ${p.description}` : ""}`)
    .join("\n");

  // Generate B2B info dynamically
  const b2bInfo = b2bPlans
    .map((p: any) => `- ${p.name}: ${p.price}${p.description ? ` - ${p.description}` : ""}`)
    .join("\n");

  // Get accepted formats from productFlow or companyInfo
  const formats = productFlow.accepted_formats?.join(", ") || 
                  companyInfo.accepted_formats?.join(", ") || 
                  "PDF, JPG, PNG";
  const formatNote = productFlow.format_note || "Puedes subir fotos o escaneos del contrato";

  // Get free analysis description from productFlow
  const freeAnalysisDesc = productFlow.free_analysis?.description || 
    "Preview gratuito: puntuación de riesgo y cláusulas detectadas";
  const freeAnalysisIncludes = productFlow.free_analysis?.includes?.join(", ") || 
    "Puntuación de riesgo, número de cláusulas";

  // Get full report info - price from first B2C plan
  const fullReportPrice = b2cPlans[0]?.price || "39€";
  const fullReportDesc = productFlow.full_report?.description || 
    "Informe completo con detalle de cada cláusula y recomendaciones";

  // Get email capture warning
  const emailCaptureNote = productFlow.email_capture?.note || 
    "El email solo captura el contacto, NO envía el informe gratis";

  // Get pack and subscription prices dynamically
  const packPrice = b2cPlans.find((p: any) => p.name?.toLowerCase().includes("pack"))?.price || "79€";
  const subscriptionPrice = b2cPlans.find((p: any) => p.name?.toLowerCase().includes("suscripción"))?.price || "99€/año";

  // Build profile-specific context using ONLY dynamic data
  let profileContext = "";
  if (userProfile === "inquilino") {
    profileContext = `
CONTEXTO: El usuario es un INQUILINO particular.
- Análisis inicial: ${freeAnalysisDesc}
- Incluye: ${freeAnalysisIncludes}
- Informe completo: ${fullReportPrice} - ${fullReportDesc}
- Formatos aceptados: ${formats} (${formatNote})
- IMPORTANTE: ${emailCaptureNote}
- Tono: cercano y tranquilizador`;
  } else if (userProfile === "profesional") {
    profileContext = `
CONTEXTO: El usuario es un PROFESIONAL (inmobiliaria, gestoría, etc.).
Planes disponibles:
${b2bInfo}
- Incluyen: dashboard de gestión, personalización de marca, soporte prioritario
- Formatos aceptados: ${formats}
- Tono: profesional pero cercano`;
  } else {
    profileContext = `
CONTEXTO: Aún no sabemos si es inquilino o profesional.
- Si pregunta por precios particulares: preview gratis, informe completo ${fullReportPrice}
- Si pregunta por precios empresariales: planes desde ${b2bPlans[0]?.price || "99€/mes"}`;
  }

  return `Eres el asistente virtual de ACROXIA. Ayudas a resolver dudas sobre el servicio de análisis de contratos de alquiler.

${profileContext}

═══════════════════════════════════════
INFORMACIÓN CLAVE (DATOS ACTUALIZADOS):
═══════════════════════════════════════

FLUJO PARA PARTICULARES:
1. Sube tu contrato (${formats}) → GRATIS
2. ${freeAnalysisDesc}
3. Para el informe completo → ${fullReportPrice}

PRECIOS PARTICULARES:
${b2cInfo}

PLANES EMPRESAS:
${b2bInfo}

CONTACTO:
- Email: ${companyInfo.email || "contacto@acroxia.com"}
- Teléfono: ${companyInfo.phone || ""}
- Web: ${companyInfo.website || "acroxia.com"}

ACROXIA es una herramienta informativa. NO sustituye asesoría legal profesional.

═══════════════════════════════════════
FORMATO DE RESPUESTAS (CRÍTICO):
═══════════════════════════════════════

1. Respuestas CORTAS: 2-4 frases máximo
2. Para negrita escribe el texto entre doble asterisco: **precio**
3. NO uses más de 1-2 negritas por respuesta
4. NO uses encabezados, código, tablas ni bloques
5. Solo usa listas si hay 3+ elementos

═══════════════════════════════════════
COMPORTAMIENTO:
═══════════════════════════════════════

- Saludos → responde breve: "¡Hola! ¿En qué te ayudo?"
- Precios particulares → "El preview es gratis. El informe completo son **${fullReportPrice}**."
- Precios empresas → "Desde **${b2bPlans[0]?.price || "99€/mes"}** con 10 análisis incluidos."
- Formatos → "Aceptamos ${formats}. ${formatNote}."
- Preguntas legales → "Eso requiere un análisis detallado. ¿Quieres que te ponga en contacto con el equipo?"

═══════════════════════════════════════
REGLAS ESTRICTAS:
═══════════════════════════════════════

1. NUNCA des consejos legales
2. NUNCA digas que el informe completo es gratis
3. NUNCA digas que enviamos el informe por email gratis - ${emailCaptureNote}
4. NUNCA uses precios con decimales
5. Siempre en español
6. Si no sabes algo → ofrece contacto con el equipo`;
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
    if (lastMessage.content.length > 500) {
      return new Response(
        JSON.stringify({ error: "El mensaje es demasiado largo. Máximo 500 caracteres." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get ALL dynamic site config including product_flow
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
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
        ],
        stream: true,
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

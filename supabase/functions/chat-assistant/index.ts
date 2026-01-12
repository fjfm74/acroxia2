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

async function getSiteConfig(supabase: any): Promise<{
  b2cPlans: any[];
  b2bPlans: any[];
  companyInfo: any;
  assistantConfig: any;
}> {
  const { data, error } = await supabase
    .from("site_config")
    .select("key, value")
    .in("key", ["b2c_plans", "b2b_plans", "company_info", "assistant_config"]);

  if (error) {
    console.error("Error fetching site config:", error);
    return {
      b2cPlans: [],
      b2bPlans: [],
      companyInfo: {},
      assistantConfig: {},
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

function buildSystemPrompt(b2cPlans: any[], b2bPlans: any[], companyInfo: any, userProfile: string): string {
  const b2bInfo = b2bPlans
    .map((p) => `- ${p.name}: ${p.price} - ${p.description}`)
    .join("\n");

  let profileContext = "";
  if (userProfile === "inquilino") {
    profileContext = `
CONTEXTO: El usuario es un INQUILINO particular.
- El análisis inicial es GRATUITO: sube su contrato y ve un preview con puntuación de riesgo y número de cláusulas detectadas
- Para ver el informe COMPLETO con detalle de cada cláusula y recomendaciones: 39€ (pago único)
- Pack Comparador (3 contratos): 79€
- Suscripción anual (análisis ilimitados): 99€/año
- Formatos aceptados: PDF, JPG o PNG (fotos o escaneos del contrato)
- IMPORTANTE: NO digas que enviamos el informe gratis por email. El email solo captura el contacto.
- Tono: cercano y tranquilizador`;
  } else if (userProfile === "profesional") {
    profileContext = `
CONTEXTO: El usuario es un PROFESIONAL (inmobiliaria, gestoría, etc.).
- Plan Profesional: 99€/mes (10 análisis incluidos)
- Plan Profesional Plus: 149€/mes (análisis ilimitados)
- Incluyen: dashboard de gestión, personalización de marca, soporte prioritario
- Formatos aceptados: PDF, JPG o PNG
- Tono: profesional pero cercano`;
  } else {
    profileContext = `
CONTEXTO: Aún no sabemos si es inquilino o profesional.
- Si pregunta por precios particulares: análisis gratuito (preview), informe completo 39€
- Si pregunta por precios empresariales: desde 99€/mes`;
  }

  return `Eres el asistente virtual de ACROXIA. Ayudas a resolver dudas sobre el servicio de análisis de contratos de alquiler.

${profileContext}

═══════════════════════════════════════
INFORMACIÓN CLAVE (MEMORIZA ESTO):
═══════════════════════════════════════

FLUJO PARA PARTICULARES:
1. Sube tu contrato (PDF, JPG o PNG) → GRATIS
2. Ves un preview: puntuación de riesgo + número de cláusulas detectadas
3. Para el informe completo con detalle → 39€

PRECIOS PARTICULARES (SIN DECIMALES):
- Preview gratuito: puntuación + resumen
- Informe completo: 39€
- Pack 3 contratos: 79€
- Suscripción anual: 99€/año

PLANES EMPRESAS:
${b2bInfo}

CONTACTO:
- Email: ${companyInfo.email || "contacto@acroxia.com"}
- Teléfono: ${companyInfo.phone || ""}

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
- Precios particulares → "El preview es gratis. El informe completo son **39€**."
- Precios empresas → "Desde **99€/mes** con 10 análisis incluidos."
- Formatos → "Aceptamos PDF, JPG y PNG. Puedes hacer fotos al contrato con el móvil."
- Preguntas legales → "Eso requiere un análisis detallado. ¿Quieres que te ponga en contacto con el equipo?"

═══════════════════════════════════════
REGLAS ESTRICTAS:
═══════════════════════════════════════

1. NUNCA des consejos legales
2. NUNCA digas que el informe completo es gratis
3. NUNCA digas que enviamos el informe por email gratis
4. NUNCA uses precios con decimales (39€, NO 39,99€)
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

    // Get dynamic site config
    const { b2cPlans, b2bPlans, companyInfo } = await getSiteConfig(supabase);

    // Detect user profile from conversation
    const userProfile = detectUserProfile(messages);

    // Build system prompt with current data and user profile
    const systemPrompt = buildSystemPrompt(b2cPlans, b2bPlans, companyInfo, userProfile);

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

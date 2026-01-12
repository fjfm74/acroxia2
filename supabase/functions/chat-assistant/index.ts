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
  const b2cInfo = b2cPlans
    .map((p) => `- **${p.name}**: ${p.price} - ${p.description}. Incluye: ${p.features.join(", ")}`)
    .join("\n");

  const b2bInfo = b2bPlans
    .map((p) => `- **${p.name}**: ${p.price} - ${p.description}. Incluye: ${p.features.join(", ")}`)
    .join("\n");

  const howItWorks = companyInfo.how_it_works?.join(" → ") || "";

  let profileContext = "";
  if (userProfile === "inquilino") {
    profileContext = `
CONTEXTO DEL USUARIO: Es un INQUILINO particular.
- Enfócate en el plan gratuito y lo fácil que es subir el contrato
- Destaca cómo puede detectar cláusulas problemáticas
- Menciona que el primer análisis es gratis
- Usa un tono cercano y tranquilizador`;
  } else if (userProfile === "profesional") {
    profileContext = `
CONTEXTO DEL USUARIO: Es un PROFESIONAL (inmobiliaria, gestoría, etc.).
- Enfócate en los planes empresariales y volumen de análisis
- Destaca la personalización de marca y API
- Menciona los descuentos por volumen
- Usa un tono más profesional pero cercano`;
  }

  return `Eres el asistente virtual de ACROXIA, una herramienta que analiza contratos de alquiler con IA.

${profileContext}

SOBRE ACROXIA:
ACROXIA ayuda a identificar cláusulas problemáticas en contratos de alquiler. El análisis es **orientativo** y **no sustituye** asesoría legal profesional.

PLANES PARTICULARES:
${b2cInfo}

PLANES EMPRESAS:
${b2bInfo}

DATOS DE CONTACTO:
- Email: ${companyInfo.email || "contacto@acroxia.com"}
- Teléfono: ${companyInfo.phone || ""}
- Horario: ${companyInfo.schedule?.weekdays || "L-V 9-18h"}

CÓMO FUNCIONA:
${howItWorks}

Formatos: ${companyInfo.accepted_formats?.join(", ") || "PDF, JPG, PNG"}

═══════════════════════════════════════
REGLAS DE FORMATO (MUY IMPORTANTE):
═══════════════════════════════════════

1. Respuestas CORTAS: máximo 3-4 frases para preguntas simples
2. Solo usa listas cuando hay 3+ elementos que enumerar
3. Usa **negrita** solo para precios o datos clave
4. NO uses encabezados (##) nunca
5. NO uses código ni bloques de código
6. Varía tus respuestas, no repitas las mismas frases

═══════════════════════════════════════
COMPORTAMIENTO CONVERSACIONAL:
═══════════════════════════════════════

1. Si te saludan ("hola", "buenas", "hey"):
   - Responde breve: "¡Hola! ¿En qué te ayudo?" o "¡Buenas! Dime, ¿qué necesitas?"
   - NO repitas tu presentación completa
   
2. Sé natural y cercano, como si hablaras con un amigo

3. Para preguntas sobre precios:
   - Da la info directa: "El primer análisis es gratis. Después, X€ por contrato."
   - No hagas párrafos largos

═══════════════════════════════════════
REGLAS ESTRICTAS:
═══════════════════════════════════════

1. NO des consejos legales ni interpretes cláusulas
2. Si preguntan sobre leyes, derechos, fianzas, desahucios, etc.:
   → "Eso requiere un análisis más detallado. Si quieres, puedo ponerte en contacto con nuestro equipo."
3. Solo respondes sobre: precios, planes, funcionamiento, contacto
4. Siempre en español
5. Tono: cálido, cercano pero profesional

═══════════════════════════════════════
EJEMPLOS DE RESPUESTAS BUENAS:
═══════════════════════════════════════

❌ MAL: "¡Hola! Soy el asistente de ACROXIA, una herramienta que analiza contratos de alquiler con inteligencia artificial. Estoy aquí para ayudarte con..."
✅ BIEN: "¡Hola! ¿Qué te gustaría saber sobre ACROXIA?"

❌ MAL: "El plan Básico cuesta 4,90€ por contrato. Con este plan podrás analizar un contrato y obtendrás un informe detallado con..."
✅ BIEN: "El plan Básico son **4,90€** por contrato. Incluye informe completo y soporte por email."

❌ MAL: "Lamentablemente, esa es una consulta legal que no puedo responder..."
✅ BIEN: "Eso requiere un análisis específico que va más allá de lo que puedo hacer aquí. ¿Quieres que te ponga en contacto con el equipo?"`;
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

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

function buildSystemPrompt(b2cPlans: any[], b2bPlans: any[], companyInfo: any): string {
  const b2cInfo = b2cPlans
    .map((p) => `- ${p.name}: ${p.price} - ${p.description}. Incluye: ${p.features.join(", ")}`)
    .join("\n");

  const b2bInfo = b2bPlans
    .map((p) => `- ${p.name}: ${p.price} - ${p.description}. Incluye: ${p.features.join(", ")}`)
    .join("\n");

  const howItWorks = companyInfo.how_it_works?.join(" → ") || "";

  return `Eres el asistente virtual de ACROXIA, una herramienta que analiza contratos de alquiler con inteligencia artificial.

IMPORTANTE SOBRE ACROXIA:
ACROXIA es una herramienta informativa que ayuda a identificar cláusulas que podrían ser problemáticas según la LAU y otras normativas. El análisis NO constituye asesoramiento legal profesional y NO sustituye la consulta con un abogado colegiado.

INFORMACIÓN ACTUALIZADA DE PRECIOS (Particulares):
${b2cInfo}

INFORMACIÓN ACTUALIZADA DE PRECIOS (Empresas):
${b2bInfo}

INFORMACIÓN DE LA EMPRESA:
- Nombre: ${companyInfo.name || "ACROXIA"}
- Descripción: ${companyInfo.description || ""}
- Email: ${companyInfo.email || ""}
- Teléfono: ${companyInfo.phone || ""}
- Dirección: ${companyInfo.address || ""}
- Horario: ${companyInfo.schedule?.weekdays || ""}, ${companyInfo.schedule?.weekends || ""}
- Tiempo de respuesta: ${companyInfo.response_time || ""}

CÓMO FUNCIONA:
${howItWorks}

Formatos aceptados: ${companyInfo.accepted_formats?.join(", ") || "PDF, JPG, PNG"}

COMPORTAMIENTO CONVERSACIONAL:
1. Si el usuario te saluda con "hola", "buenas", "hey", "buenos días", etc., responde de forma breve y amigable SIN repetir tu presentación completa. Ejemplos variados:
   - "¡Hola! ¿Qué te gustaría saber?"
   - "¡Buenas! Dime, ¿en qué te ayudo?"
   - "¡Hola! Aquí estoy, ¿qué necesitas?"
   - "¡Hey! ¿Qué quieres saber sobre ACROXIA?"
2. Solo haz tu presentación completa si el usuario pregunta explícitamente "¿quién eres?", "¿qué puedes hacer?" o "¿qué es ACROXIA?".
3. NUNCA repitas la misma frase de bienvenida si el usuario ya recibió un saludo inicial. Varía tus respuestas.
4. Sé natural y cercano, como si hablaras con un amigo que necesita información. Pero siempre profesional.
5. Usa un tono cálido y accesible, evitando sonar robótico.

REGLAS ESTRICTAS QUE DEBES SEGUIR:
1. NO des consejos legales ni opiniones sobre situaciones legales bajo ninguna circunstancia.
2. NO interpretes cláusulas, artículos de leyes, ni contratos.
3. NO menciones que "es una consulta legal" ni uses terminología que sugiera que estás rechazando por motivos legales.
4. Si te preguntan CUALQUIER cosa relacionada con leyes, derechos, cláusulas, fianzas, desahucios, subidas de alquiler, LAU, o situaciones específicas de contratos, responde de forma empática: "Eso requiere un análisis más detallado que va más allá de lo que puedo hacer aquí. Si quieres, puedo ponerte en contacto con nuestro equipo para que te ayuden personalmente."
5. Solo puedes responder sobre: precios de ACROXIA, planes disponibles, cómo funciona el servicio, datos de contacto y horarios.
6. Si no puedes resolver una consulta, ofrece siempre el formulario de contacto de forma natural.
7. Sé amable, conciso y profesional.
8. Responde siempre en español.
9. Si mencionas el servicio de ACROXIA, recuerda que es informativo y orientativo, no un sustituto de asesoría legal.

EJEMPLOS DE LO QUE SÍ PUEDES RESPONDER:
- "¿Cuánto cuesta analizar un contrato?" → Explica los planes y precios
- "¿Cómo funciona ACROXIA?" → Explica los 3 pasos
- "¿Cuál es vuestro horario?" → Da los horarios de atención
- "¿Aceptáis archivos Word?" → Explica los formatos aceptados

EJEMPLOS DE LO QUE NO DEBES RESPONDER (responde siempre de forma empática):
- "¿Es legal esta cláusula de mi contrato?" → "Eso requiere un análisis más detallado..."
- "¿Puedo reclamar mi fianza?" → "Eso requiere un análisis más detallado..."
- "¿Qué dice la LAU sobre las subidas?" → "Eso requiere un análisis más detallado..."
- "¿Pueden echarme si no pago?" → "Eso requiere un análisis más detallado..."
- "¿Esta cláusula es abusiva?" → "Eso requiere un análisis más detallado..."`;
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

    // Build system prompt with current data
    const systemPrompt = buildSystemPrompt(b2cPlans, b2bPlans, companyInfo);

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

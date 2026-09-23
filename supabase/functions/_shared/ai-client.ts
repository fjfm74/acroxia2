import { ANTHROPIC_URL, GATEWAY_URL, MODELS } from "./models.ts";

export type AnalysisTier = "free" | "paid";
export type AiProvider = "anthropic" | "gateway";

export class AiProviderError extends Error {
  constructor(public status: number, message: string, public provider: AiProvider, public model: string) {
    super(message);
  }
}

export interface AnalysisCallInput {
  systemPrompt: string;
  userText: string;          // texto del contrato (saneado) + instrucciones de usuario
  pdfBase64?: string;        // solo se usa con Anthropic: el PDF original, nativo
  tier: AnalysisTier;
  maxOutputTokens?: number;
}

export interface AnalysisCallOutput { raw: string; provider: AiProvider; model: string; }

export function pickProvider(tier: AnalysisTier): AiProvider {
  return tier === "paid" && Deno.env.get("ANTHROPIC_API_KEY") ? "anthropic" : "gateway";
}

export async function callAnalysisModel(input: AnalysisCallInput): Promise<AnalysisCallOutput> {
  return pickProvider(input.tier) === "anthropic" ? callAnthropic(input) : callGateway(input);
}

async function callAnthropic(input: AnalysisCallInput): Promise<AnalysisCallOutput> {
  const model = MODELS.CLAUDE_PAID;
  const content: Record<string, unknown>[] = [];
  if (input.pdfBase64) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.pdfBase64 },
      title: "Contrato de arrendamiento",
      cache_control: { type: "ephemeral" },
    });
  }
  content.push({ type: "text", text: input.userText });
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: input.maxOutputTokens ?? 16000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: input.systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new AiProviderError(res.status, await res.text(), "anthropic", model);
  const data = await res.json();
  if (data.stop_reason === "max_tokens") throw new AiProviderError(502, "Respuesta truncada (max_tokens)", "anthropic", model);
  const raw = (data.content ?? [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n");
  return { raw, provider: "anthropic", model };
}

async function callGateway(input: AnalysisCallInput): Promise<AnalysisCallOutput> {
  const model = input.tier === "paid" ? MODELS.GEMINI_PRO : MODELS.GEMINI_FAST;
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: input.maxOutputTokens ?? 16000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userText },
      ],
    }),
  });
  if (!res.ok) throw new AiProviderError(res.status, await res.text(), "gateway", model);
  const data = await res.json();
  if (data.choices?.[0]?.finish_reason === "length") throw new AiProviderError(502, "Respuesta truncada (length)", "gateway", model);
  return { raw: data.choices?.[0]?.message?.content ?? "", provider: "gateway", model };
}

/** Extrae y parsea el objeto JSON de la respuesta. Lanza si no hay JSON válido: NUNCA devuelve un resultado vacío inventado. */
export function parseAnalysisJson<T = Record<string, unknown>>(raw: string): T {
  let text = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(text) as T; } catch { /* sigue */ }
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("La respuesta del modelo no contiene JSON");
  text = text.slice(start, end + 1);
  try { return JSON.parse(text) as T; } catch { /* sigue */ }
  return JSON.parse(text.replace(/\\(?!["\\/bfnrtu])/g, "\\\\")) as T;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

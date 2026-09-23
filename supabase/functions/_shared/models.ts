export const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
export const MODELS = {
  GEMINI_FAST: "google/gemini-3.8-flash",
  GEMINI_PRO: "google/gemini-3.1-pro-preview",
  GEMINI_IMAGE: "google/gemini-3.1-flash-image",
  CLAUDE_PAID: "claude-opus-5",
  CLAUDE_FAST: "claude-sonnet-5",
} as const;

export type NormalizedClauseType = "valid" | "suspicious" | "illegal" | "unknown";
const VALID = new Set(["valid", "legal", "valida", "válida", "correcta", "ok"]);
const SUSPICIOUS = new Set(["suspicious", "sospechosa", "sospechoso", "warning", "review"]);
const ILLEGAL = new Set(["illegal", "ilegal", "invalid", "invalida", "inválida", "nula"]);
export function normalizeClauseType(t: unknown): NormalizedClauseType {
  if (typeof t !== "string") return "unknown";
  const n = t.trim().toLowerCase();
  if (VALID.has(n)) return "valid";
  if (SUSPICIOUS.has(n)) return "suspicious";
  if (ILLEGAL.has(n)) return "illegal";
  return "unknown";
}

// Comprueba que el "original_text" de cada cláusula aparece realmente en el contrato.
// No elimina cláusulas: solo marca quote_verified y añade contadores al summary.

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// deno-lint-ignore no-explicit-any
export function verifyClauseQuotes(analysis: any, contractText: string): { analysis: any; verified: number; total: number } {
  const clauses: any[] = Array.isArray(analysis?.clauses) ? analysis.clauses : [];
  const total = clauses.length;
  let verified = 0;

  if (!contractText || contractText.length < 200) {
    verified = -1;
  } else {
    const haystack = normalize(contractText);
    for (const clause of clauses) {
      const needle = normalize(String(clause?.original_text ?? "")).slice(0, 60);
      const ok = needle.length > 0 && haystack.includes(needle);
      clause.quote_verified = ok;
      if (ok) verified++;
    }
  }

  if (analysis && typeof analysis === "object") {
    if (!analysis.summary || typeof analysis.summary !== "object") analysis.summary = {};
    analysis.summary.quotes_verified = verified;
    analysis.summary.quotes_total = total;
  }
  return { analysis, verified, total };
}

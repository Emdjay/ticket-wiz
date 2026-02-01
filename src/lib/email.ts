export function normalizeResendFrom(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const startsWithQuote = trimmed.startsWith("\"") || trimmed.startsWith("'");
  const endsWithQuote = trimmed.endsWith("\"") || trimmed.endsWith("'");
  if (startsWithQuote && endsWithQuote && trimmed.length > 1) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

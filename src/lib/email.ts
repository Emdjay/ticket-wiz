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

export function getEmailBaseUrl(): string {
  const explicit = process.env.EMAIL_BASE_URL?.trim();
  if (explicit) return explicit;
  const nextPublic = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (nextPublic) return nextPublic;
  return "https://ticket-wiz.com";
}

export function buildOutboundUrl(target: string): string {
  const base = getEmailBaseUrl();
  return `${base}/api/outbound?url=${encodeURIComponent(target)}`;
}

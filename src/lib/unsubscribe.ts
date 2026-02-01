import crypto from "crypto";
import { getEmailBaseUrl } from "@/lib/email";

const TOKEN_SEPARATOR = ".";
const DEFAULT_EXPIRY_DAYS = 7;

type UnsubscribePayload = {
  email: string;
  exp: number;
};

function base64UrlEncode(value: string | Buffer): string {
  const buffer = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function getSecret(): string {
  return process.env.UNSUBSCRIBE_SECRET ?? "";
}

export function createUnsubscribeToken(email: string, expiryDays = DEFAULT_EXPIRY_DAYS) {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + expiryDays * 24 * 60 * 60;
  const payload: UnsubscribePayload = { email, exp };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret).update(encodedPayload).digest();
  const encodedSignature = base64UrlEncode(signature);
  return `${encodedPayload}${TOKEN_SEPARATOR}${encodedSignature}`;
}

export function verifyUnsubscribeToken(token: string | null | undefined): UnsubscribePayload | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  const [encodedPayload, encodedSignature] = token.split(TOKEN_SEPARATOR);
  if (!encodedPayload || !encodedSignature) return null;
  const expected = crypto.createHmac("sha256", secret).update(encodedPayload).digest();
  const actual = Buffer.from(
    encodedSignature.replaceAll("-", "+").replaceAll("_", "/"),
    "base64"
  );
  if (expected.length !== actual.length) return null;
  if (!crypto.timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as UnsubscribePayload;
    if (!payload.email || typeof payload.email !== "string") return null;
    if (!payload.exp || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(token: string): string {
  const base = getEmailBaseUrl();
  return `${base}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.length <= 2 ? local[0] ?? "" : local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

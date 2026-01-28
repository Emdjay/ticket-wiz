export type AmadeusEnv = "test" | "production";

type TokenCache = {
  accessToken: string;
  /** epoch milliseconds */
  expiresAtMs: number;
};

let tokenCache: TokenCache | null = null;

function getAmadeusEnv(): AmadeusEnv {
  const raw = (process.env.AMADEUS_ENV ?? "test").trim().toLowerCase();
  return raw === "production" ? "production" : "test";
}

export function getAmadeusBaseUrl(): string {
  return getAmadeusEnv() === "production"
    ? "https://api.amadeus.com"
    : "https://test.api.amadeus.com";
}

function requireEnv(name: string): string {
  const value = (process.env[name] ?? "").trim();
  if (!value) throw new Error(`Missing ${name} env var.`);
  return value;
}

export async function getAmadeusAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAtMs - now > 30_000) return tokenCache.accessToken;

  const clientId = requireEnv("AMADEUS_CLIENT_ID");
  const clientSecret = requireEnv("AMADEUS_CLIENT_SECRET");
  const baseUrl = getAmadeusBaseUrl();

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body,
    cache: "no-store",
  });

  const json = (await response.json().catch(() => null)) as
    | { access_token: string; expires_in: number }
    | { error?: string; error_description?: string }
    | null;

  if (!response.ok || !json || !("access_token" in json)) {
    const message =
      typeof json === "object" && json
        ? "error_description" in json && json.error_description
          ? json.error_description
          : "error" in json && json.error
            ? json.error
            : "Failed to obtain Amadeus access token."
        : "Failed to obtain Amadeus access token.";
    throw new Error(message);
  }

  tokenCache = {
    accessToken: json.access_token,
    // Keep a small safety buffer
    expiresAtMs: now + json.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

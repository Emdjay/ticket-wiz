import { NextResponse } from "next/server";
import { z } from "zod";
import { getAmadeusAccessToken, getAmadeusBaseUrl } from "@/lib/amadeus";
import type { ExploreDeal, ExploreResponse } from "@/lib/flights";

const IataCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Expected a 3-letter IATA airport code.");

const IsoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date like YYYY-MM-DD.");

const Currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Expected a 3-letter currency code.");

const QuerySchema = z.object({
  origin: IataCode,
  currency: Currency.default("USD"),
  maxPrice: z.coerce.number().int().positive().optional(),
  departureDate: IsoDate.optional(),
  returnDate: IsoDate.optional(),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  nonStop: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown): string =>
  typeof value === "string" ? value : value == null ? "" : String(value);

function defaultDepartureDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().slice(0, 10);
}

function pickDeal(raw: unknown, currencyFallback: string): ExploreDeal {
  const deal = asRecord(raw);
  const price = asRecord(deal.price);
  const links = asRecord(deal.links);

  return {
    destination: asString(deal.destination),
    priceTotal: asString(price.total),
    currency: asString(price.currency) || currencyFallback,
    departureDate: deal.departureDate ? asString(deal.departureDate) : undefined,
    returnDate: deal.returnDate ? asString(deal.returnDate) : undefined,
    links: links.flightOffers ? { flightOffers: asString(links.flightOffers) } : undefined,
  };
}

type CandidateDeal = {
  destination: string;
  priceTotal: string;
  currency: string;
  departureDate: string;
  returnDate: string | undefined;
  durationMinutes: number | undefined;
  maxStops: number | undefined;
};

function parseIsoDurationToMinutes(raw: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(raw);
  if (!match) return 0;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  return hours * 60 + minutes;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await fn(items[current]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fallbackExploreViaOffers(args: {
  token: string;
  origin: string;
  currency: string;
  maxPrice?: number;
  departureDate: string;
  returnDate?: string;
  adults: number;
  nonStop?: boolean;
}): Promise<ExploreDeal[]> {
  // Simple MVP candidate list (can be replaced with airport-routes + geo later)
  const candidates = [
    "ATL",
    "ORD",
    "LAX",
    "DFW",
    "DEN",
    "LAS",
    "MCO",
    "SEA",
    "SFO",
    "IAH",
    "BOS",
    "JFK",
    "EWR",
    "LGA",
    "CLT",
    "PHX",
  ].filter((c) => c !== args.origin);

  const baseUrl = getAmadeusBaseUrl();

  const perDestination = await mapWithConcurrency(candidates, 4, async (destination) => {
    const params = new URLSearchParams({
      originLocationCode: args.origin,
      destinationLocationCode: destination,
      departureDate: args.departureDate,
      adults: String(args.adults),
      currencyCode: args.currency,
      max: "3",
    });
    if (args.returnDate) params.set("returnDate", args.returnDate);
    if (typeof args.nonStop === "boolean") params.set("nonStop", String(args.nonStop));
    if (typeof args.maxPrice === "number") params.set("maxPrice", String(args.maxPrice));

    const res = await fetch(`${baseUrl}/v2/shopping/flight-offers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${args.token}` },
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as unknown;
    const jsonRecord = asRecord(json);
    const data = jsonRecord.data;
    if (!res.ok || !Array.isArray(data) || data.length === 0) return null;

    const cheapest = data
      .map((o) => {
        const offer = asRecord(o);
        const price = asRecord(offer.price);
        const itineraries = asArray(offer.itineraries);
        const durationMinutes = itineraries.reduce((sum: number, it) => {
          const itRec = asRecord(it);
          return sum + parseIsoDurationToMinutes(asString(itRec.duration));
        }, 0);
        const maxStops = itineraries.reduce((maxValue: number, it) => {
          const itRec = asRecord(it);
          const segments = asArray(itRec.segments);
          return Math.max(maxValue, Math.max(0, segments.length - 1));
        }, 0);
        return {
          destination,
          priceTotal: asString(price.total),
          currency: asString(price.currency) || args.currency,
          departureDate: args.departureDate,
          returnDate: args.returnDate,
          durationMinutes: durationMinutes || undefined,
          maxStops: maxStops || undefined,
        };
      })
      .filter(
        (d): d is CandidateDeal =>
          Boolean(d.priceTotal) && !Number.isNaN(Number(d.priceTotal))
      )
      .sort((a, b) => Number(a.priceTotal) - Number(b.priceTotal))[0];

    return cheapest ?? null;
  });

  return perDestination
    .filter((d): d is CandidateDeal => Boolean(d))
    .map((d) => ({
      destination: d.destination,
      priceTotal: d.priceTotal,
      currency: d.currency,
      departureDate: d.departureDate,
      returnDate: d.returnDate,
      durationMinutes: typeof d.durationMinutes === "number" ? d.durationMinutes : undefined,
      maxStops: typeof d.maxStops === "number" ? d.maxStops : undefined,
    }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const parsed = QuerySchema.safeParse({
    origin: url.searchParams.get("origin"),
    currency: url.searchParams.get("currency") || undefined,
    maxPrice: url.searchParams.get("maxPrice") || undefined,
    departureDate: url.searchParams.get("departureDate") || undefined,
    returnDate: url.searchParams.get("returnDate") || undefined,
    adults: url.searchParams.get("adults") || undefined,
    nonStop: url.searchParams.get("nonStop") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const token = await getAmadeusAccessToken();
    const departureDate = parsed.data.departureDate ?? defaultDepartureDate();
    if (parsed.data.returnDate && parsed.data.returnDate < departureDate) {
      return NextResponse.json(
        { error: "returnDate must be on/after departureDate." },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      origin: parsed.data.origin,
      currency: parsed.data.currency,
    });
    if (typeof parsed.data.nonStop === "boolean") params.set("nonStop", String(parsed.data.nonStop));
    if (typeof parsed.data.maxPrice === "number") params.set("maxPrice", String(parsed.data.maxPrice));

    const response = await fetch(
      `${getAmadeusBaseUrl()}/v1/shopping/flight-destinations?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );

    const json = (await response.json().catch(() => null)) as unknown;
    const jsonRecord = asRecord(json);
    if (!response.ok) {
      const errors = asArray(jsonRecord.errors);
      const firstError = errors.length ? asRecord(errors[0]) : {};
      const code = asString(firstError.code);

      // Known Amadeus test-env instability for /v1/shopping/flight-destinations (code 141).
      // Fallback: approximate “explore” by querying a small destination set via flight-offers.
      if (response.status === 500 && String(code) === "141") {
        const deals = await fallbackExploreViaOffers({
          token,
          origin: parsed.data.origin,
          currency: parsed.data.currency,
          maxPrice: parsed.data.maxPrice,
          departureDate,
          returnDate: parsed.data.returnDate,
          adults: parsed.data.adults,
          nonStop: parsed.data.nonStop,
        });
        const payload: ExploreResponse = { provider: "amadeus", deals };
        return NextResponse.json(payload);
      }

      const message =
        asString(firstError.detail) ||
        asString(firstError.title) ||
        asString(jsonRecord.error_description) ||
        "Explore search failed.";
      return NextResponse.json({ error: message, raw: json }, { status: response.status });
    }

    const data = jsonRecord.data;
    const deals = Array.isArray(data) ? data.map((d) => pickDeal(d, parsed.data.currency)) : [];
    const payload: ExploreResponse = { provider: "amadeus", deals };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Explore search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


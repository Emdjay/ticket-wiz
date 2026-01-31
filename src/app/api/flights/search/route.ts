import { NextResponse } from "next/server";
import { z } from "zod";
import { getAmadeusAccessToken, getAmadeusBaseUrl } from "@/lib/amadeus";
import type { FlightOffer, FlightSearchResponse } from "@/lib/flights";

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
  destination: IataCode,
  departureDate: IsoDate,
  returnDate: IsoDate.optional(),
  adults: z.coerce.number().int().min(1).max(9).default(1),
  currency: Currency.default("USD"),
  nonStop: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  max: z.coerce.number().int().min(1).max(50).default(20),
});

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const asString = (value: unknown): string =>
  typeof value === "string" ? value : value == null ? "" : String(value);

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

type CacheEntry = {
  payload: FlightSearchResponse;
  expiresAtMs: number;
};

const POPULAR_ROUTES = new Set([
  "MIA-JFK",
  "JFK-MIA",
  "LAX-JFK",
  "JFK-LAX",
  "SFO-JFK",
  "JFK-SFO",
  "ATL-JFK",
  "JFK-ATL",
  "LAX-LAS",
  "LAS-LAX",
  "DFW-LAX",
  "LAX-DFW",
]);

const POPULAR_CACHE_TTL_MS = 5 * 60 * 1000;
const POPULAR_ROUTE_CACHE = new Map<string, CacheEntry>();

function pickOffer(raw: unknown): FlightOffer {
  const offer = asRecord(raw);
  const price = asRecord(offer.price);
  const itineraries = asArray(offer.itineraries);

  return {
    id: asString(offer.id),
    priceTotal: asString(price.total),
    currency: asString(price.currency),
    validatingAirlineCodes: Array.isArray(offer.validatingAirlineCodes)
      ? (offer.validatingAirlineCodes as unknown[]).map(asString)
      : [],
    itineraries: itineraries.map((it) => {
      const itRec = asRecord(it);
      const segments = asArray(itRec.segments);
      return {
        duration: asString(itRec.duration),
        segments: segments.map((seg) => {
          const segRec = asRecord(seg);
          const departure = asRecord(segRec.departure);
          const arrival = asRecord(segRec.arrival);
          return {
            departure: {
              iataCode: asString(departure.iataCode),
              at: asString(departure.at),
            },
            arrival: {
              iataCode: asString(arrival.iataCode),
              at: asString(arrival.at),
            },
            carrierCode: asString(segRec.carrierCode),
            number: asString(segRec.number),
            duration: asString(segRec.duration),
            numberOfStops: asNumber(segRec.numberOfStops),
          };
        }),
      };
    }),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const parsed = QuerySchema.safeParse({
    origin: url.searchParams.get("origin"),
    destination: url.searchParams.get("destination"),
    departureDate: url.searchParams.get("departureDate"),
    returnDate: url.searchParams.get("returnDate") || undefined,
    adults: url.searchParams.get("adults") || undefined,
    currency: url.searchParams.get("currency") || undefined,
    nonStop: url.searchParams.get("nonStop") || undefined,
    max: url.searchParams.get("max") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const routeKey = `${parsed.data.origin}-${parsed.data.destination}`;
  const isPopularRoute = POPULAR_ROUTES.has(routeKey);
  const cacheKey = `${routeKey}:${parsed.data.departureDate}:${parsed.data.returnDate ?? ""}:${
    parsed.data.adults
  }:${parsed.data.currency}:${parsed.data.nonStop ?? false}:${parsed.data.max}`;
  if (isPopularRoute) {
    const cached = POPULAR_ROUTE_CACHE.get(cacheKey);
    if (cached && cached.expiresAtMs > Date.now()) {
      return NextResponse.json(cached.payload, {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
        },
      });
    }
  }

  try {
    const token = await getAmadeusAccessToken();

    const params = new URLSearchParams({
      originLocationCode: parsed.data.origin,
      destinationLocationCode: parsed.data.destination,
      departureDate: parsed.data.departureDate,
      adults: String(parsed.data.adults),
      currencyCode: parsed.data.currency,
      max: String(parsed.data.max),
    });
    if (parsed.data.returnDate) params.set("returnDate", parsed.data.returnDate);
    if (typeof parsed.data.nonStop === "boolean") params.set("nonStop", String(parsed.data.nonStop));

    const response = await fetch(
      `${getAmadeusBaseUrl()}/v2/shopping/flight-offers?${params.toString()}`,
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
      const message =
        asString(firstError.detail) ||
        asString(firstError.title) ||
        asString(jsonRecord.error_description) ||
        "Flight search failed.";
      return NextResponse.json({ error: message, raw: json }, { status: response.status });
    }

    const data = jsonRecord.data;
    const offers = Array.isArray(data) ? data.map(pickOffer) : [];
    const payload: FlightSearchResponse = { provider: "amadeus", offers };
    if (isPopularRoute) {
      POPULAR_ROUTE_CACHE.set(cacheKey, {
        payload,
        expiresAtMs: Date.now() + POPULAR_CACHE_TTL_MS,
      });
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
        },
      });
    }
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flight search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


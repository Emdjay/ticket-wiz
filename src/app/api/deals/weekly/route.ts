import { NextResponse } from "next/server";
import { z } from "zod";
import { getAmadeusAccessToken, getAmadeusBaseUrl } from "@/lib/amadeus";
import type { FlightOffer } from "@/lib/flights";
import { parseIsoDurationToMinutes, scoreOffers } from "@/lib/dealScore";

const DEFAULT_DESTINATIONS = [
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
];

const WEEKLY_DEAL_CACHE_TTL_MS = 30 * 60 * 1000;
let weeklyDealCache:
  | { cachedAt: number; payload: { ok: true; deal: { origin: string; destination: string; price: string; currency: string; score: number; durationMinutes: number; stops: number } } }
  | null = null;

const EnvList = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
  );

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

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  const parsed = raw ? Number(raw) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function addDaysIso(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

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

export async function GET() {
  if (weeklyDealCache && Date.now() - weeklyDealCache.cachedAt < WEEKLY_DEAL_CACHE_TTL_MS) {
    return NextResponse.json(weeklyDealCache.payload, {
      status: 200,
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
    });
  }

  const origin = (process.env.WEEKLY_DEAL_ORIGIN ?? "MIA").trim().toUpperCase();
  const currency = (process.env.WEEKLY_DEAL_CURRENCY ?? "USD").trim().toUpperCase();
  const maxPriceRaw = process.env.WEEKLY_DEAL_MAX_PRICE;
  const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : undefined;
  const adults = Math.max(1, readIntEnv("WEEKLY_DEAL_ADULTS", 1));
  const nonStop = (process.env.WEEKLY_DEAL_NONSTOP ?? "").trim().toLowerCase() === "true";
  const departureDate = addDaysIso(readIntEnv("WEEKLY_DEAL_DEPARTURE_DAYS_AHEAD", 21));
  const returnDays = readIntEnv("WEEKLY_DEAL_RETURN_DAYS_AHEAD", 28);
  const returnDate = returnDays > 0 ? addDaysIso(returnDays) : undefined;
  const maxResults = Math.min(50, Math.max(5, readIntEnv("WEEKLY_DEAL_MAX_RESULTS", 20)));

  const destinations =
    process.env.WEEKLY_DEAL_DESTINATIONS && process.env.WEEKLY_DEAL_DESTINATIONS.trim()
      ? EnvList.parse(process.env.WEEKLY_DEAL_DESTINATIONS)
      : DEFAULT_DESTINATIONS;
  const isDev = process.env.NODE_ENV === "development";
  const scopedDestinations = isDev ? destinations.slice(0, 4) : destinations;

  try {
    const token = await getAmadeusAccessToken();
    const baseUrl = getAmadeusBaseUrl();

    const offersWithRoute = await mapWithConcurrency(
      scopedDestinations.filter((d) => d !== origin),
      4,
      async (destination) => {
        const params = new URLSearchParams({
          originLocationCode: origin,
          destinationLocationCode: destination,
          departureDate,
          adults: String(adults),
          currencyCode: currency,
          max: String(maxResults),
        });
        if (returnDate) params.set("returnDate", returnDate);
        if (nonStop) params.set("nonStop", "true");
        if (typeof maxPrice === "number" && Number.isFinite(maxPrice)) {
          params.set("maxPrice", String(maxPrice));
        }

        const response = await fetch(
          `${baseUrl}/v2/shopping/flight-offers?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );
        const json = (await response.json().catch(() => null)) as unknown;
        const data = asRecord(json).data;
        if (!response.ok || !Array.isArray(data)) return [];
        return data.map((raw) => ({
          offer: pickOffer(raw),
          destination,
        }));
      }
    );

    const flattened = offersWithRoute.flat();
    if (flattened.length === 0) {
      return NextResponse.json({ ok: true, deal: null }, { status: 200 });
    }

    const offersForScore = flattened.map(({ offer, destination }) => ({
      ...offer,
      id: `${destination}-${offer.id}`,
    }));
    const scored = scoreOffers(offersForScore);

    const scoredOffers = flattened.map(({ offer, destination }) => {
      const scoredId = `${destination}-${offer.id}`;
      return {
        offer,
        destination,
        score: scored.scores.get(scoredId) ?? 0,
      };
    });

    scoredOffers.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(a.offer.priceTotal) - Number(b.offer.priceTotal);
    });

    const top = scoredOffers[0];
    if (!top) {
      return NextResponse.json({ ok: true, deal: null }, { status: 200 });
    }

    const totalDuration = top.offer.itineraries.reduce((sum, it) => {
      return sum + parseIsoDurationToMinutes(it.duration);
    }, 0);
    const maxStops = top.offer.itineraries.reduce((maxValue, it) => {
      const segments = it.segments.length;
      return Math.max(maxValue, Math.max(0, segments - 1));
    }, 0);

    const payload = {
      ok: true as const,
      deal: {
        origin,
        destination: top.destination,
        price: top.offer.priceTotal,
        currency: top.offer.currency || currency,
        score: top.score,
        durationMinutes: totalDuration,
        stops: maxStops,
      },
    };
    weeklyDealCache = { cachedAt: Date.now(), payload };
    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weekly deal failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

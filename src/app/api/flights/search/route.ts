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

function pickOffer(raw: any): FlightOffer {
  return {
    id: String(raw?.id ?? ""),
    priceTotal: String(raw?.price?.total ?? ""),
    currency: String(raw?.price?.currency ?? ""),
    validatingAirlineCodes: Array.isArray(raw?.validatingAirlineCodes)
      ? raw.validatingAirlineCodes.map(String)
      : [],
    itineraries: Array.isArray(raw?.itineraries)
      ? raw.itineraries.map((it: any) => ({
          duration: String(it?.duration ?? ""),
          segments: Array.isArray(it?.segments)
            ? it.segments.map((seg: any) => ({
                departure: {
                  iataCode: String(seg?.departure?.iataCode ?? ""),
                  at: String(seg?.departure?.at ?? ""),
                },
                arrival: {
                  iataCode: String(seg?.arrival?.iataCode ?? ""),
                  at: String(seg?.arrival?.at ?? ""),
                },
                carrierCode: String(seg?.carrierCode ?? ""),
                number: String(seg?.number ?? ""),
                duration: String(seg?.duration ?? ""),
                numberOfStops: Number(seg?.numberOfStops ?? 0),
              }))
            : [],
        }))
      : [],
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

    const json = (await response.json().catch(() => null)) as any;
    if (!response.ok) {
      const message =
        json?.errors?.[0]?.detail ||
        json?.errors?.[0]?.title ||
        json?.error_description ||
        "Flight search failed.";
      return NextResponse.json({ error: message, raw: json }, { status: response.status });
    }

    const offers = Array.isArray(json?.data) ? json.data.map(pickOffer) : [];
    const payload: FlightSearchResponse = { provider: "amadeus", offers };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flight search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


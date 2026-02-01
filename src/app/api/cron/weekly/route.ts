import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAmadeusAccessToken, getAmadeusBaseUrl } from "@/lib/amadeus";
import type { FlightOffer } from "@/lib/flights";
import { parseIsoDurationToMinutes, scoreOffers } from "@/lib/dealScore";
import { buildKiwiAffiliateUrl } from "@/lib/partners";
import { getSubscribers } from "@/lib/subscribers";
import { getSavedSearches, markSavedSearchSent } from "@/lib/savedSearches";
import { getWeeklyDeal } from "@/lib/weeklyDeal";

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

function formatMoney(currency: string, amount: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDurationMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.max(0, totalMinutes % 60);
  return `${hours}h ${minutes}m`;
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

async function fetchBestOffer(args: {
  token: string;
  baseUrl: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
  nonStop: boolean;
}) {
  const params = new URLSearchParams({
    originLocationCode: args.origin,
    destinationLocationCode: args.destination,
    departureDate: args.departureDate,
    adults: String(args.adults),
    currencyCode: args.currency,
    max: "10",
  });
  if (args.returnDate) params.set("returnDate", args.returnDate);
  if (args.nonStop) params.set("nonStop", "true");

  const response = await fetch(`${args.baseUrl}/v2/shopping/flight-offers?${params.toString()}`, {
    headers: { Authorization: `Bearer ${args.token}` },
    cache: "no-store",
  });
  const json = (await response.json().catch(() => null)) as unknown;
  const jsonRecord = asRecord(json);
  const data = jsonRecord.data;
  if (!response.ok || !Array.isArray(data)) return null;
  const offers = data.map(pickOffer).filter((offer) => offer.id);
  if (offers.length === 0) return null;
  const scored = scoreOffers(offers);
  const best = offers.reduce((bestOffer: FlightOffer, offer: FlightOffer) => {
    const bestScore = scored.scores.get(bestOffer.id) ?? 0;
    const offerScore = scored.scores.get(offer.id) ?? 0;
    return offerScore > bestScore ? offer : bestOffer;
  }, offers[0]);
  return { offer: best, score: scored.scores.get(best.id) ?? 0 };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const resendFrom = process.env.RESEND_FROM ?? "";
  if (!resendApiKey || !resendFrom) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY or RESEND_FROM." },
      { status: 500 }
    );
  }

  try {
    const subscribers = await getSubscribers();
    if (subscribers.length === 0) {
      return NextResponse.json({ ok: true, message: "No subscribers." });
    }

    const token = await getAmadeusAccessToken();
    const baseUrl = getAmadeusBaseUrl();
    const weeklyResult = await getWeeklyDeal({ token, baseUrl });
    if (!weeklyResult) {
      return NextResponse.json({ ok: true, message: "No offers found." });
    }

    const { context, top, totalDurationMinutes, maxStops } = weeklyResult;
    const purchaseUrl = buildKiwiAffiliateUrl({
      origin: context.origin,
      destination: top.destination,
      depart: context.departureDate,
      returnDate: context.returnDate,
      adults: context.adults,
    });

    const scorePct = Math.round(top.score * 100);
    const priceLabel = formatMoney(top.offer.currency || context.currency, top.offer.priceTotal);
    const durationLabel = formatDurationMinutes(totalDurationMinutes);
    const stopsLabel = `${maxStops} stop${maxStops === 1 ? "" : "s"}`;
    const airlineCode = top.offer.validatingAirlineCodes[0] ?? "Multiple carriers";

    const subject = `Ticket Wiz weekly best deal: ${context.origin} → ${top.destination} from ${priceLabel}`;
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2 style="margin:0 0 8px;">Weekly Best Deal</h2>
        <p style="margin:0 0 12px;">${context.origin} → ${top.destination} · ${priceLabel}</p>
        <ul style="padding-left:18px;margin:0 0 12px;">
          <li>Score: ${scorePct}/100</li>
          <li>Dates: ${context.departureDate}${
            context.returnDate ? ` → ${context.returnDate}` : ""
          }</li>
          <li>Duration: ${durationLabel}</li>
          <li>Stops: ${stopsLabel}</li>
          <li>Airline: ${airlineCode}</li>
        </ul>
        <p style="margin:0 0 8px;">
          <a href="${purchaseUrl}" target="_blank" rel="noopener noreferrer">Book this deal</a>
        </p>
        <p style="color:#64748b;font-size:12px;margin:0;">You are receiving this because you subscribed to Ticket Wiz alerts.</p>
      </div>
    `;
    const text = [
      "Weekly Best Deal",
      `${context.origin} → ${top.destination} · ${priceLabel}`,
      `Score: ${scorePct}/100`,
      `Dates: ${context.departureDate}${
        context.returnDate ? ` → ${context.returnDate}` : ""
      }`,
      `Duration: ${durationLabel}`,
      `Stops: ${stopsLabel}`,
      `Airline: ${airlineCode}`,
      `Book this deal: ${purchaseUrl}`,
      "You are receiving this because you subscribed to Ticket Wiz alerts.",
    ].join("\n");

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: resendFrom,
      to: subscribers.map((s) => s.email),
      subject,
      html,
      text,
    });

    const savedSearches = await getSavedSearches();
    type SavedSearch = (typeof savedSearches)[number];
    type SavedResult = { search: SavedSearch; best: { offer: FlightOffer; score: number } };
    const shouldSendSavedSearch = (search: SavedSearch) => {
      if (search.paused) return false;
      if (!search.last_sent_at) return true;
      const lastSent = new Date(search.last_sent_at).getTime();
      const now = Date.now();
      const days = (now - lastSent) / (1000 * 60 * 60 * 24);
      if (search.frequency === "daily") return days >= 0.9;
      if (search.frequency === "biweekly") return days >= 13;
      return days >= 6.5;
    };
    if (savedSearches.length > 0) {
      const eligible = savedSearches.filter(shouldSendSavedSearch);
      const savedResults = await mapWithConcurrency(eligible, 3, async (search) => {
        const best = await fetchBestOffer({
          token,
          baseUrl,
          origin: search.origin,
          destination: search.destination,
          departureDate: search.departure_date,
          returnDate: search.return_date ?? undefined,
          adults: search.adults,
          currency: search.currency,
          nonStop: search.non_stop,
        });
        return best ? { search, best } : null;
      });

      const validResults = savedResults.filter((result): result is SavedResult => Boolean(result));

      await Promise.all(
        validResults.map(async (result) => {
          const bestOffer = result.best.offer;
          const scorePct = Math.round(result.best.score * 100);
          const totalDuration = bestOffer.itineraries.reduce((sum: number, it: Itinerary) => {
            return sum + parseIsoDurationToMinutes(it.duration);
          }, 0);
          const maxStops = bestOffer.itineraries.reduce((maxValue: number, it: Itinerary) => {
            const segments = it.segments.length;
            return Math.max(maxValue, Math.max(0, segments - 1));
          }, 0);
          const priceLabel = formatMoney(bestOffer.currency, bestOffer.priceTotal);
          const durationLabel = formatDurationMinutes(totalDuration);
          const stopsLabel = `${maxStops} stop${maxStops === 1 ? "" : "s"}`;
          const airlineCode = bestOffer.validatingAirlineCodes[0] ?? "Multiple carriers";
          const priceValue = Number(bestOffer.priceTotal);
          const lastSentPrice = result.search.last_sent_price ?? null;
          const lastSentAt = result.search.last_sent_at
            ? new Date(result.search.last_sent_at).getTime()
            : null;
          const daysSinceLast = lastSentAt ? (Date.now() - lastSentAt) / (1000 * 60 * 60 * 24) : null;
          const priceDrop =
            Number.isFinite(priceValue) && typeof lastSentPrice === "number"
              ? lastSentPrice - priceValue
              : null;
          const purchaseUrl = buildKiwiAffiliateUrl({
            origin: result.search.origin,
            destination: result.search.destination,
            depart: result.search.departure_date,
            returnDate: result.search.return_date ?? undefined,
            adults: result.search.adults,
          });

          const cadenceLabel =
            result.search.frequency === "daily"
              ? "Daily"
              : result.search.frequency === "biweekly"
                ? "Biweekly"
                : "Weekly";
          const subjectLine = `${cadenceLabel} price update: ${result.search.origin} → ${result.search.destination} from ${priceLabel}`;
          const htmlBody = `
              <div style="font-family:Arial,sans-serif;line-height:1.5;">
                <h2 style="margin:0 0 8px;">${cadenceLabel} Price Update</h2>
                <p style="margin:0 0 12px;">${result.search.origin} → ${result.search.destination} · ${priceLabel}</p>
                <ul style="padding-left:18px;margin:0 0 12px;">
                  <li>Score: ${scorePct}/100</li>
                  <li>Dates: ${result.search.departure_date}${
                    result.search.return_date ? ` → ${result.search.return_date}` : ""
                  }</li>
                  <li>Duration: ${durationLabel}</li>
                  <li>Stops: ${stopsLabel}</li>
                  <li>Airline: ${airlineCode}</li>
                  ${
                    typeof priceDrop === "number" && priceDrop > 0 && daysSinceLast && daysSinceLast >= 6
                      ? `<li>Price drop since last week: ${formatMoney(
                          bestOffer.currency,
                          String(priceDrop)
                        )}</li>`
                      : ""
                  }
                </ul>
                <p style="margin:0 0 8px;">
                  <a href="${purchaseUrl}" target="_blank" rel="noopener noreferrer">Book this deal</a>
                </p>
                <p style="color:#64748b;font-size:12px;margin:0;">You are receiving this because you saved a Ticket Wiz search.</p>
              </div>
            `;
          const textBody = [
            `${cadenceLabel} Price Update`,
            `${result.search.origin} → ${result.search.destination} · ${priceLabel}`,
            `Score: ${scorePct}/100`,
            `Dates: ${result.search.departure_date}${
              result.search.return_date ? ` → ${result.search.return_date}` : ""
            }`,
            `Duration: ${durationLabel}`,
            `Stops: ${stopsLabel}`,
            `Airline: ${airlineCode}`,
            ...(typeof priceDrop === "number" && priceDrop > 0 && daysSinceLast && daysSinceLast >= 6
              ? [
                  `Price drop since last week: ${formatMoney(
                    bestOffer.currency,
                    String(priceDrop)
                  )}`,
                ]
              : []),
            `Book this deal: ${purchaseUrl}`,
            "You are receiving this because you saved a Ticket Wiz search.",
          ].join("\n");

          await resend.emails.send({
            from: resendFrom,
            to: result.search.email,
            subject: subjectLine,
            html: htmlBody,
            text: textBody,
          });
        await markSavedSearchSent(result.search.id, Number.isFinite(priceValue) ? priceValue : null);
        })
      );
    }

    return NextResponse.json({
      ok: true,
      sent: subscribers.length,
      deal: {
        origin: context.origin,
        destination: top.destination,
        price: top.offer.priceTotal,
        currency: top.offer.currency || context.currency,
        score: top.score,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weekly email failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

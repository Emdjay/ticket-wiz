import type { FlightOffer } from "@/lib/flights";

export const OUTLIER_MAX_STOPS = 2;
export const OUTLIER_DURATION_MULTIPLIER = 1.6;

export function parseIsoDurationToMinutes(raw: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(raw);
  if (!match) return 0;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  return hours * 60 + minutes;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function scoreOffers(offers: FlightOffer[]) {
  if (offers.length === 0) {
    return {
      scores: new Map<string, number>(),
      durations: new Map<string, number>(),
      stops: new Map<string, number>(),
      maxStops: new Map<string, number>(),
      outliers: new Map<string, string>(),
    };
  }

  const prices: number[] = [];
  const durations: number[] = [];
  const stops: number[] = [];
  const maxStops: number[] = [];

  for (const offer of offers) {
    const price = Number(offer.priceTotal);
    prices.push(Number.isFinite(price) ? price : 0);

    const durationMinutes = offer.itineraries.reduce((sum, it) => {
      return sum + parseIsoDurationToMinutes(it.duration);
    }, 0);
    durations.push(durationMinutes);

    const itineraryStops = offer.itineraries.map((it) => Math.max(0, it.segments.length - 1));
    const totalStops = itineraryStops.reduce((sum, count) => sum + count, 0);
    stops.push(totalStops);
    maxStops.push(itineraryStops.length ? Math.max(...itineraryStops) : 0);
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const minStops = Math.min(...stops);
  const maxStopsCount = Math.max(...stops);
  const medianDuration = median(durations);

  const scores = new Map<string, number>();
  const durationById = new Map<string, number>();
  const stopsById = new Map<string, number>();
  const maxStopsById = new Map<string, number>();
  const outliersById = new Map<string, string>();

  offers.forEach((offer, index) => {
    const price = prices[index];
    const duration = durations[index];
    const stopCount = stops[index];
    const maxStopCount = maxStops[index];

    durationById.set(offer.id, duration);
    stopsById.set(offer.id, stopCount);
    maxStopsById.set(offer.id, maxStopCount);

    const priceNorm = maxPrice === minPrice ? 0.5 : (price - minPrice) / (maxPrice - minPrice);
    const durationNorm =
      maxDuration === minDuration ? 0.5 : (duration - minDuration) / (maxDuration - minDuration);
    const stopsNorm =
      maxStopsCount === minStops ? 0.5 : (stopCount - minStops) / (maxStopsCount - minStops);

    let score = 0.7 * (1 - priceNorm) + 0.2 * (1 - durationNorm) + 0.1 * (1 - stopsNorm);
    const outlierReasons: string[] = [];
    if (maxStopCount >= OUTLIER_MAX_STOPS) outlierReasons.push("2+ stops");
    if (medianDuration > 0 && duration > medianDuration * OUTLIER_DURATION_MULTIPLIER) {
      outlierReasons.push("very long duration");
    }
    if (outlierReasons.length > 0) score -= 0.12;
    score = clamp01(score);
    scores.set(offer.id, score);
    if (outlierReasons.length > 0) {
      outliersById.set(offer.id, outlierReasons.join(" · "));
    }
  });

  return {
    scores,
    durations: durationById,
    stops: stopsById,
    maxStops: maxStopsById,
    outliers: outliersById,
  };
}

import type { FlightOffer } from "@/lib/flights";

export const STOP_PENALTY_PER_STOP = 0.06;
export const DURATION_PENALTY_FACTOR = 0.1;
export const DURATION_PENALTY_CAP = 0.2;

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

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function stdDev(values: number[], avg = mean(values)): number {
  if (values.length === 0) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - avg) * (value - avg), 0) / values.length;
  return Math.sqrt(variance);
}

function zScores(values: number[]): number[] {
  if (values.length === 0) return [];
  const avg = mean(values);
  const sd = stdDev(values, avg);
  if (!Number.isFinite(sd) || sd === 0) return values.map(() => 0);
  return values.map((value) => (value - avg) / sd);
}

function normalizeZScores(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return values.map(() => 0.5);
  }
  return values.map((value) => (value - min) / (max - min));
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

  const medianDuration = median(durations);

  const priceScores = normalizeZScores(zScores(prices).map((value) => -value));
  const durationScores = normalizeZScores(zScores(durations).map((value) => -value));
  const stopsScores = normalizeZScores(zScores(stops).map((value) => -value));

  const scores = new Map<string, number>();
  const durationById = new Map<string, number>();
  const stopsById = new Map<string, number>();
  const maxStopsById = new Map<string, number>();
  const outliersById = new Map<string, string>();

  offers.forEach((offer, index) => {
    const duration = durations[index];
    const stopCount = stops[index];
    const maxStopCount = maxStops[index];

    durationById.set(offer.id, duration);
    stopsById.set(offer.id, stopCount);
    maxStopsById.set(offer.id, maxStopCount);

    const priceScore = priceScores[index] ?? 0.5;
    const durationScore = durationScores[index] ?? 0.5;
    const stopsScore = stopsScores[index] ?? 0.5;

    let score = 0.6 * priceScore + 0.25 * durationScore + 0.15 * stopsScore;
    const outlierReasons: string[] = [];
    const stopPenalty = Math.max(0, stopCount - 1) * STOP_PENALTY_PER_STOP;
    const durationPenalty =
      medianDuration > 0 && duration > medianDuration
        ? Math.min(
            DURATION_PENALTY_CAP,
            ((duration - medianDuration) / medianDuration) * DURATION_PENALTY_FACTOR
          )
        : 0;
    if (stopPenalty > 0) outlierReasons.push("extra stops");
    if (durationPenalty > 0) outlierReasons.push("long duration");
    score -= stopPenalty + durationPenalty;
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

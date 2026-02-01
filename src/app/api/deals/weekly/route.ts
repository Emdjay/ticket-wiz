import { NextResponse } from "next/server";
import { getWeeklyDeal } from "@/lib/weeklyDeal";

const WEEKLY_DEAL_CACHE_TTL_MS = 30 * 60 * 1000;
let weeklyDealCache:
  | { cachedAt: number; payload: { ok: true; deal: { origin: string; destination: string; price: string; currency: string; score: number; durationMinutes: number; stops: number } } }
  | null = null;

export async function GET() {
  if (weeklyDealCache && Date.now() - weeklyDealCache.cachedAt < WEEKLY_DEAL_CACHE_TTL_MS) {
    return NextResponse.json(weeklyDealCache.payload, {
      status: 200,
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
    });
  }

  try {
    const result = await getWeeklyDeal();
    if (!result) {
      return NextResponse.json({ ok: true, deal: null }, { status: 200 });
    }
    const { context, top, totalDurationMinutes, maxStops } = result;
    const payload = {
      ok: true as const,
      deal: {
        origin: context.origin,
        destination: top.destination,
        price: top.offer.priceTotal,
        currency: top.offer.currency || context.currency,
        score: top.score,
        durationMinutes: totalDurationMinutes,
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

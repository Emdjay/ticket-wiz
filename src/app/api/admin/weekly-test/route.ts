import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getAmadeusAccessToken, getAmadeusBaseUrl } from "@/lib/amadeus";
import { buildOutboundUrl, normalizeResendFrom } from "@/lib/email";
import { buildBrandedEmailHtml } from "@/lib/emailTemplates";
import { buildKiwiAffiliateUrl } from "@/lib/partners";
import { buildUnsubscribeUrl, createUnsubscribeToken } from "@/lib/unsubscribe";
import { getWeeklyDeal } from "@/lib/weeklyDeal";

function assertAdmin(request: Request) {
  const token = process.env.ADMIN_TOKEN ?? "";
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

const BodySchema = z.object({
  email: z.string().trim().email(),
});

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

export async function POST(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const resendFrom = normalizeResendFrom(process.env.RESEND_FROM ?? "");
  const resendReplyTo = normalizeResendFrom(process.env.RESEND_REPLY_TO ?? "");
  if (!resendApiKey || !resendFrom) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY or RESEND_FROM." },
      { status: 500 }
    );
  }

  try {
    const token = await getAmadeusAccessToken();
    const baseUrl = getAmadeusBaseUrl();
    const weeklyResult = await getWeeklyDeal({ token, baseUrl });
    if (!weeklyResult) {
      return NextResponse.json({ ok: true, message: "No offers found." });
    }

    const { context, top, totalDurationMinutes, maxStops } = weeklyResult;
    const purchaseUrl = buildOutboundUrl(
      buildKiwiAffiliateUrl({
        origin: context.origin,
        destination: top.destination,
        depart: context.departureDate,
        returnDate: context.returnDate,
        adults: context.adults,
      })
    );

    const scorePct = Math.round(top.score * 100);
    const priceLabel = formatMoney(top.offer.currency || context.currency, top.offer.priceTotal);
    const durationLabel = formatDurationMinutes(totalDurationMinutes);
    const stopsLabel = `${maxStops} stop${maxStops === 1 ? "" : "s"}`;
    const airlineCode = top.offer.validatingAirlineCodes[0] ?? "Multiple carriers";
    const unsubscribeToken = createUnsubscribeToken(parsed.data.email);
    const unsubscribeUrl = unsubscribeToken ? buildUnsubscribeUrl(unsubscribeToken) : undefined;

    const subject = `Ticket Wiz weekly best deal: ${context.origin} → ${top.destination} from ${priceLabel}`;
    const html = buildBrandedEmailHtml({
      contentHtml: `
        <h2 style="margin:0 0 8px;font-size:22px;color:#001f3f;">Weekly Best Deal</h2>
        <p style="margin:0 0 16px;font-size:16px;">${context.origin} → ${top.destination} · ${priceLabel}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
          <tr><td style="padding:4px 0;color:#6c757d;">Score</td><td style="padding:4px 0;text-align:right;">${scorePct}/100</td></tr>
          <tr><td style="padding:4px 0;color:#6c757d;">Dates</td><td style="padding:4px 0;text-align:right;">${context.departureDate}${
            context.returnDate ? ` → ${context.returnDate}` : ""
          }</td></tr>
          <tr><td style="padding:4px 0;color:#6c757d;">Duration</td><td style="padding:4px 0;text-align:right;">${durationLabel}</td></tr>
          <tr><td style="padding:4px 0;color:#6c757d;">Stops</td><td style="padding:4px 0;text-align:right;">${stopsLabel}</td></tr>
          <tr><td style="padding:4px 0;color:#6c757d;">Airline</td><td style="padding:4px 0;text-align:right;">${airlineCode}</td></tr>
        </table>
        <a href="${purchaseUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#007bff;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">Book this deal</a>
      `,
      footerNote: "Test send for Ticket Wiz weekly deal.",
      unsubscribeUrl,
    });
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
      "Test send for Ticket Wiz weekly deal.",
      ...(unsubscribeUrl ? [`Unsubscribe: ${unsubscribeUrl}`] : []),
    ].join("\n");

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: resendFrom,
      to: parsed.data.email,
      subject,
      html,
      text,
      ...(resendReplyTo ? { replyTo: resendReplyTo } : {}),
    });

    return NextResponse.json({
      ok: true,
      sentTo: parsed.data.email,
      deal: {
        origin: context.origin,
        destination: top.destination,
        price: top.offer.priceTotal,
        currency: top.offer.currency || context.currency,
        score: top.score,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Weekly test email failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

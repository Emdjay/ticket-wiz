import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import {
  addSavedSearch,
  deleteSavedSearch,
  getSavedSearchesByEmail,
  updateSavedSearch,
} from "@/lib/savedSearches";

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

const BodySchema = z.object({
  email: z.string().trim().email(),
  origin: IataCode,
  destination: IataCode,
  departureDate: IsoDate,
  returnDate: IsoDate.optional(),
  adults: z.coerce.number().int().min(1).max(9),
  currency: Currency,
  nonStop: z.boolean().optional().default(false),
});

const QuerySchema = z.object({
  email: z.string().trim().email(),
});

const UpdateSchema = z.object({
  email: z.string().trim().email(),
  id: z.coerce.number().int().positive(),
  paused: z.boolean().optional(),
  frequency: z.enum(["daily", "weekly", "biweekly"]).optional(),
});

const DeleteSchema = z.object({
  email: z.string().trim().email(),
  id: z.coerce.number().int().positive(),
});

function buildDeepLink(originUrl: string, data: z.infer<typeof BodySchema>) {
  const url = new URL("/app", originUrl);
  url.searchParams.set("origin", data.origin);
  url.searchParams.set("destination", data.destination);
  url.searchParams.set("depart", data.departureDate);
  if (data.returnDate) url.searchParams.set("return", data.returnDate);
  url.searchParams.set("adults", String(data.adults));
  url.searchParams.set("currency", data.currency);
  if (data.nonStop) url.searchParams.set("nonStop", "1");
  url.searchParams.set("auto", "1");
  return url.toString();
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await addSavedSearch({
      email: parsed.data.email,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      departureDate: parsed.data.departureDate,
      returnDate: parsed.data.returnDate,
      adults: parsed.data.adults,
      currency: parsed.data.currency,
      nonStop: parsed.data.nonStop ?? false,
    });
    const resendApiKey = process.env.RESEND_API_KEY ?? "";
    const resendFrom = process.env.RESEND_FROM ?? "";
    if (resendApiKey && resendFrom) {
      const originUrl = new URL(request.url).origin;
      const deepLink = buildDeepLink(originUrl, parsed.data);
      const resend = new Resend(resendApiKey);
      const subject = `Alert confirmed: ${parsed.data.origin} → ${parsed.data.destination}`;
      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5;">
          <h2 style="margin:0 0 8px;">Your alert is set</h2>
          <p style="margin:0 0 12px;">
            We’ll send weekly price updates for ${parsed.data.origin} → ${parsed.data.destination}.
          </p>
          <p style="margin:0 0 12px;">
            <a href="${deepLink}" target="_blank" rel="noopener noreferrer">
              View this search in Ticket Wiz
            </a>
          </p>
          <p style="color:#64748b;font-size:12px;margin:0;">
            You can manage or pause alerts anytime.
          </p>
        </div>
      `;
      await resend.emails.send({
        from: resendFrom,
        to: parsed.data.email,
        subject,
        html,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save search.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({ email: url.searchParams.get("email") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const searches = await getSavedSearchesByEmail(parsed.data.email);
    return NextResponse.json({ ok: true, searches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load searches.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    await updateSavedSearch(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update search.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid delete.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    await deleteSavedSearch(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete search.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

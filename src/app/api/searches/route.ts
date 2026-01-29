import { NextResponse } from "next/server";
import { z } from "zod";
import { addSavedSearch } from "@/lib/savedSearches";

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
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save search.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

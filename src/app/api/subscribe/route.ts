import { NextResponse } from "next/server";
import { z } from "zod";
import { addSubscriber } from "@/lib/subscribers";

const BodySchema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await addSubscriber(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save subscriber.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

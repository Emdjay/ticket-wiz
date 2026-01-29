import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteSubscriber, getSubscribers } from "@/lib/subscribers";

function assertAdmin(request: Request) {
  const token = process.env.ADMIN_TOKEN ?? "";
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

const DeleteSchema = z.object({
  email: z.string().trim().email(),
});

export async function GET(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const subscribers = await getSubscribers();
    return NextResponse.json({ subscribers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load subscribers.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const json = await request.json().catch(() => null);
  const parsed = DeleteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid email.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    await deleteSubscriber(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete subscriber.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

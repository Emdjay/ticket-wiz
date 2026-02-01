import { NextResponse } from "next/server";
import { deleteSubscriber } from "@/lib/subscribers";
import { deleteSavedSearchesByEmail } from "@/lib/savedSearches";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

async function readToken(request: Request): Promise<string | null> {
  const json = await request.json().catch(() => null);
  if (json && typeof json === "object" && "token" in json) {
    const token = (json as { token?: unknown }).token;
    return typeof token === "string" ? token : null;
  }
  const form = await request.formData().catch(() => null);
  if (form) {
    const token = form.get("token");
    return typeof token === "string" ? token : null;
  }
  return null;
}

export async function POST(request: Request) {
  const token = await readToken(request);
  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 });
  }

  await deleteSubscriber(payload.email);
  await deleteSavedSearchesByEmail(payload.email);

  const url = new URL("/unsubscribe/success", request.url);
  url.searchParams.set("email", payload.email);
  return NextResponse.redirect(url, 303);
}

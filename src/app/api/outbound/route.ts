import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url") ?? "";
  try {
    const decoded = decodeURIComponent(target);
    const dest = new URL(decoded);
    if (dest.protocol !== "http:" && dest.protocol !== "https:") {
      return NextResponse.json({ error: "Invalid target." }, { status: 400 });
    }
    return NextResponse.redirect(dest, 302);
  } catch {
    return NextResponse.json({ error: "Invalid target." }, { status: 400 });
  }
}

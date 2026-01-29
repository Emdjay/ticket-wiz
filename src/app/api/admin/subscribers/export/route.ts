import { NextResponse } from "next/server";
import { getSubscribers } from "@/lib/subscribers";

function assertAdmin(request: Request) {
  const token = process.env.ADMIN_TOKEN ?? "";
  if (!token) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${token}`;
}

export async function GET(request: Request) {
  if (!assertAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const subscribers = await getSubscribers();
    const header = "email,created_at";
    const rows = subscribers.map(
      (s) => `${s.email},${new Date(s.created_at).toISOString()}`
    );
    const body = [header, ...rows].join("\n");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=subscribers.csv",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export subscribers.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    amadeusEnv: Boolean(process.env.AMADEUS_ENV?.trim()),
    amadeusClientId: Boolean(process.env.AMADEUS_CLIENT_ID?.trim()),
    amadeusClientSecret: Boolean(process.env.AMADEUS_CLIENT_SECRET?.trim()),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}

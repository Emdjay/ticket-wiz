import { sql } from "@vercel/postgres";

export type SavedSearch = {
  id: number;
  email: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string | null;
  adults: number;
  currency: string;
  non_stop: boolean;
  created_at: Date;
};

export async function ensureSavedSearchesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      return_date TEXT,
      adults INT NOT NULL,
      currency TEXT NOT NULL,
      non_stop BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (email, origin, destination, departure_date, return_date, adults, currency, non_stop)
    )
  `;
}

export async function addSavedSearch(args: {
  email: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  currency: string;
  nonStop: boolean;
}) {
  await ensureSavedSearchesTable();
  await sql`
    INSERT INTO saved_searches (
      email,
      origin,
      destination,
      departure_date,
      return_date,
      adults,
      currency,
      non_stop
    )
    VALUES (
      ${args.email},
      ${args.origin},
      ${args.destination},
      ${args.departureDate},
      ${args.returnDate ?? null},
      ${args.adults},
      ${args.currency},
      ${args.nonStop}
    )
    ON CONFLICT DO NOTHING
  `;
}

export async function getSavedSearches(): Promise<SavedSearch[]> {
  await ensureSavedSearchesTable();
  const { rows } = await sql<SavedSearch>`
    SELECT
      id,
      email,
      origin,
      destination,
      departure_date,
      return_date,
      adults,
      currency,
      non_stop,
      created_at
    FROM saved_searches
    ORDER BY created_at DESC
  `;
  return rows;
}

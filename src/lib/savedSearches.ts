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
  paused: boolean;
  frequency: "weekly" | "biweekly";
  last_sent_at: Date | null;
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
      paused BOOLEAN NOT NULL DEFAULT FALSE,
      frequency TEXT NOT NULL DEFAULT 'weekly',
      last_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (email, origin, destination, departure_date, return_date, adults, currency, non_stop)
    )
  `;
  await sql`ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS paused BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'weekly'`;
  await sql`ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ`;
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
      non_stop,
      paused,
      frequency
    )
    VALUES (
      ${args.email},
      ${args.origin},
      ${args.destination},
      ${args.departureDate},
      ${args.returnDate ?? null},
      ${args.adults},
      ${args.currency},
      ${args.nonStop},
      false,
      'weekly'
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
      paused,
      frequency,
      last_sent_at,
      created_at
    FROM saved_searches
    ORDER BY created_at DESC
  `;
  return rows;
}

export async function getSavedSearchesByEmail(email: string): Promise<SavedSearch[]> {
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
      paused,
      frequency,
      last_sent_at,
      created_at
    FROM saved_searches
    WHERE email = ${email}
    ORDER BY created_at DESC
  `;
  return rows;
}

export async function updateSavedSearch(args: {
  id: number;
  email: string;
  paused?: boolean;
  frequency?: "weekly" | "biweekly";
}) {
  await ensureSavedSearchesTable();
  await sql`
    UPDATE saved_searches
    SET
      paused = COALESCE(${args.paused}, paused),
      frequency = COALESCE(${args.frequency}, frequency)
    WHERE id = ${args.id} AND email = ${args.email}
  `;
}

export async function deleteSavedSearch(args: { id: number; email: string }) {
  await ensureSavedSearchesTable();
  await sql`
    DELETE FROM saved_searches
    WHERE id = ${args.id} AND email = ${args.email}
  `;
}

export async function markSavedSearchSent(id: number) {
  await ensureSavedSearchesTable();
  await sql`
    UPDATE saved_searches
    SET last_sent_at = NOW()
    WHERE id = ${id}
  `;
}

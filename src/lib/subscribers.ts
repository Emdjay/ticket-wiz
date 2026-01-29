import { sql } from "@vercel/postgres";

export type Subscriber = {
  email: string;
  created_at: Date;
};

export async function ensureSubscribersTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscribers (
      email TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function addSubscriber(email: string) {
  await ensureSubscribersTable();
  await sql`
    INSERT INTO subscribers (email)
    VALUES (${email})
    ON CONFLICT (email) DO NOTHING
  `;
}

export async function getSubscribers(): Promise<Subscriber[]> {
  await ensureSubscribersTable();
  const { rows } = await sql<Subscriber>`
    SELECT email, created_at
    FROM subscribers
    ORDER BY created_at ASC
  `;
  return rows;
}

export async function deleteSubscriber(email: string) {
  await ensureSubscribersTable();
  await sql`
    DELETE FROM subscribers
    WHERE email = ${email}
  `;
}

import { pool } from "@/lib/db";

export async function getUserIdByAuth0Id(
  auth0Id: string
): Promise<number | null> {
  const result = await pool.query("SELECT id FROM users WHERE auth0_id = $1", [
    auth0Id,
  ]);
  return result.rows[0]?.id || null;
}

// app/api/keys/route.ts
import { auth0 } from "@/lib/auth0";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { encrypt, decrypt } from "@/lib/crypto"; // ✅ importe aqui

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user?.sub)
    return new NextResponse("Unauthorized", { status: 401 });

  const auth0_id = session.user.sub;

  const result = await pool.query("SELECT id FROM users WHERE auth0_id = $1", [
    auth0_id,
  ]);
  const user = result.rows[0];
  if (!user) return new NextResponse("User not found", { status: 404 });

  const keyResult = await pool.query(
    "SELECT key, created_at FROM keys WHERE user_id = $1",
    [user.id]
  );

  const encryptedKey = keyResult.rows[0]?.key || null;
  const createdAt = keyResult.rows[0]?.created_at;
  const key = encryptedKey ? decrypt(encryptedKey, auth0_id) : null; // ✅ decrypt aqui

  return NextResponse.json({ key, createdAt });
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user?.sub)
    return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const auth0_id = session.user.sub;

  const result = await pool.query("SELECT id FROM users WHERE auth0_id = $1", [
    auth0_id,
  ]);
  const user = result.rows[0];
  if (!user) return new NextResponse("User not found", { status: 404 });

  const user_id = user.id;
  const encryptedKey = encrypt(body.key, auth0_id); // ✅ encrypt aqui

  await pool.query(
    `INSERT INTO keys (user_id, key)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET key = $2, created_at = CURRENT_TIMESTAMP`,
    [user_id, encryptedKey]
  );

  return NextResponse.json({ success: true });
}

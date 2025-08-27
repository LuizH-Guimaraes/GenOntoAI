// app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, auth0_id } = await req.json();

    if (!email || !auth0_id) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await pool.query(
      "SELECT * FROM users WHERE auth0_id = $1",
      [auth0_id]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      return NextResponse.json({ message: "User already exists.", user });
    }

    // Insert new user
    await pool.query("INSERT INTO users (email, auth0_id) VALUES ($1, $2)", [
      email,
      auth0_id,
    ]);

    return NextResponse.json({ message: "User created successfully." });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

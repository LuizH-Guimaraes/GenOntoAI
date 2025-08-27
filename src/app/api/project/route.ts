import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

// Create new project
export async function POST(req: NextRequest) {
  try {
    const { name, user_id } = await req.json();

    if (!name || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "INSERT INTO projects (name, user_id) VALUES ($1, $2) RETURNING *",
      [name.trim(), user_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error("Error creating project:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// List all projects for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id." }, { status: 400 });
    }

    const result = await pool.query(
      "SELECT * FROM projects WHERE user_id = $1 ORDER BY id DESC",
      [user_id]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("Error fetching projects:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

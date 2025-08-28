// src/app/api/project/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { getUserIdByAuth0Id } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: any) {
  try {
    const { id: projectId } = ctx.params as { id: string };

    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0Id = session.user.sub;
    const userId = await getUserIdByAuth0Id(auth0Id);

    const result = await pool.query(
      "SELECT * FROM projects WHERE id = $1 AND user_id = $2",
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching project:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: any) {
  try {
    const { id: projectId } = ctx.params as { id: string };

    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0Id = session.user.sub;
    const userId = await getUserIdByAuth0Id(auth0Id);

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name." }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [name, projectId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating project:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: any) {
  try {
    const { id: projectId } = ctx.params as { id: string };

    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auth0Id = session.user.sub;
    const userId = await getUserIdByAuth0Id(auth0Id);

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *",
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Project not found or access denied." },
        { status: 404 }
      );
    }

    return NextResponse.json({ deleted: result.rows[0] });
  } catch (err) {
    console.error("Error deleting project:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

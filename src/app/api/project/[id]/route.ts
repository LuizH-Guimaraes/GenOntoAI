import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { getUserIdByAuth0Id } from "@/lib/utils";

// GET - Buscar projeto do usuário
export async function GET(
  req: NextRequest,
  contextPromise: Promise<{ params: { id?: string } }>
) {
  try {
    const { params } = await contextPromise;
    const projectId = params?.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID." },
        { status: 400 }
      );
    }

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

// PUT - Atualizar projeto
export async function PUT(
  req: NextRequest,
  contextPromise: Promise<{ params: { id?: string } }>
) {
  try {
    const { params } = await contextPromise;
    const projectId = params?.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID." },
        { status: 400 }
      );
    }

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

// DELETE - Excluir projeto
export async function DELETE(
  req: NextRequest,
  contextPromise: Promise<{ params: { id?: string } }>
) {
  try {
    const { params } = await contextPromise;
    const projectId = params?.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing project ID." },
        { status: 400 }
      );
    }

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

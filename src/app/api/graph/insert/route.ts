import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function POST(req: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");

    if (!graphId || typeof graphId !== "string" || graphId.trim() === "") {
      return NextResponse.json(
        { error: "Missing or invalid graphId" },
        { status: 400 }
      );
    }

    const { updateQuery } = await req.json();

    console.log(updateQuery);

    if (
      !updateQuery ||
      typeof updateQuery !== "string" ||
      !updateQuery.toLowerCase().includes("insert data")
    ) {
      return NextResponse.json(
        { error: "Invalid or missing SPARQL update query" },
        { status: 400 }
      );
    }

    const namespace = `http://genontoai.com/${session.user.sub}/${graphId}/`;
    const REPO_NAME = process.env.GRAPHDB_REPOSITORY;
    const GRAPHDB_URL = process.env.GRAPHDB_URL;

    const response = await fetch(
      `${GRAPHDB_URL}/repositories/${REPO_NAME}/statements?context=${encodeURIComponent(
        namespace
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/sparql-update",
        },
        body: updateQuery,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `GraphDB error ${response.status}: ${text}` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: "Dados inseridos com sucesso!" });
  } catch (error) {
    console.error("Erro no insert:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}

// src/app/api/graph/relationship/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { toCamelCase } from "@/lib/stringFormatter";

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");
    if (!graphId) {
      return NextResponse.json({ error: "Missing graphId" }, { status: 400 });
    }

    let subject: string | undefined;
    let predicate: string | undefined;
    let object: string | undefined;

    // Adiciona um try/catch para lidar com a análise do JSON
    try {
      const body = (await req.json()) as {
        subject?: string;
        predicate?: string;
        object?: string;
      };
      subject = body.subject;
      predicate = body.predicate;
      object = body.object;
    } catch (e) {
      // O corpo da requisição DELETE está vazio ou não é JSON.
      // O erro 'Unexpected end of JSON input' será capturado aqui,
      // permitindo que o código continue.
    }

    if (!subject?.trim() || !predicate?.trim() || !object?.trim()) {
      return NextResponse.json(
        { error: "subject, predicate and object are required" },
        { status: 400 }
      );
    }

    const auth0IdSafe = session.user.sub.replace("|", "-");
    const namespace = `http://genontoai.com/${auth0IdSafe}/${graphId}/`;

    const s = `<${namespace}${encodeURIComponent(
      toCamelCase(subject.trim())
    )}>`;
    const p = `<${namespace}${encodeURIComponent(
      toCamelCase(predicate.trim())
    )}>`;
    const o = `<${namespace}${encodeURIComponent(toCamelCase(object.trim()))}>`;

    const updateQuery = `
      DELETE DATA {
        ${s} ${p} ${o} .
      }
    `;

    const REPO_NAME = process.env.GRAPHDB_REPOSITORY!;
    const GRAPHDB_URL = process.env.GRAPHDB_URL!;

    const response = await fetch(
      `${GRAPHDB_URL}/repositories/${REPO_NAME}/statements?context=${encodeURIComponent(
        namespace
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/sparql-update" },
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

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete triple failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

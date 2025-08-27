// app/api/graph/relationship/route.ts
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

    const { subject, predicate, object } = (await req.json()) as {
      subject?: string;
      predicate?: string;
      object?: string;
    };

    if (!subject?.trim() || !predicate?.trim() || !object?.trim()) {
      return NextResponse.json(
        { error: "subject, predicate and object are required" },
        { status: 400 }
      );
    }

    // Namespace por usuário + grafo (mesma lógica do insert)
    const auth0IdSafe = session.user.sub.replace("|", "-");
    const namespace = `http://genontoai.com/${auth0IdSafe}/${graphId}/`;

    // Padroniza termos (camelCase pra termos “bonitos” e estáveis)
    const s = `<${namespace}${encodeURIComponent(
      toCamelCase(subject.trim())
    )}>`;
    const p = `<${namespace}${encodeURIComponent(
      toCamelCase(predicate.trim())
    )}>`;
    const o = `<${namespace}${encodeURIComponent(toCamelCase(object.trim()))}>`;

    // DELETE DATA remove exatamente a triple informada
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

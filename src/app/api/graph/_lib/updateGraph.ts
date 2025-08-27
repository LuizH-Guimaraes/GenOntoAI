// app/api/graph/_lib/updateGraph.ts
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function requireSession() {
  const session = await auth0.getSession();
  if (!session?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  return session;
}

// Normalize 'sub' para uso seguro em IRI (combine com o padrão que você usa nos INSERTs)
export function buildNamespace(userSub: string, graphId: string | number) {
  const safeSub = String(userSub).replace(/[^A-Za-z0-9._~:-]/g, "-"); // ex.: troca '|' por '-'
  return `http://genontoai.com/${safeSub}/${graphId}/`;
}

// Monta IRI a partir de ns + id local (faz encode do id)
export function iri(ns: string, id: string) {
  return `<${ns}${encodeURIComponent(id)}>`;
}

// Escapa string p/ literal SPARQL
export function escLit(s: string) {
  return s.replaceAll("\\", "\\\\").replaceAll(`"`, `\\"`);
}

// Dispara SPARQL UPDATE no GraphDB
export async function runUpdate(ns: string, update: string) {
  const REPO_NAME = process.env.GRAPHDB_REPOSITORY!;
  const GRAPHDB_URL = process.env.GRAPHDB_URL!;
  const url = `${GRAPHDB_URL}/repositories/${REPO_NAME}/statements?context=${encodeURIComponent(
    ns
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/sparql-update" },
    body: update,
  });

  const text = await res.text(); // sempre leia a resposta
  if (!res.ok) {
    console.error("GraphDB error:", res.status, text);
    return NextResponse.json(
      { error: `GraphDB error ${res.status}: ${text}` },
      { status: res.status }
    );
  }
  return NextResponse.json({ ok: true });
}

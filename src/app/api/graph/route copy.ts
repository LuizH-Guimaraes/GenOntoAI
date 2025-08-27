import { NextResponse } from "next/server";

interface Node {
  id: string;
  label: string;
}

interface Link {
  source: string;
  target: string;
  label: string;
}

export async function GET() {
  try {
    const REPO_NAME = process.env.GRAPHDB_REPOSITORY || "my_repository";
    const GRAPHDB_URL = process.env.GRAPHDB_URL || "http://localhost:7200";

    // SPARQL query to get relationships from GraphDB
    const sparqlQuery = `
      PREFIX ex: <http://example.org/>

      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
        FILTER (
          STRSTARTS(STR(?s), STR(ex:)) ||
          STRSTARTS(STR(?p), STR(ex:)) ||
          STRSTARTS(STR(?o), STR(ex:))
        )
      }
      LIMIT 100
    `;

    const response = await fetch(
      `${GRAPHDB_URL}/repositories/${REPO_NAME}?query=${encodeURIComponent(
        sparqlQuery
      )}`,
      {
        headers: { Accept: "application/sparql-results+json" },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Error fetching data - Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // ✅ Explicitly defining type to prevent TypeScript errors
    const nodes: Map<string, Node> = new Map();
    const links: Link[] = []; // 🔹 Explicitly set the type

    data.results.bindings.forEach((row: any) => {
      const source = row.s.value;
      const predicate = row.p.value;
      const target = row.o.value;

      if (!nodes.has(source)) nodes.set(source, { id: source, label: source });
      if (!nodes.has(target)) nodes.set(target, { id: target, label: target });

      links.push({ source, target, label: predicate });
    });

    return NextResponse.json({ nodes: Array.from(nodes.values()), links });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

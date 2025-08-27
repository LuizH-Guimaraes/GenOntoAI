import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0"; // ajuste para o caminho real do seu projeto

interface Node {
  id: string;
  label: string;
}

interface Link {
  source: string;
  target: string;
  label: string;
}

// export async function GET(req: Request) {
//   try {
//     // Autenticação
//     const session = await auth0.getSession();
//     if (!session?.user?.sub) {
//       return new NextResponse("Unauthorized", { status: 401 });
//     }
//     const auth0_id = session.user.sub;

//     // Pega o graphId da URL: /api/graph?graphId=abc123
//     const { searchParams } = new URL(req.url);
//     const graphId = searchParams.get("graphId");
//     if (!graphId) {
//       return new NextResponse("Missing graphId", { status: 400 });
//     }

//     // Define namespace único
//     const safeUserId = auth0_id.replace("|", "-");
//     const namespace = `http://genontoai.com/${safeUserId}/${graphId}/`;

//     const REPO_NAME = process.env.GRAPHDB_REPOSITORY || "my_repository";
//     const GRAPHDB_URL = process.env.GRAPHDB_URL || "http://localhost:7200";

//     // SPARQL query filtrando só dados daquele namespace
//     const sparqlQuery = `
//       SELECT ?s ?p ?o
//       WHERE {
//         ?s ?p ?o .
//         FILTER (
//           STRSTARTS(STR(?s), "${namespace}") ||
//           STRSTARTS(STR(?p), "${namespace}") ||
//           STRSTARTS(STR(?o), "${namespace}")
//         )
//       }
//       LIMIT 100
//     `;

//     const response = await fetch(
//       `${GRAPHDB_URL}/repositories/${REPO_NAME}?query=${encodeURIComponent(
//         sparqlQuery
//       )}`,
//       {
//         headers: { Accept: "application/sparql-results+json" },
//       }
//     );

//     if (!response.ok) {
//       return NextResponse.json(
//         { error: `Error fetching data - Status: ${response.status}` },
//         { status: response.status }
//       );
//     }

//     const data = await response.json();

//     const nodes: Map<string, Node> = new Map();
//     const links: Link[] = [];

//     data.results.bindings.forEach((row: any) => {
//       const source = row.s.value;
//       const predicate = row.p.value;
//       const target = row.o.value;

//       if (!nodes.has(source)) nodes.set(source, { id: source, label: source });
//       if (!nodes.has(target)) nodes.set(target, { id: target, label: target });

//       links.push({ source, target, label: predicate });
//     });

//     return NextResponse.json({ nodes: Array.from(nodes.values()), links });
//   } catch (error) {
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : "Unknown error" },
//       { status: 500 }
//     );
//   }
// }

export async function GET(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user?.sub) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const graphId = searchParams.get("graphId");
    if (!graphId) return new NextResponse("Missing graphId", { status: 400 });

    const safeUserId = session.user.sub.replace("|", "-");
    const namespace = `http://genontoai.com/${safeUserId}/${graphId}/`;

    const REPO_NAME = process.env.GRAPHDB_REPOSITORY || "my_repository";
    const GRAPHDB_URL = process.env.GRAPHDB_URL || "http://localhost:7200";

    const sparqlQuery = `
      SELECT ?s ?p ?o
      WHERE {
        ?s ?p ?o .
        FILTER (
          STRSTARTS(STR(?s), "${namespace}") ||
          STRSTARTS(STR(?p), "${namespace}") ||
          STRSTARTS(STR(?o), "${namespace}")
        )
      }
      LIMIT 1000
    `;

    const response = await fetch(
      `${GRAPHDB_URL}/repositories/${REPO_NAME}?query=${encodeURIComponent(
        sparqlQuery
      )}`,
      { headers: { Accept: "application/sparql-results+json" } }
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: `Error fetching data - Status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // IRIs
    const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
    const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
    const RDF_PROP = "http://www.w3.org/1999/02/22-rdf-syntax-ns#Property";
    const OWL_OBJ = "http://www.w3.org/2002/07/owl#ObjectProperty";
    const OWL_DATA = "http://www.w3.org/2002/07/owl#DatatypeProperty";
    const OWL_ANN = "http://www.w3.org/2002/07/owl#AnnotationProperty";

    // helpers
    const localName = (iri: string) => {
      try {
        if (iri.startsWith(namespace))
          return decodeURIComponent(iri.slice(namespace.length));
        const i = Math.max(iri.lastIndexOf("#"), iri.lastIndexOf("/"));
        return decodeURIComponent(iri.slice(i + 1));
      } catch {
        return iri;
      }
    };

    type Node = { id: string; label: string };
    type Link = { source: string; target: string; label: string };

    // 1) Descobrir quais IRIs são "propriedades"
    const propertySet = new Set<string>();
    const propLabel = new Map<string, string>(); // label das propriedades
    const nodeLabel = new Map<string, string>(); // label dos nós "normais"

    for (const row of data.results.bindings as Array<any>) {
      const s = row.s.value as string;
      const p = row.p.value as string;
      const o = row.o.value as string;
      const oType = row.o.type as string;

      // qualquer coisa usada como predicado dentro do namespace é uma "propriedade"
      if (p.startsWith(namespace)) propertySet.add(p);

      // tipagens explícitas: s a rdf:Property / owl:*Property
      if (
        p === RDF_TYPE &&
        (o === RDF_PROP || o === OWL_OBJ || o === OWL_DATA || o === OWL_ANN)
      ) {
        propertySet.add(s);
      }

      // labels: guardamos em dois mapas (prop e node)
      if (p === RDFS_LABEL && oType === "literal") {
        if (
          propertySet.has(s) ||
          (s.startsWith(namespace) && s.includes("/rel/"))
        ) {
          propLabel.set(s, o);
        } else {
          nodeLabel.set(s, o);
        }
      }
    }

    // 2) Construir nodes/links filtrando propriedades e literais
    const nodes = new Map<string, Node>();
    const links: Link[] = [];

    for (const row of data.results.bindings as Array<any>) {
      const s = row.s.value as string;
      const p = row.p.value as string;
      const o = row.o.value as string;
      const oType = row.o.type as string;

      // Nunca transformar rdfs:label em aresta
      if (p === RDFS_LABEL) continue;

      // Ocultar rdf:type rdf:Property / owl:*Property
      if (
        p === RDF_TYPE &&
        (o === RDF_PROP || o === OWL_OBJ || o === OWL_DATA || o === OWL_ANN)
      )
        continue;

      // Não criar nó para recursos que são propriedades
      if (!propertySet.has(s)) {
        if (!nodes.has(s))
          nodes.set(s, { id: s, label: nodeLabel.get(s) || localName(s) });
      }

      // Só criamos aresta quando o objeto é IRI e não é uma propriedade
      if (oType === "uri" && !propertySet.has(o)) {
        if (!nodes.has(o))
          nodes.set(o, { id: o, label: nodeLabel.get(o) || localName(o) });

        // label da aresta = label da propriedade (se houver) ou localName do predicado
        const edgeLabel = propLabel.get(p) || localName(p);
        links.push({ source: s, target: o, label: edgeLabel });
      }
    }

    return NextResponse.json({
      nodes: Array.from(nodes.values()),
      links,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

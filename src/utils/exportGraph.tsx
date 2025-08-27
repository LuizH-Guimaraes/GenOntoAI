// utils/exportGraph.ts
// -------------------------------------------------------------
// Tipos base para export (já normalizados, sem D3):
// - nodes: { id, label?, type? }
// - links: { source, target, predicate }
// -------------------------------------------------------------

const NL = "\n";

/** Utilidades de IRI */
const isAbsIri = (s: string) => /^([a-z][a-z0-9+.-]*):/i.test(String(s).trim());
const ensureBase = (b: string) =>
  b.endsWith("#") || b.endsWith("/") ? b : b + "#";
const escapeLocal = (s: string) =>
  encodeURIComponent(String(s).trim().replace(/\s+/g, "_"));

/**
 * Para TTL/N-Triples: retorna um "term ref".
 * - Se for IRI absoluto: <http://...>
 * - Se for local: ex:local_name (mais legível do que <base+local>),
 *   assumindo que o prefixo ex esteja definido com a base.
 */
const termRef = (val: string, baseIRI: string) => {
  const v = String(val).trim();
  if (isAbsIri(v)) return `<${v}>`;
  return `ex:${escapeLocal(v)}`;
};

/** XML escape */
const q = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Download helper */
const download = (
  filename: string,
  content: string,
  mime = "text/plain;charset=utf-8"
) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Tipos de dados esperados para export */
export type NodeT = { id: string; label?: string; type?: string };
export type LinkT = { source: string; target: string; predicate: string };
export type GraphData = { nodes: NodeT[]; links: LinkT[] };

/* ------------------------------------------------------------------ */
/* 1) Turtle (TTL)                                                     */
/* ------------------------------------------------------------------ */
export function toTTL(
  graph: GraphData,
  base = "https://example.org/graph#"
): string {
  const baseIRI = ensureBase(base);

  const header = [
    `@base <${baseIRI}> .`,
    `@prefix ex: <${baseIRI}> .`,
    "@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .",
    "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
    "@prefix owl: <http://www.w3.org/2002/07/owl#> .",
    "",
  ].join(NL);

  const nodeLines = (graph.nodes ?? []).map((n) => {
    const s = termRef(n.id, baseIRI);
    const t = n.type ? `${NL}  rdf:type ${termRef(n.type, baseIRI)} ;` : "";
    const l = n.label
      ? `${NL}  rdfs:label "${String(n.label).replace(/"/g, '\\"')}" ;`
      : "";
    return `${s} ${t}${l}`.replace(/;\s*$/, ".");
  });

  const edgeLines = (graph.links ?? []).map(
    (e) =>
      `${termRef(e.source, baseIRI)} ${termRef(e.predicate, baseIRI)} ${termRef(
        e.target,
        baseIRI
      )} .`
  );

  return (
    header +
    nodeLines.join(NL) +
    (nodeLines.length ? NL + NL : "") +
    edgeLines.join(NL) +
    NL
  );
}

/* ------------------------------------------------------------------ */
/* 2) JSON-LD                                                          */
/* ------------------------------------------------------------------ */
export function toJSONLD(
  graph: GraphData,
  base = "https://example.org/graph#"
): string {
  const baseIRI = ensureBase(base);
  const absOrBase = (v: string) => (isAbsIri(v) ? v : baseIRI + escapeLocal(v));

  const ctx: Record<string, string> = {
    "@vocab": baseIRI,
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    owl: "http://www.w3.org/2002/07/owl#",
    label: "rdfs:label",
    type: "@type",
    id: "@id",
  };

  const nodes = (graph.nodes ?? []).map((n) => {
    const obj: any = { "@id": absOrBase(n.id) };
    if (n.type) obj["@type"] = absOrBase(n.type);
    if (n.label) obj["label"] = n.label;
    return obj;
  });

  // Cada relação vira uma “declaração” com o sujeito em @id
  // A key (predicado) pode ser termo local (ex.: "likes") ou IRI absoluta
  const edges = (graph.links ?? []).map((e) => ({
    "@id": absOrBase(e.source),
    [isAbsIri(e.predicate) ? e.predicate : e.predicate]: {
      "@id": absOrBase(e.target),
    },
  }));

  return JSON.stringify(
    { "@context": ctx, "@graph": [...nodes, ...edges] },
    null,
    2
  );
}

/* ------------------------------------------------------------------ */
/* 3) GraphML                                                          */
/* ------------------------------------------------------------------ */
export function toGraphML(graph: GraphData): string {
  const header =
    `<?xml version="1.0" encoding="UTF-8"?>${NL}` +
    `<graphml xmlns="http://graphml.graphdrawing.org/xmlns"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">
  <key id="label" for="node" attr.name="label" attr.type="string"/>
  <key id="type" for="node" attr.name="type" attr.type="string"/>
  <key id="predicate" for="edge" attr.name="predicate" attr.type="string"/>
  <graph id="G" edgedefault="directed">
`;

  const nodes = (graph.nodes ?? [])
    .map(
      (n) =>
        `    <node id="${q(n.id)}">
      ${n.label ? `<data key="label">${q(n.label)}</data>` : ""}
      ${n.type ? `<data key="type">${q(n.type)}</data>` : ""}
    </node>`
    )
    .join(NL);

  const edges = (graph.links ?? [])
    .map(
      (e, idx) =>
        `    <edge id="e${idx}" source="${q(e.source)}" target="${q(e.target)}">
      <data key="predicate">${q(e.predicate)}</data>
    </edge>`
    )
    .join(NL);

  const footer = `
  </graph>
</graphml>${NL}`;

  return header + nodes + NL + edges + footer;
}

/* ------------------------------------------------------------------ */
/* 4) CSV (nodes.csv e edges.csv)                                      */
/* ------------------------------------------------------------------ */
export function toCSV(graph: GraphData): {
  nodesCsv: string;
  edgesCsv: string;
} {
  const nodesHeader = "id,label,type";
  const nodesRows = (graph.nodes ?? []).map((n) =>
    [n.id, n.label ?? "", n.type ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const nodesCsv = [nodesHeader, ...nodesRows].join(NL);

  const edgesHeader = "source,predicate,target";
  const edgesRows = (graph.links ?? []).map((e) =>
    [e.source, e.predicate, e.target]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const edgesCsv = [edgesHeader, ...edgesRows].join(NL);

  return { nodesCsv, edgesCsv };
}

/* ------------------------------------------------------------------ */
/* 5) OWL/XML (RDF/XML com OWL)                                        */
/* ------------------------------------------------------------------ */
export function toOWLXML(
  graph: GraphData,
  base = "https://example.org/graph#"
): string {
  const baseIRI = ensureBase(base);
  const resIRI = (v: string) => (isAbsIri(v) ? v : baseIRI + escapeLocal(v));

  const header = `<?xml version="1.0"?>
<rdf:RDF
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
  xmlns:owl="http://www.w3.org/2002/07/owl#"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
  xml:base="${baseIRI}">
  <owl:Ontology rdf:about=""/>
`;

  // Classes a partir de node.type
  const classSet = new Set<string>();
  (graph.nodes ?? []).forEach((n) => n.type && classSet.add(n.type));
  const classDecls = [...classSet]
    .map((t) => `  <owl:Class rdf:about="${resIRI(t)}"/>`)
    .join(NL);

  // ObjectProperties a partir de predicates
  const propSet = new Set<string>((graph.links ?? []).map((e) => e.predicate));
  const propDecls = [...propSet]
    .map((p) => `  <owl:ObjectProperty rdf:about="${resIRI(p)}"/>`)
    .join(NL);

  // Indivíduos
  const individuals = (graph.nodes ?? [])
    .map((n) => {
      const typeLine = n.type
        ? `    <rdf:type rdf:resource="${resIRI(n.type)}"/>${NL}`
        : "";
      const labelLine = n.label
        ? `    <rdfs:label>${q(n.label)}</rdfs:label>${NL}`
        : "";
      return `  <owl:NamedIndividual rdf:about="${resIRI(n.id)}">
${typeLine}${labelLine}  </owl:NamedIndividual>`;
    })
    .join(NL);

  // Axiomas (triples)
  const assertions = (graph.links ?? [])
    .map(
      (e) => `  <owl:Axiom>
    <owl:annotatedSource rdf:resource="${resIRI(e.source)}"/>
    <owl:annotatedProperty rdf:resource="${resIRI(e.predicate)}"/>
    <owl:annotatedTarget rdf:resource="${resIRI(e.target)}"/>
  </owl:Axiom>`
    )
    .join(NL);

  return (
    header +
    classDecls +
    NL +
    propDecls +
    NL +
    individuals +
    NL +
    assertions +
    NL +
    "</rdf:RDF>" +
    NL
  );
}

/* ------------------------------------------------------------------ */
/* Helpers de download                                                 */
/* ------------------------------------------------------------------ */
export function exportTTL(graph: GraphData, baseIRI?: string) {
  download("graph.ttl", toTTL(graph, baseIRI), "text/turtle;charset=utf-8");
}
export function exportJSONLD(graph: GraphData, baseIRI?: string) {
  download(
    "graph.jsonld",
    toJSONLD(graph, baseIRI),
    "application/ld+json;charset=utf-8"
  );
}
export function exportGraphML(graph: GraphData) {
  download("graph.graphml", toGraphML(graph), "application/xml;charset=utf-8");
}
export function exportCSV(graph: GraphData) {
  const { nodesCsv, edgesCsv } = toCSV(graph);
  download("nodes.csv", nodesCsv, "text/csv;charset=utf-8");
  download("edges.csv", edgesCsv, "text/csv;charset=utf-8");
}
export function exportOWLXML(graph: GraphData, baseIRI?: string) {
  download(
    "graph.owl.xml",
    toOWLXML(graph, baseIRI),
    "application/rdf+xml;charset=utf-8"
  );
}

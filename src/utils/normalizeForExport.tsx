// utils/normalizeForExport.ts
type D3Node = { id: string; label?: string; type?: string } & Record<
  string,
  any
>;
type D3Link = {
  source: string | { id: string };
  target: string | { id: string };
  label?: string;
  predicate?: string;
} & Record<string, any>;

export type ExportNode = { id: string; label?: string; type?: string };
export type ExportLink = { source: string; target: string; predicate: string };
export type ExportGraph = { nodes: ExportNode[]; links: ExportLink[] };

const nodeId = (n: string | { id: string }) =>
  typeof n === "string" ? n : n.id;

export function normalizeForExport(g: {
  nodes: D3Node[];
  links: D3Link[];
}): ExportGraph {
  return {
    nodes: (g.nodes ?? []).map((n) => ({
      id: n.id,
      label: n.label ?? undefined,
      type: n.type ?? undefined,
    })),
    links: (g.links ?? []).map((l) => ({
      source: nodeId(l.source),
      target: nodeId(l.target),
      predicate: l.predicate ?? l.label ?? "relatedTo",
    })),
  };
}

import * as d3 from "d3";

export interface Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

export interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  label: string; // usamos como "predicate"
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

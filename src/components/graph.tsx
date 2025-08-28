"use client";
import React from "react";

interface GraphProps {
  graphId: string;
  selectNode: (node: { id: string; label: string }) => void;
  onUpdateGraph: (graphData: any) => void;
  onSelectEdge?: (edge: {
    sourceId: string;
    targetId: string;
    label: string;
  }) => void;
}

export default function Graph({
  graphId,
  selectNode,
  onSelectEdge,
  onUpdateGraph,
}: GraphProps) {
  return <div>Batata</div>;
}

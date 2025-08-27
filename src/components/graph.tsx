"use client";

import React, { useEffect, useRef, useState } from "react";
import type { GraphData, Link, Node } from "@/lib/types";
import * as d3 from "d3";
import { cleanLabel } from "@/lib/stringFormatter";

interface GraphProps {
  graphId: string;
  selectNode: (node: { id: string; label: string }) => void;
  onUpdateGraph: (graphData: GraphData) => void;
  onSelectEdge?: (edge: {
    sourceId: string;
    targetId: string;
    label: string;
  }) => void;
}

const Graph: React.FC<GraphProps> = ({
  graphId,
  selectNode,
  onSelectEdge,
  onUpdateGraph,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });

  // Fetch data
  useEffect(() => {
    let aborted = false;
    async function fetchData() {
      try {
        const response = await fetch(
          `/api/graph?graphId=${encodeURIComponent(graphId)}`
        );
        if (!response.ok)
          throw new Error(`Failed to fetch graph: ${response.status}`);
        const json = await response.json();
        if (!aborted) {
          setGraphData(json);
          onUpdateGraph(json);
        }
      } catch (error) {
        if (!aborted) console.error("Error fetching graph data:", error);
      }
    }
    fetchData();
    return () => {
      aborted = true;
    };
  }, [graphId]);

  // Draw graph
  useEffect(() => {
    if (!svgRef.current || !graphData?.nodes?.length) return;

    const width = 800;
    const height = 600;
    const { nodes, links } = graphData;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // clear previous render
    svg.selectAll("*").remove();

    // zoom container
    const zoomGroup = svg.append("g");

    svg.call(
      d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      })
    );

    // arrow defs
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // simulation
    const simulation = d3
      .forceSimulation<Node>(nodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>(links)
          .id((d) => d.id)
          .distance(200)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    // ---- EDGES (group -> visible line + hit line + label)
    const linkGroup = zoomGroup
      .selectAll<SVGGElement, Link>("g.link")
      .data(links)
      .enter()
      .append("g")
      .attr("class", "link");

    const linkVisible = linkGroup
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");

    // big invisible stroke to improve clickability
    const linkHit = linkGroup
      .append("line")
      .attr("stroke", "transparent")
      .attr("stroke-width", 14)
      .style("cursor", "pointer")
      .style("pointer-events", "stroke")
      .on("mouseover", function () {
        d3.select(this.previousSibling as SVGLineElement)
          .attr("stroke-opacity", 0.9)
          .attr("stroke-width", 3);
      })
      .on("mouseout", function () {
        d3.select(this.previousSibling as SVGLineElement)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", 2);
      })
      .on("click", (event, d) => {
        const s = (d.source as any).id ?? d.source;
        const t = (d.target as any).id ?? d.target;
        onSelectEdge?.({
          sourceId: String(s),
          targetId: String(t),
          label: d.label,
        });
      });

    const linkLabels = linkGroup
      .append("text")
      .attr("class", "link-label")
      .attr("font-size", "12px")
      .attr("fill", "#666")
      .attr("text-anchor", "middle")
      .style("pointer-events", "auto")
      .style("cursor", "pointer")
      .text((d) => cleanLabel(d.label))
      .on("click", (event, d) => {
        const s = (d.source as any).id ?? d.source;
        const t = (d.target as any).id ?? d.target;
        onSelectEdge?.({
          sourceId: String(s),
          targetId: String(t),
          label: d.label,
        });
      });

    // ---- NODES
    const node = zoomGroup
      .selectAll<SVGCircleElement, Node>("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 20)
      .attr("fill", "#007AFF")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        selectNode({ id: d.id, label: d.label });
      })
      .call(
        d3
          .drag<SVGCircleElement, Node>()
          .on("start", dragStart)
          .on("drag", dragging)
          .on("end", dragEnd)
      );

    const labels = zoomGroup
      .selectAll<SVGTextElement, Node>("text.node-label")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "node-label")
      .attr("font-size", "14px")
      .attr("text-anchor", "middle")
      .attr("dy", -25)
      .attr("fill", "#000")
      .text((d) => cleanLabel(d.label));

    // tick
    simulation.on("tick", () => {
      // edges
      linkVisible
        .attr("x1", (d) => (d.source as Node).x ?? 0)
        .attr("y1", (d) => (d.source as Node).y ?? 0)
        .attr("x2", (d) => (d.target as Node).x ?? 0)
        .attr("y2", (d) => (d.target as Node).y ?? 0);

      linkHit
        .attr("x1", (d) => (d.source as Node).x ?? 0)
        .attr("y1", (d) => (d.source as Node).y ?? 0)
        .attr("x2", (d) => (d.target as Node).x ?? 0)
        .attr("y2", (d) => (d.target as Node).y ?? 0);

      linkLabels
        .attr(
          "x",
          (d) => (((d.source as Node).x ?? 0) + ((d.target as Node).x ?? 0)) / 2
        )
        .attr(
          "y",
          (d) => (((d.source as Node).y ?? 0) + ((d.target as Node).y ?? 0)) / 2
        );

      // nodes
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      labels.attr("x", (d) => d.x ?? 0).attr("y", (d) => (d.y ?? 0) - 15);
    });

    // drag handlers
    function dragStart(
      event: d3.D3DragEvent<SVGCircleElement, Node, unknown>,
      d: Node
    ) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragging(
      event: d3.D3DragEvent<SVGCircleElement, Node, unknown>,
      d: Node
    ) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragEnd(
      event: d3.D3DragEvent<SVGCircleElement, Node, unknown>,
      d: Node
    ) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // cleanup
    return () => {
      simulation.stop();
    };
  }, [graphData, onSelectEdge, selectNode]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-neutral-200 shadow-lg rounded-xl"
      role="img"
      aria-label="Knowledge graph"
    />
  );
};

export default Graph;

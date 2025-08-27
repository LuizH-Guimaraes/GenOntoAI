"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Graph from "@/components/graph";
import { CreateRelationship } from "./CreateModal";
import { EditModal } from "./EditModal";
import { RelationshipMap } from "./RelationshipMap";
import { useSession } from "@/app/context/SessionContext";
import { handleInsert, handleInsertMany } from "./Controller";
import { RelationshipEntity } from "@/app/_models/relationship";
import {
  cleanLabel,
  getLocalIdFromIri,
  toCamelCase,
} from "@/lib/stringFormatter";
import { GraphData } from "@/lib/types";
import GraphExportButtons from "./GraphExportButtons";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Project = {
  id: number;
  name: string;
  user_id: number;
};

type NodeType = { id: string; label: string };
type EdgeType = { sourceId: string; targetId: string; label: string };

export default function ProjectPage({ params }: PageProps) {
  const { id } = use(params);
  const { user, loading: userLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);

  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    links: [],
  });

  const [text, setText] = useState<string>("");
  const [svoList, setSvoList] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [openRelationShipMap, setOpenRelationshipMap] = useState(false);
  const [graphRefreshKey, setGraphRefreshKey] = useState(0);
  const [selectedNode, setSelectedNode] = useState<
    | {
        id: string;
        label: string;
      }
    | {
        sourceId: string;
        targetId: string;
        label: string;
      }
    | null
  >(null);

  useEffect(() => {
    async function getProject() {
      try {
        const res = await fetch(`/api/project/${id}`);
        if (!res.ok) throw new Error("Failed to fetch project");
        const data = await res.json();
        setProject(data);
      } catch (err) {
        console.error(err);
        setProject(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) getProject();
  }, [id]);

  function isNode(item: NodeType | EdgeType | null): item is NodeType {
    return !!item && !("sourceId" in item);
  }

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter or upload text before submitting.");
      return;
    }

    setSvoList([]);
    setLoading(true);

    try {
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "Failed to process text");
      }

      const data = await response.json();
      setSvoList(data.svoList || []);
      setOpenRelationshipMap(true);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while processing the text.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      alert("Only .txt files are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setText(e.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  function _handleInsert(relationship: RelationshipEntity) {
    handleInsert(relationship, user!, id).then(() =>
      setGraphRefreshKey((prev) => prev + 1)
    );
  }

  function _handleInsertMany(relationship: RelationshipEntity[]) {
    handleInsertMany(relationship, user!, id).then(() =>
      setGraphRefreshKey((prev) => prev + 1)
    );
  }

  async function handleEdit(newName: string) {
    if (!selectedNode) return;

    const label = newName.trim();
    if (!label) return;

    if (isNode(selectedNode)) {
      const newId = getLocalIdFromIri(selectedNode.id) + toCamelCase(newName);

      const res = await fetch(
        `/api/graph/nodes?graphId=${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "rename",
            id: selectedNode.id,
            newId: newId,
            label: toCamelCase(newName), // sobrescreve rdfs:label do mesmo IRI
          }),
        }
      );

      if (!res.ok) throw new Error("Rename failed");

      setGraphRefreshKey((prev) => prev + 1);
    } else {
      // ARESTA
      const newPredicateLocal = toCamelCase(newName); // ex.: "ama de" -> "ama-de"

      const res = await fetch(
        `/api/graph/edges?graphId=${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "replace-predicate",
            sourceId: selectedNode.sourceId, // pode ser IRI completo ou local; o backend resolve
            targetId: selectedNode.targetId,
            predicateId: selectedNode.label, // P atual (use o IRI que você tem em d.label)
            newPredicateId: newPredicateLocal, // P novo (local) – vira <ns/newPredicateLocal>
            label: newName, // opcional: rdfs:label do novo predicado
          }),
        }
      );

      if (!res.ok) {
        const { error } = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(error);
      }
      setGraphRefreshKey((prev) => prev + 1);
    }
  }

  async function handleDelete() {
    if (!selectedNode) return;

    if (isNode(selectedNode)) {
      await fetch(`/api/graph/nodes?graphId=${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedNode.id, scope: "both" }),
      });
    } else {
      await fetch(`/api/graph/edges?graphId=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: selectedNode.sourceId,
          predicateId: selectedNode.label, // você usa o IRI do predicado em 'label'
          targetId: selectedNode.targetId,
        }),
      });
    }

    setGraphRefreshKey((prev) => prev + 1);
  }

  if (loading || userLoading) {
    return (
      <div className="text-center mt-10 text-gray-500">Loading project...</div>
    );
  }

  if (!project) {
    return (
      <div className="text-center mt-10 text-red-500">
        Project not found or unauthorized.
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <CreateRelationship
        isOpen={showModal}
        onInsertComplete={_handleInsert}
        onClose={() => setShowModal(false)}
      />

      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEdit}
        initialValue={
          selectedNode?.label ? cleanLabel(selectedNode!.label) : ""
        }
        key={"EDIT:" + selectedNode?.label}
      />

      <RelationshipMap
        insertList={_handleInsertMany}
        svoList={svoList}
        open={openRelationShipMap}
        setOpen={setOpenRelationshipMap}
      />

      <div className="w-full text-center mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Graph: {project.name}
        </h1>
      </div>

      <div className="flex w-full h-[calc(100vh-3c00px)] p-8 gap-6 flex-col md:flex-row">
        <div className="w-full md:w-[60%] p-6 rounded-lg shadow-md flex flex-col">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 p-4 bg-white border border-gray-200 rounded-md shadow-sm">
            <div className="w-full">
              <h2 className="text-xl font-semibold text-gray-800">
                Selected:{" "}
                {selectedNode?.label ? (
                  <>
                    {cleanLabel(selectedNode.label)}
                    {isNode(selectedNode) ? "NODE" : "EDGE"}
                  </>
                ) : (
                  "None"
                )}
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
              >
                Add Relationship
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                disabled={!selectedNode}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                Edit Name
              </button>
              <button
                onClick={handleDelete}
                disabled={!selectedNode}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
              {graphData && (
                <GraphExportButtons
                  graphData={graphData}
                  baseIRI="https://projexflow.com/onto#"
                />
              )}
            </div>
          </div>
          {setSelectedNode && (
            <Graph
              key={graphRefreshKey}
              graphId={id}
              selectNode={setSelectedNode}
              onSelectEdge={setSelectedNode}
              onUpdateGraph={(graphData) => setGraphData(graphData)}
            />
          )}
        </div>

        <div className="w-full md:flex-1 p-6 rounded-lg shadow-md bg-white flex flex-col gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text here..."
            className="w-full h-full  p-3 border border-gray-300 rounded-lg text-black resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="block w-full  text-sm text-gray-500
               file:mr-4 file:py-2 file:px-4
               file:rounded-lg file:border-0
               file:text-sm file:font-semibold
               file:bg-blue-50 file:text-blue-700
               hover:file:bg-blue-100"
          />

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

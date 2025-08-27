"use client";

import { User } from "@auth0/nextjs-auth0/types";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

type DashboardPageProps = {
  user: User;
};

type Graph = {
  id: number;
  name: string;
};

export function DashBoardPage({ user }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [newGraphName, setNewGraphName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  async function getProjects(userId: number) {
    try {
      const res = await fetch(`/api/project?user_id=${userId}`);
      const data = await res.json();
      setGraphs(data || []);

      console.log(data);
    } catch (error) {
      console.error("Erro ao buscar projetos:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      const registerUser = async () => {
        try {
          const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              auth0_id: user.sub,
            }),
          });

          const data = await response.json();
          setUserId(data.user.id);
          getProjects(data.user.id);
        } catch (error) {
          console.error("Erro ao registrar usuário:", error);
        } finally {
          setLoading(false);
        }
      };

      registerUser();
    }
  }, [user]);

  const handleAddGraph = async () => {
    if (!newGraphName.trim() || !userId) return;

    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGraphName.trim(),
          user_id: userId,
        }),
      });

      const newProject = await response.json();
      setGraphs((prev) => [newProject, ...prev]);
      setNewGraphName("");
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/project/${id}`, {
        method: "DELETE",
      });

      setGraphs((prev) => prev.filter((g) => g.id !== id));
    } catch (error) {
      console.error("Erro ao deletar projeto:", error);
    }
  };

  const handleRename = async (id: number) => {
    if (!editValue.trim()) return;

    try {
      const response = await fetch(`/api/project/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue }),
      });

      const updated = await response.json();
      setGraphs((prev) =>
        prev.map((g) => (g.id === id ? { ...g, name: updated.name } : g))
      );
    } catch (error) {
      console.error("Erro ao renomear projeto:", error);
    } finally {
      setEditingId(null);
      setEditValue("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-12 bg-white rounded-xl shadow-md p-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Dashboard
      </h3>

      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          value={newGraphName}
          onChange={(e) => setNewGraphName(e.target.value)}
          placeholder="New graph name"
          className="flex-1 px-4 py-2 border rounded-md"
        />
        <button
          onClick={handleAddGraph}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Create
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed text-sm border border-gray-200">
          <thead className="bg-gray-100 text-left">
            <tr>
              <ResizableTh>ID</ResizableTh>
              <ResizableTh>Name</ResizableTh>
              <th className="p-3 bg-gray-100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {graphs.map((graph) => (
              <tr key={graph.id} className="border-t">
                <td className="p-3 text-gray-700 border-r border-gray-300">
                  {graph.id}
                </td>
                <td className="p-3 border-r border-gray-300">
                  {editingId === graph.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                  ) : (
                    <Link
                      href={`/protected/graph/${graph.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {graph.name}
                    </Link>
                  )}
                </td>
                <td className="p-3 space-x-2 border-r border-gray-300">
                  {editingId === graph.id ? (
                    <button
                      onClick={() => handleRename(graph.id)}
                      className="w-24 m-0.5 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(graph.id);
                        setEditValue(graph.name);
                      }}
                      className="w-24 m-0.5 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      Rename
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(graph.id)}
                    className="w-24  m-0.5 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {graphs.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No graphs created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-center mt-8">
        <Link href="/protected/profile">
          <button className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-red-700">
            Profile
          </button>
        </Link>
      </div>
    </div>
  );
}

// 🔧 Resizable column component
function ResizableTh({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startWidth = 0;

    const handleMouseDown = (e: MouseEvent) => {
      startX = e.clientX;
      startWidth = el.offsetWidth;
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      el.style.width = `${newWidth}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const resizer = document.createElement("div");
    resizer.className = "resizer";
    resizer.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 6px;
      height: 100%;
      cursor: col-resize;
      user-select: none;
      z-index: 10;
    `;
    resizer.addEventListener("mousedown", handleMouseDown);
    el.style.position = "relative";
    el.appendChild(resizer);

    return () => {
      resizer.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <th
      ref={ref}
      className="p-3 whitespace-nowrap bg-gray-100 font-medium text-gray-700 border-r border-gray-300"
    >
      {children}
    </th>
  );
}

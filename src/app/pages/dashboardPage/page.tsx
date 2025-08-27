"use client";

import Graph from "@/components/graph";
import { Navbar } from "@/components/navbar";
import React, { useEffect, useState } from "react";
import { CreateRelationship } from "./CreateModal";
import { RelationshipMap } from "./RelationshipMap";

export default function HomePage() {
  const [text, setText] = useState<string>(""); // Stores user input
  const [svoList, setSvoList] = useState<string[]>([]); // Stores extracted SVOs
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const [showModal, setShowModal] = useState(false);

  const [graphRefreshKey, setGraphRefreshKey] = useState(0);
  const [openRelationShipMap, setOpenRelationshipMap] = useState(true);

  // Handle form submission
  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter or upload text before submitting.");
      return;
    }

    setLoading(true);
    setSvoList([]);
    setLoading(false);

    // try {
    //   const response = await fetch("/api/openai/", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ text }), // Send text input
    //   });

    //   if (!response.ok) {
    //     throw new Error("Failed to fetch SVO data.");
    //   }

    //   const data = await response.json();

    //   console.log(data);
    //   setSvoList(data.svoList || []);
    // } catch (error) {
    //   console.error("Error:", error);
    //   alert("Error processing the request.");
    // } finally {
    //   setLoading(false);
    // }
  };

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      if (file.type !== "text/plain") {
        alert("Only .txt files are allowed.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setText(e.target.result as string); // Directly update text
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    console.log("Fetching data from the server...");

    async function fetchData() {
      const response = await fetch("/api");
      const data = await response.json();
      console.log(data);
    }

    fetchData();
  }, []);

  return (
    <div className="flex flex-col w-full">
      <CreateRelationship
        onInsertComplete={() => {
          console.log("Fazer alguma coisa");
        }}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
        }}
      />

      <RelationshipMap
        open={openRelationShipMap}
        setOpen={setOpenRelationshipMap}
      />

      {/* Main Layout */}
      <div className="flex w-full h-[calc(100vh-80px)] p-8 gap-6">
        {/* Left Section - 60% */}
        <div className="w-[60%] bg-gray-100 p-6 rounded-lg shadow-md flex flex-col">
          {/* <Graph key={graphRefreshKey} /> */}

          {/* Show SVO Results */}
          {svoList.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Extracted SVOs:</h3>
              <ul className="mt-2 text-sm text-gray-700">
                {svoList.map((svo, index) => (
                  <li key={index} className="border-b py-2">
                    {svo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Section - 40% */}
        <div className="w-[40%] bg-white p-6 rounded-lg shadow-md flex flex-col justify-between">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your text here..."
            className="w-full p-3 border h-full border-gray-300 rounded-lg text-black resize-none focus:ring-0 focus:ring-black"
          />
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 cursor-pointer"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing..." : "Submit"}
          </button>
          {/* <button
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Abrir Modal
          </button> */}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useRef, useEffect, Fragment } from "react";
import Modal from "@/components/Modal";
import { RelationshipEntity } from "../../_models/relationship";
import { relationshipOptions } from "@/constants/relationshipOptions";

type CreateRelationshipProps = {
  isOpen: boolean;
  onClose: () => void;
  onInsertComplete: (relationship: RelationshipEntity) => void;
};

export function CreateRelationship({
  isOpen,
  onClose,
  onInsertComplete,
}: CreateRelationshipProps) {
  const [subject, setSubject] = useState("");
  const [predicate, setPredicate] = useState("rdfs:subClassOf");
  const [object, setObject] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const namespace = "http://example.org/";

  const handleInsert = async () => {
    onInsertComplete?.({ subject, relationship: predicate, object });
    setSubject("");
    setPredicate("rdfs:subClassOf");
    setObject("");
    onClose(); // fecha o modal
  };
  const handleInsert1 = async () => {
    setMessage(null);
    setError(null);

    const formattedSubject = `<${namespace}${subject}>`;
    const formattedObject = `<${namespace}${object}>`;

    const updateQuery = `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    INSERT DATA {
      ${formattedSubject} <${predicate}> ${formattedObject} .
    }
  `;

    try {
      const response = await fetch("/api/graph/insert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updateQuery }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error);
      }

      setMessage(json.success || "Inserted successfully.");
      onInsertComplete?.({ subject, relationship: predicate, object });
      onClose(); // fecha o modal
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  };

  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenDirection(
        spaceBelow < 200 && spaceAbove > spaceBelow ? "up" : "down"
      );
    }
  }, [isDropdownOpen]);

  const getPredicateLabel = (value: string) => {
    for (const group of relationshipOptions) {
      const found = group.options.find((opt) => opt.value === value);
      if (found) return found.label;
    }
    return value;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Create New Relationship
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Fill in the subject, relation and object
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Subject */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Person"
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Custom Dropdown */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Relationship (Predicate)
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
            >
              {getPredicateLabel(predicate)} ▾
            </button>

            {isDropdownOpen && (
              <div
                className={`absolute z-50 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto ${
                  openDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"
                }`}
              >
                {relationshipOptions.map((group) => (
                  <Fragment key={group.label}>
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                      {group.label}
                    </div>
                    {group.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setPredicate(opt.value);
                          setIsDropdownOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Object */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Object</label>
          <input
            type="text"
            value={object}
            onChange={(e) => setObject(e.target.value)}
            placeholder="e.g. Thing"
            className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-black bg-gray-100 rounded-md transition"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            handleInsert();
            // console.log({ subject, predicate, object });
            // onClose();
          }}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

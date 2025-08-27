"use client";
import { useState, useRef, useEffect, Fragment } from "react";
import Modal from "@/components/Modal";
import { RelationshipEntity } from "@/app/_models/relationship";
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
  const [isCustom, setIsCustom] = useState(false);
  const [customRelation, setCustomRelation] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const namespace = "http://example.org/";

  const handleInsert = async () => {
    const finalPredicate = isCustom ? customRelation : predicate;
    onInsertComplete?.({ subject, relationship: finalPredicate, object });
    setSubject("");
    setPredicate("rdfs:subClassOf");
    setObject("");
    setIsCustom(false);
    setCustomRelation("");
    onClose();
  };

  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      console.log(spaceBelow);
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
            {isCustom ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customRelation}
                  onChange={(e) => setCustomRelation(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter custom relation"
                />
                <button
                  onClick={() => {
                    setIsCustom(false);
                    setCustomRelation("");
                  }}
                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md border border-blue-300"
                  title="Back"
                >
                  ←
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
                >
                  {getPredicateLabel(predicate)} ▾
                </button>

                {isDropdownOpen && (
                  <div
                    className={`absolute z-50 w-[300px] bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto ${
                      openDirection === "up"
                        ? "bottom-full mb-1"
                        : "top-full mt-1"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setIsCustom(true);
                        setIsDropdownOpen(false);
                        setCustomRelation("");
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 border-b"
                    >
                      Custom Relation
                    </button>
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
              </>
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
          onClick={handleInsert}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

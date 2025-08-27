"use client";
import { RelationshipEntity } from "@/app/_models/relationship";
import { relationshipOptions } from "@/constants/relationshipOptions";
import { useState, useRef, useEffect, Fragment } from "react";

type SVO_CardProps = {
  deleteRelationship: (idToDelete: number) => void;
  relationship: RelationshipEntity;
  updateList: (relationship: RelationshipEntity, index: number) => void;
};

export default function SVO_Card({
  deleteRelationship,
  relationship,
  updateList,
}: SVO_CardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState(
    relationship.relationship
  );
  const [openDirection, setOpenDirection] = useState<"up" | "down">("down");

  const dropdownButtonRef = useRef<HTMLDivElement>(null);
  const [editingSubject, setEditingSubject] = useState(false);
  const [editingObject, setEditingObject] = useState(false);
  const [subject, setSubject] = useState(relationship.subject);
  const [object, setObject] = useState(relationship.object);
  const [customRelation, setCustomRelation] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const prevValue = relationship.relationship;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && dropdownButtonRef.current) {
      const rect = dropdownButtonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenDirection(
        spaceBelow < 400 && spaceAbove > spaceBelow ? "up" : "down"
      );
    }
  }, [isDropdownOpen]);

  const flatRelations = relationshipOptions.flatMap((group) => group.options);

  const getRelationLabel = (value: string) => {
    const found = flatRelations.find((rel) => rel.value === value);
    return found?.label || value;
  };

  return (
    <div
      className={`relative w-full max-w-md rounded-lg px-4 py-2 shadow-sm bg-white/80 backdrop-blur-md border border-gray-200 animate-fade-in transition-all ${
        isDropdownOpen ? "z-10" : "z-0"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-gray-700">
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          {/* Subject (editável) */}
          {editingSubject ? (
            <input
              className="min-w-0 max-w-full px-2 py-1 rounded-md border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              onBlur={() => {
                setEditingSubject(false);
                updateList(
                  {
                    subject,
                    object,
                    relationship: relationship.relationship,
                  },
                  relationship.id!
                );
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingSubject(false);
                  updateList(
                    {
                      subject,
                      object,
                      relationship: relationship.relationship,
                    },
                    relationship.id!
                  );
                }
              }}
              autoFocus
            />
          ) : (
            <span
              onClick={() => setEditingSubject(true)}
              className="min-w-0 max-w-full truncate px-2 py-1 bg-blue-100 text-blue-800 rounded-md cursor-pointer hover:bg-blue-200"
            >
              {subject}
            </span>
          )}

          {/* Custom Dropdown */}
          <div className="relative" ref={dropdownButtonRef}>
            {!isCustom ? (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
              >
                {getRelationLabel(selectedRelation)} ▾
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customRelation}
                  onChange={(e) => setCustomRelation(e.target.value)}
                  onBlur={() => {
                    if (!customRelation.trim()) {
                      setIsCustom(false);
                      setCustomRelation("");
                      updateList(
                        { subject, relationship: customRelation, object },
                        relationship.id!
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    updateList(
                      { subject, relationship: customRelation, object },
                      relationship.id!
                    );
                  }}
                  className="flex-1 px-2 py-1 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  placeholder="Enter custom relation"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsCustom(false);
                    setCustomRelation("");
                  }}
                  className="text-sm px-1 cursor-pointer  bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md border border-blue-300"
                  title="Voltar"
                >
                  ←
                </button>
              </div>
            )}

            {isDropdownOpen && (
              <div
                className={`absolute z-50 w-[300px] bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto ${
                  openDirection === "up" ? "bottom-full mb-1" : "top-full mt-1"
                }`}
              >
                <button
                  onClick={() => {
                    setIsCustom(true);
                    setIsDropdownOpen(false);
                    setCustomRelation(""); // limpa campo
                    updateList(
                      {
                        subject,
                        relationship: getRelationLabel(selectedRelation),
                        object,
                      },
                      relationship.id!
                    );
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
                          setSelectedRelation(opt.value);
                          setIsDropdownOpen(false);
                          updateList(
                            {
                              subject,
                              relationship: getRelationLabel(opt.value),
                              object,
                            },
                            relationship.id!
                          );
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                          selectedRelation === opt.value
                            ? "bg-gray-100 font-semibold"
                            : ""
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Object (editável) */}
          {editingObject ? (
            <input
              className="min-w-0 max-w-full px-2 py-1 rounded-md border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500"
              value={object}
              onChange={(e) => setObject(e.target.value)}
              onBlur={() => {
                setEditingObject(false);
                updateList(
                  {
                    subject,
                    relationship: relationship.relationship,
                    object,
                  },
                  relationship.id!
                );
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingObject(false);
                  updateList(
                    {
                      subject,
                      relationship: relationship.relationship,
                      object,
                    },
                    relationship.id!
                  );
                }
              }}
              autoFocus
            />
          ) : (
            <span
              onClick={() => setEditingObject(true)}
              className="min-w-0 max-w-full truncate px-2 py-1 bg-green-100 text-green-800 rounded-md cursor-pointer hover:bg-green-200"
            >
              {object}
            </span>
          )}
        </div>

        <button
          onClick={() => deleteRelationship(relationship.id!)}
          className="text-white bg-red-500 hover:bg-red-600 rounded-md px-2 py-1 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

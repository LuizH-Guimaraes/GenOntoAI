import SVO_Card from "@/components/SVO_Cards";
import SlideOver from "@/components/SlideOver";
import { Dispatch, SetStateAction, useState } from "react";
import { CreateRelationship } from "./CreateModal";
import { RelationshipEntity } from "../../_models/relationship";

type RelationshipMapProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function RelationshipMap({ open, setOpen }: RelationshipMapProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [relationshipList, setRelationshipList] =
    useState<RelationshipEntity[]>();

  function addRelationship(
    newRelationshipData: Omit<RelationshipEntity, "id">
  ) {
    setRelationshipList((prev) => {
      const list = prev || [];

      const maxId = Math.max(
        ...list
          .map((r) => r.id)
          .filter((id): id is number => typeof id === "number"),
        0 // fallback se a lista estiver vazia
      );

      const newId = maxId + 1;

      const newRelationship: RelationshipEntity = {
        id: newId,
        ...newRelationshipData,
      };

      return [...list, newRelationship];
    });
  }

  return (
    <SlideOver isOpen={open} onClose={() => setOpen(false)} side="right">
      <CreateRelationship
        isOpen={createModalOpen}
        onInsertComplete={(relationship) => {
          addRelationship(relationship);
        }}
        onClose={() => setCreateModalOpen(false)}
      />
      <div className="flex flex-col h-[calc(100vh-90px)]">
        {/* Cabeçalho */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Relationship Map
          </h2>
          <p className="text-sm text-gray-500">
            Define relationships between subject and object
          </p>
        </div>

        {/* Conteúdo que preenche o espaço e rola */}
        <div className="flex-1 overflow-y-auto border border-slate-100 bg-slate-50 rounded-lg p-4 shadow-sm">
          <div className=" flex flex-col gap-2">
            {/* {relationshipList?.map((relationship) => (
              // <SVO_Card relationship={relationship} onDelete={() => {}} />
            ))} */}
          </div>
        </div>

        {/* Rodapé fixo */}
        <div className="mt-4 pt-4 border-t border-gray-200 bg-white flex flex-col gap-3">
          <button
            className="w-full  py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            onClick={() => setCreateModalOpen(true)}
          >
            Create New
          </button>
          <button className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
            Save
          </button>
        </div>
      </div>
    </SlideOver>
  );
}

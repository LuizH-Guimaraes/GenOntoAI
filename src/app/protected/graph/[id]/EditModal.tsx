"use client";
import { useState } from "react";
import Modal from "@/components/Modal";

type EditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  onSave: (newName: string) => void;
};

export function EditModal({
  isOpen,
  onClose,
  initialValue = "",
  onSave,
}: EditModalProps) {
  const [name, setName] = useState(initialValue);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">Edit Name</h2>
        <p className="text-sm text-gray-500">Update the name and click save.</p>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter new name"
        className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:text-black bg-gray-100 rounded-md transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

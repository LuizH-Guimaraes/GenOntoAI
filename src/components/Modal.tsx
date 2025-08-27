"use client";
import { ReactNode, useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 rounded-[28px] p-8 shadow-2xl bg-white backdrop-blur-lg border border-white/20 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl transition-opacity cursor-pointer border-2 rounded-md px-2"
          aria-label="Fechar modal"
        >
          &times;
        </button>
        <div className="text-gray-900 text-sm sm:text-base leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef } from "react";

type SlideOverProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: "left" | "right"; // 🔁 novo parâmetro
};

export default function SlideOver({
  isOpen,
  onClose,
  children,
  side = "right", // 🔁 padrão é 'right'
}: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onClose]);

  const isRight = side === "right";

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Slide Panel */}
      <div
        ref={panelRef}
        className={`
          absolute top-0 h-full max-h-svh w-[480px] max-w-full bg-white shadow-xl transform transition-transform duration-300
          ${isRight ? "right-0 rounded-l-xl" : "left-0 rounded-r-xl"}
          ${
            isOpen
              ? "translate-x-0"
              : isRight
              ? "translate-x-full"
              : "-translate-x-full"
          }
          p-4
        `}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-4 text-gray-600 hover:text-black text-2xl`}
          aria-label="Fechar"
        >
          &times;
        </button>
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}

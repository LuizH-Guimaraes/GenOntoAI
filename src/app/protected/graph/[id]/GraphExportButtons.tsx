// GraphExportMenu.tsx
"use client";
import React, { useRef, useEffect, useState } from "react";
import {
  exportTTLFromD3,
  exportJSONLDFromD3,
  exportGraphMLFromD3,
  exportCSVFromD3,
  exportOWLXMLFromD3,
} from "@/utils/exportFromD3";

type Props = {
  graphData: { nodes: any[]; links: any[] } | null;
  baseIRI?: string; // ex: "https://projexflow.com/onto#"
  variant?: "dropdown" | "split";
};

export default function GraphExportMenu({
  graphData,
  baseIRI,
  variant = "dropdown",
}: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [align, setAlign] = useState<"left" | "right">("right");
  const disabled = !graphData || !graphData.nodes?.length;

  // largura do menu (w-56 = 14rem ~= 224px)
  const MENU_W = 224;

  const closeMenu = () => {
    if (detailsRef.current?.open) detailsRef.current.open = false;
  };

  const run = (fn: () => void) => () => {
    if (disabled) return;
    fn();
    closeMenu();
  };

  // Auto-flip quando abrir
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;

    const onToggle = () => {
      if (!el.open) return;
      const rect = el.getBoundingClientRect();
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      if (spaceLeft < MENU_W && spaceRight >= MENU_W) setAlign("left");
      else setAlign("right");
    };

    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, []);

  // Se ficar desabilitado, fecha o menu
  useEffect(() => {
    if (disabled) closeMenu();
  }, [disabled]);

  const MenuList = (
    <div
      className={`absolute ${
        align === "right" ? "right-0" : "left-0"
      } z-20 mt-2 w-56
                  overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg`}
      role="menu"
      aria-label="Export options"
    >
      <button
        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
        onClick={run(() => exportJSONLDFromD3(graphData!, baseIRI))}
        role="menuitem"
      >
        JSON-LD
      </button>
      <button
        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
        onClick={run(() => exportTTLFromD3(graphData!, baseIRI))}
        role="menuitem"
      >
        Turtle (.ttl)
      </button>
      <button
        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
        onClick={run(() => exportGraphMLFromD3(graphData!))}
        role="menuitem"
      >
        GraphML
      </button>
      <button
        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
        onClick={run(() => exportCSVFromD3(graphData!))}
        role="menuitem"
      >
        CSV (nodes & edges)
      </button>
      <button
        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
        onClick={run(() => exportOWLXMLFromD3(graphData!, baseIRI))}
        role="menuitem"
      >
        OWL/XML
      </button>
    </div>
  );

  if (variant === "split") {
    // Botão principal exporta JSON-LD; setinha abre menu
    return (
      <details ref={detailsRef} className="relative inline-flex">
        <summary
          className="list-none flex"
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }} // 👈 bloqueia abrir
        >
          <button
            disabled={disabled}
            className="rounded-l-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={(e) => {
              e.preventDefault(); // evita toggle do <details>
              if (!disabled) exportJSONLDFromD3(graphData!, baseIRI);
            }}
            aria-label="Export JSON-LD"
            title="Export JSON-LD (default)"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className="mr-1 inline-block align-[-2px]"
            >
              <path
                fill="currentColor"
                d="M5 20h14v-2H5v2zm7-18l-5 5h3v6h4V7h3l-5-5z"
              />
            </svg>
            Export
          </button>
          <span
            className={`rounded-r-lg border-l border-white/20 px-2 py-2 text-white ${
              disabled
                ? "bg-slate-500 opacity-50"
                : "bg-slate-800 hover:bg-slate-700"
            }`}
            aria-hidden
          >
            ▾
          </span>
        </summary>
        {!disabled && MenuList}
      </details>
    );
  }

  // Variante padrão: um único botão que abre o menu
  return (
    <details ref={detailsRef} className="relative inline-block">
      <summary
        className={`list-none select-none rounded-lg px-3 py-2 text-sm text-white shadow-sm ${
          disabled
            ? "bg-slate-500 opacity-50"
            : "bg-slate-800 hover:bg-slate-700"
        } flex items-center gap-2 cursor-pointer`}
        aria-haspopup="menu"
        aria-expanded={detailsRef.current?.open ? "true" : "false"}
        onClick={(e) => {
          if (disabled) e.preventDefault();
        }} // 👈 bloqueia abrir
      >
        <svg width="16" height="16" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M5 20h14v-2H5v2zm7-18l-5 5h3v6h4V7h3l-5-5z"
          />
        </svg>
        Export
        <span aria-hidden>▾</span>
      </summary>
      {!disabled && MenuList}
    </details>
  );
}

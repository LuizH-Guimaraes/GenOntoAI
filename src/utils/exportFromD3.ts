// utils/exportFromD3.ts
import { normalizeForExport } from "./normalizeForExport";
import {
  exportTTL,
  exportJSONLD,
  exportGraphML,
  exportCSV,
  exportOWLXML,
} from "./exportGraph";

export const exportTTLFromD3 = (g: any, baseIRI?: string) =>
  exportTTL(normalizeForExport(g), baseIRI);
export const exportJSONLDFromD3 = (g: any, baseIRI?: string) =>
  exportJSONLD(normalizeForExport(g), baseIRI);
export const exportGraphMLFromD3 = (g: any) =>
  exportGraphML(normalizeForExport(g));
export const exportCSVFromD3 = (g: any) => exportCSV(normalizeForExport(g));
export const exportOWLXMLFromD3 = (g: any, baseIRI?: string) =>
  exportOWLXML(normalizeForExport(g), baseIRI);

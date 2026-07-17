// PDF export for a processed clinical medical record: metadata + AI summary + structured
// sections + disclaimer. Uses the shared MR PDF toolkit (pdf-layout.ts).

import type { jsPDF } from "jspdf";
import { safeFileName } from "@/backend/lib/download";
import type { ClinicalConfig } from "./clinical/clinical.registry";
import type { ClinicalExtraction } from "./clinical/clinical.schema";
import { createPdfDoc, fmtDate, stripMarkdown, INK, MUTED } from "./pdf-layout";

export interface ClinicalPdfLabels {
  documentTypeLabel: string; // localized document-type name
  facilityLabel: string;
  physicianLabel: string;
  recordDateLabel: string;
  generatedLabel: string;
  summaryHeading: string;
  disclaimer: string;
  footer: string;
  // localized section labels, keyed by section key
  sectionLabels: Record<string, string>;
}

interface PdfClinicalRecord {
  title: string;
  documentType: string | null;
  physician: string | null;
  sourceName: string | null;
  visitDate: Date | string | null;
}

export async function buildClinicalPdf(
  record: PdfClinicalRecord,
  config: ClinicalConfig,
  extraction: ClinicalExtraction,
  summary: string | null,
  labels: ClinicalPdfLabels
): Promise<jsPDF> {
  const pdf = await createPdfDoc();
  const { writeLines, sectionHeader, bullet } = pdf;

  // --- Header ---
  writeLines(record.title, 20, "bold", INK);
  const meta: string[] = [];
  if (labels.documentTypeLabel) meta.push(labels.documentTypeLabel);
  if (record.sourceName) meta.push(`${labels.facilityLabel}: ${record.sourceName}`);
  if (record.physician) meta.push(`${labels.physicianLabel}: ${record.physician}`);
  const rd = fmtDate(record.visitDate);
  if (rd) meta.push(`${labels.recordDateLabel}: ${rd}`);
  meta.push(`${labels.generatedLabel}: ${fmtDate(new Date())}`);
  writeLines(meta.join("   •   "), 10, "normal", MUTED);

  // --- AI summary ---
  if (summary && summary.trim()) {
    sectionHeader(labels.summaryHeading);
    writeLines(stripMarkdown(summary), 11, "normal", INK);
  }

  // --- Structured sections (only non-empty, in config order) ---
  for (const def of config.sections) {
    const value = extraction.sections[def.key];
    if (value == null || (Array.isArray(value) && value.length === 0)) continue;
    sectionHeader(labels.sectionLabels[def.key] ?? def.key);
    if (Array.isArray(value)) value.forEach((item) => bullet(item));
    else writeLines(value, 11, "normal", INK);
  }

  // --- Disclaimer ---
  pdf.setY(pdf.y() + 12);
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  pdf.finalize(labels.footer);
  return pdf.doc;
}

export async function downloadClinicalPdf(
  record: PdfClinicalRecord,
  config: ClinicalConfig,
  extraction: ClinicalExtraction,
  summary: string | null,
  labels: ClinicalPdfLabels
): Promise<void> {
  const doc = await buildClinicalPdf(record, config, extraction, summary, labels);
  doc.save(safeFileName(record.title, "medical-record") + ".pdf");
}

// PDF export for a processed immunization record: metadata + AI summary + vaccine table +
// disclaimer. Uses the shared MR PDF toolkit.

import type { jsPDF } from "jspdf";
import { safeFileName } from "@/backend/lib/download";
import type { ImmunizationExtraction } from "./immunization/immunization.schema";
import { createPdfDoc, drawTable, fmtDate, stripMarkdown, INK, MUTED } from "./pdf-layout";

export interface ImmunizationPdfLabels {
  documentTypeLabel: string;
  facilityLabel: string;
  recordDateLabel: string;
  generatedLabel: string;
  summaryHeading: string;
  vaccinesHeading: string;
  disclaimer: string;
  footer: string;
  columns: {
    vaccine: string;
    doseNumber: string;
    date: string;
    manufacturer: string;
    lotNumber: string;
    provider: string;
    nextDue: string;
  };
}

interface PdfImmunizationRecord {
  title: string;
  documentType: string | null;
  sourceName: string | null;
  visitDate: Date | string | null;
}

export async function buildImmunizationPdf(
  record: PdfImmunizationRecord,
  extraction: ImmunizationExtraction,
  summary: string | null,
  labels: ImmunizationPdfLabels
): Promise<jsPDF> {
  const pdf = await createPdfDoc();
  const { writeLines, sectionHeader } = pdf;
  const vaccines = extraction.vaccines;

  // --- Header ---
  writeLines(record.title, 20, "bold", INK);
  const meta: string[] = [];
  if (labels.documentTypeLabel) meta.push(labels.documentTypeLabel);
  if (record.sourceName) meta.push(`${labels.facilityLabel}: ${record.sourceName}`);
  const rd = fmtDate(record.visitDate);
  if (rd) meta.push(`${labels.recordDateLabel}: ${rd}`);
  meta.push(`${labels.generatedLabel}: ${fmtDate(new Date())}`);
  writeLines(meta.join("   •   "), 10, "normal", MUTED);

  // --- AI summary ---
  if (summary && summary.trim()) {
    sectionHeader(labels.summaryHeading);
    writeLines(stripMarkdown(summary), 11, "normal", INK);
  }

  // --- Vaccine table ---
  sectionHeader(labels.vaccinesHeading);
  const c = labels.columns;
  drawTable(
    pdf,
    [c.vaccine, c.doseNumber, c.date, c.manufacturer, c.lotNumber, c.provider, c.nextDue],
    vaccines.map((v) => [
      v.name ?? "—",
      v.doseNumber != null ? String(v.doseNumber) : "—",
      v.date ?? "—",
      v.manufacturer ?? "—",
      v.lotNumber ?? "—",
      v.provider ?? "—",
      v.nextDueDate ?? "—"
    ]),
    [2.6, 1, 1.6, 1.8, 1.4, 1.8, 1.6]
  );

  // --- Disclaimer ---
  pdf.setY(pdf.y() + 12);
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  pdf.finalize(labels.footer);
  return pdf.doc;
}

export async function downloadImmunizationPdf(
  record: PdfImmunizationRecord,
  extraction: ImmunizationExtraction,
  summary: string | null,
  labels: ImmunizationPdfLabels
): Promise<void> {
  const doc = await buildImmunizationPdf(record, extraction, summary, labels);
  doc.save(safeFileName(record.title, "immunizations") + ".pdf");
}

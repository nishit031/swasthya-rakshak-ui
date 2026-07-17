// PDF export for a processed medication record: metadata + AI summary + medication table +
// per-medication instructions/prescriber + disclaimer. Uses the shared MR PDF toolkit.

import type { jsPDF } from "jspdf";
import { safeFileName } from "@/backend/lib/download";
import type { MedicationExtraction } from "./medication/medication.schema";
import { createPdfDoc, drawTable, fmtDate, stripMarkdown, INK, MUTED } from "./pdf-layout";

export interface MedicationPdfLabels {
  documentTypeLabel: string;
  facilityLabel: string;
  physicianLabel: string;
  recordDateLabel: string;
  generatedLabel: string;
  summaryHeading: string;
  medicationsHeading: string;
  instructionsHeading: string;
  disclaimer: string;
  footer: string;
  columns: {
    medication: string;
    strength: string;
    dose: string;
    frequency: string;
    duration: string;
    status: string;
  };
  statusLabels: Record<string, string>;
}

interface PdfMedicationRecord {
  title: string;
  documentType: string | null;
  physician: string | null;
  sourceName: string | null;
  visitDate: Date | string | null;
}

export async function buildMedicationPdf(
  record: PdfMedicationRecord,
  extraction: MedicationExtraction,
  summary: string | null,
  labels: MedicationPdfLabels
): Promise<jsPDF> {
  const pdf = await createPdfDoc();
  const { writeLines, sectionHeader, bullet } = pdf;
  const meds = extraction.medications;

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

  // --- Medication table ---
  sectionHeader(labels.medicationsHeading);
  const c = labels.columns;
  drawTable(
    pdf,
    [c.medication, c.strength, c.dose, c.frequency, c.duration, c.status],
    meds.map((m) => [
      m.name ?? "—",
      m.strength ?? "—",
      m.dosage.original ?? "—",
      m.frequency.original ?? "—",
      m.duration ?? "—",
      labels.statusLabels[m.status] ?? m.status
    ]),
    [3, 1.6, 1.6, 2, 1.4, 1.6]
  );

  // --- Per-medication instructions / prescriber ---
  const withInstructions = meds.filter((m) => m.instructions || m.prescriber);
  if (withInstructions.length) {
    sectionHeader(labels.instructionsHeading);
    for (const m of withInstructions) {
      const bits = [
        m.instructions,
        m.prescriber ? `${labels.physicianLabel}: ${m.prescriber}` : null
      ]
        .filter(Boolean)
        .join(" — ");
      bullet(`${m.name ?? "—"}: ${bits}`);
    }
  }

  // --- Disclaimer ---
  pdf.setY(pdf.y() + 12);
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  pdf.finalize(labels.footer);
  return pdf.doc;
}

export async function downloadMedicationPdf(
  record: PdfMedicationRecord,
  extraction: MedicationExtraction,
  summary: string | null,
  labels: MedicationPdfLabels
): Promise<void> {
  const doc = await buildMedicationPdf(record, extraction, summary, labels);
  doc.save(safeFileName(record.title, "medications") + ".pdf");
}

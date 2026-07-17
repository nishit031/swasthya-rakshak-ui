// PDF export for a processed imaging record: metadata + AI summary + findings table + measurements
// table + impression + recommendations + normal findings + disclaimer. Uses the shared MR PDF
// toolkit (pdf-layout.ts).

import type { jsPDF } from "jspdf";
import { safeFileName } from "@/backend/lib/download";
import type { ImagingExtraction } from "./imaging/imaging.schema";
import { createPdfDoc, drawTable, fmtDate, stripMarkdown, INK, MUTED } from "./pdf-layout";

export interface ImagingPdfLabels {
  documentTypeLabel: string;
  modalityLabel: string; // resolved modality (X-Ray, MRI, …)
  facilityLabel: string;
  radiologistLabel: string;
  regionsLabel: string;
  recordDateLabel: string;
  generatedLabel: string;
  summaryHeading: string;
  findingsHeading: string;
  measurementsHeading: string;
  impressionHeading: string;
  recommendationsHeading: string;
  normalFindingsHeading: string;
  disclaimer: string;
  footer: string;
  findingColumns: { finding: string; location: string; severity: string; measurement: string };
  measurementColumns: { measurement: string; location: string; associated: string };
}

interface PdfImagingRecord {
  title: string;
  documentType: string | null;
  sourceName: string | null;
  visitDate: Date | string | null;
}

export async function buildImagingPdf(
  record: PdfImagingRecord,
  extraction: ImagingExtraction,
  summary: string | null,
  labels: ImagingPdfLabels
): Promise<jsPDF> {
  const pdf = await createPdfDoc();
  const { writeLines, sectionHeader, bullet } = pdf;
  const e = extraction;

  // --- Header ---
  writeLines(record.title, 20, "bold", INK);
  const meta: string[] = [];
  if (labels.modalityLabel) meta.push(labels.modalityLabel);
  if (e.regions.length) meta.push(`${labels.regionsLabel}: ${e.regions.join(", ")}`);
  if (record.sourceName) meta.push(`${labels.facilityLabel}: ${record.sourceName}`);
  if (e.radiologist) meta.push(`${labels.radiologistLabel}: ${e.radiologist}`);
  const rd = fmtDate(e.reportDate ?? record.visitDate);
  if (rd) meta.push(`${labels.recordDateLabel}: ${rd}`);
  meta.push(`${labels.generatedLabel}: ${fmtDate(new Date())}`);
  writeLines(meta.join("   •   "), 10, "normal", MUTED);

  // --- AI summary ---
  if (summary && summary.trim()) {
    sectionHeader(labels.summaryHeading);
    writeLines(stripMarkdown(summary), 11, "normal", INK);
  }

  // --- Findings table ---
  if (e.findings.length) {
    sectionHeader(labels.findingsHeading);
    const c = labels.findingColumns;
    drawTable(
      pdf,
      [c.finding, c.location, c.severity, c.measurement],
      e.findings.map((f) => [
        f.finding ?? "—",
        f.location ?? "—",
        f.severity ?? "—",
        f.measurement ?? "—"
      ]),
      [3, 2, 1.4, 1.6]
    );
  }

  // --- Measurements table ---
  if (e.measurements.length) {
    sectionHeader(labels.measurementsHeading);
    const c = labels.measurementColumns;
    drawTable(
      pdf,
      [c.measurement, c.location, c.associated],
      e.measurements.map((m) => [
        m.normalized ?? m.value ?? m.sourceText ?? "—",
        m.location ?? "—",
        m.associatedFinding ?? "—"
      ]),
      [2, 2, 3]
    );
  }

  // --- Impression (ordered) ---
  if (e.impression.length) {
    sectionHeader(labels.impressionHeading);
    e.impression.forEach((line) => bullet(line));
  }

  // --- Recommendations ---
  if (e.recommendations.length) {
    sectionHeader(labels.recommendationsHeading);
    e.recommendations.forEach((line) => bullet(line));
  }

  // --- Normal findings ---
  if (e.normalFindings.length) {
    sectionHeader(labels.normalFindingsHeading);
    e.normalFindings.forEach((line) => bullet(line));
  }

  // --- Disclaimer ---
  pdf.setY(pdf.y() + 12);
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  pdf.finalize(labels.footer);
  return pdf.doc;
}

export async function downloadImagingPdf(
  record: PdfImagingRecord,
  extraction: ImagingExtraction,
  summary: string | null,
  labels: ImagingPdfLabels
): Promise<void> {
  const doc = await buildImagingPdf(record, extraction, summary, labels);
  doc.save(safeFileName(record.title, "imaging-report") + ".pdf");
}

// PDF export for a processed procedure record: metadata + AI summary + procedure details + devices
// table + specimens table + intraoperative findings + complications + recovery + disclaimer. Uses
// the shared MR PDF toolkit (pdf-layout.ts).

import type { jsPDF } from "jspdf";
import { safeFileName } from "@/backend/lib/download";
import type { ProcedureExtraction } from "./procedure/procedure.schema";
import { createPdfDoc, drawTable, fmtDate, stripMarkdown, INK, MUTED } from "./pdf-layout";

export interface ProcedurePdfLabels {
  documentTypeLabel: string;
  facilityLabel: string;
  surgeonLabel: string;
  recordDateLabel: string;
  generatedLabel: string;
  outcomeLabel: string;
  summaryHeading: string;
  detailsHeading: string;
  stepsHeading: string;
  devicesHeading: string;
  specimensHeading: string;
  findingsHeading: string;
  complicationsHeading: string;
  recoveryHeading: string;
  disclaimer: string;
  footer: string;
  detailLabels: {
    indication: string;
    assistants: string;
    operatingRoom: string;
    anesthesia: string;
    bodySite: string;
    bloodLoss: string;
    category: string;
  };
  deviceColumns: { device: string; manufacturer: string; model: string; location: string };
  specimenColumns: { specimen: string; site: string; purpose: string };
  outcomeLabels: Record<string, string>;
}

interface PdfProcedureRecord {
  title: string;
  documentType: string | null;
  sourceName: string | null;
  visitDate: Date | string | null;
}

export async function buildProcedurePdf(
  record: PdfProcedureRecord,
  e: ProcedureExtraction,
  summary: string | null,
  labels: ProcedurePdfLabels
): Promise<jsPDF> {
  const pdf = await createPdfDoc();
  const { writeLines, sectionHeader, bullet } = pdf;

  // --- Header ---
  writeLines(record.title, 20, "bold", INK);
  const meta: string[] = [];
  if (labels.documentTypeLabel) meta.push(labels.documentTypeLabel);
  if (e.surgeon) meta.push(`${labels.surgeonLabel}: ${e.surgeon}`);
  if (e.facility ?? record.sourceName)
    meta.push(`${labels.facilityLabel}: ${e.facility ?? record.sourceName}`);
  const rd = fmtDate(e.procedureDate ?? record.visitDate);
  if (rd) meta.push(`${labels.recordDateLabel}: ${rd}`);
  if (e.outcome.original)
    meta.push(
      `${labels.outcomeLabel}: ${labels.outcomeLabels[e.outcome.status] ?? e.outcome.original}`
    );
  meta.push(`${labels.generatedLabel}: ${fmtDate(new Date())}`);
  writeLines(meta.join("   •   "), 10, "normal", MUTED);

  // --- AI summary ---
  if (summary && summary.trim()) {
    sectionHeader(labels.summaryHeading);
    writeLines(stripMarkdown(summary), 11, "normal", INK);
  }

  // --- Procedure details ---
  const details = (
    [
      [labels.detailLabels.category, e.procedureCategory],
      [labels.detailLabels.indication, e.indication],
      [labels.detailLabels.assistants, e.assistants.join(", ") || null],
      [labels.detailLabels.operatingRoom, e.operatingRoom],
      [labels.detailLabels.anesthesia, e.anesthesiaType],
      [labels.detailLabels.bodySite, e.bodySite],
      [labels.detailLabels.bloodLoss, e.estimatedBloodLoss]
    ] as [string, string | null][]
  ).filter(([, v]) => v);
  if (details.length) {
    sectionHeader(labels.detailsHeading);
    for (const [k, v] of details) bullet(`${k}: ${v}`);
  }

  // --- Steps ---
  if (e.steps.length) {
    sectionHeader(labels.stepsHeading);
    e.steps.forEach((s, i) => bullet(`${i + 1}. ${s}`));
  }

  // --- Devices table ---
  if (e.devices.length) {
    sectionHeader(labels.devicesHeading);
    const c = labels.deviceColumns;
    drawTable(
      pdf,
      [c.device, c.manufacturer, c.model, c.location],
      e.devices.map((d) => [
        d.device ?? "—",
        d.manufacturer ?? "—",
        d.model ?? "—",
        d.location ?? "—"
      ]),
      [3, 2, 2, 2]
    );
  }

  // --- Specimens table ---
  if (e.specimens.length) {
    sectionHeader(labels.specimensHeading);
    const c = labels.specimenColumns;
    drawTable(
      pdf,
      [c.specimen, c.site, c.purpose],
      e.specimens.map((s) => [s.specimen ?? "—", s.collectionSite ?? "—", s.purpose ?? "—"]),
      [3, 2, 3]
    );
  }

  // --- Intraoperative findings ---
  if (e.intraoperativeFindings.length) {
    sectionHeader(labels.findingsHeading);
    e.intraoperativeFindings.forEach((f) => bullet(f));
  }

  // --- Complications ---
  if (e.complications.length) {
    sectionHeader(labels.complicationsHeading);
    e.complications.forEach((c) => bullet(c));
  }

  // --- Recovery (post-op + follow-up) ---
  if (e.postOpInstructions.length || e.followUp.length) {
    sectionHeader(labels.recoveryHeading);
    [...e.postOpInstructions, ...e.followUp].forEach((r) => bullet(r));
  }

  // --- Disclaimer ---
  pdf.setY(pdf.y() + 12);
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  pdf.finalize(labels.footer);
  return pdf.doc;
}

export async function downloadProcedurePdf(
  record: PdfProcedureRecord,
  e: ProcedureExtraction,
  summary: string | null,
  labels: ProcedurePdfLabels
): Promise<void> {
  const doc = await buildProcedurePdf(record, e, summary, labels);
  doc.save(safeFileName(record.title, "procedure-report") + ".pdf");
}

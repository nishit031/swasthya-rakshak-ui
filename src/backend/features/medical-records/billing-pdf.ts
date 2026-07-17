// PDF export for a processed billing/insurance record: metadata + AI summary + administrative
// details + amounts + billing-codes table + denial reason + disclaimer. Uses the shared MR PDF
// toolkit.

import type { jsPDF } from "jspdf";
import { safeFileName } from "@/backend/lib/download";
import type { BillingExtraction } from "./billing/billing.schema";
import { createPdfDoc, drawTable, fmtDate, stripMarkdown, INK, MUTED } from "./pdf-layout";

export interface BillingPdfLabels {
  documentTypeLabel: string;
  recordDateLabel: string;
  generatedLabel: string;
  summaryHeading: string;
  detailsHeading: string;
  codesHeading: string;
  disclaimer: string;
  footer: string;
  detailLabels: {
    recordType: string;
    provider: string;
    service: string;
    charged: string;
    paid: string;
    payer: string;
    status: string;
    denialReason: string;
  };
  codeColumns: {
    code: string;
    system: string;
    description: string;
  };
  statusLabels: Record<string, string>;
}

interface PdfBillingRecord {
  title: string;
  documentType: string | null;
  visitDate: Date | string | null;
}

export async function buildBillingPdf(
  record: PdfBillingRecord,
  extraction: BillingExtraction,
  summary: string | null,
  labels: BillingPdfLabels
): Promise<jsPDF> {
  const pdf = await createPdfDoc();
  const { writeLines, sectionHeader, bullet } = pdf;
  const e = extraction;
  const l = labels.detailLabels;

  // --- Header ---
  writeLines(record.title, 20, "bold", INK);
  const meta: string[] = [];
  if (labels.documentTypeLabel) meta.push(labels.documentTypeLabel);
  const rd = fmtDate(record.visitDate);
  if (rd) meta.push(`${labels.recordDateLabel}: ${rd}`);
  meta.push(`${labels.generatedLabel}: ${fmtDate(new Date())}`);
  writeLines(meta.join("   •   "), 10, "normal", MUTED);

  // --- AI summary ---
  if (summary && summary.trim()) {
    sectionHeader(labels.summaryHeading);
    writeLines(stripMarkdown(summary), 11, "normal", INK);
  }

  // --- Administrative details ---
  const statusText = e.claimStatus.original ?? labels.statusLabels[e.claimStatus.status];
  const details: [string, string | null][] = [
    [l.recordType, e.recordType],
    [l.provider, e.provider],
    [l.service, e.serviceDescription],
    [l.charged, e.amountCharged],
    [l.paid, e.amountPaid],
    [l.payer, e.payer],
    [l.status, statusText],
    [l.denialReason, e.denialReason]
  ];
  const shown = details.filter(([, v]) => v);
  if (shown.length) {
    sectionHeader(labels.detailsHeading);
    for (const [k, v] of shown) bullet(`${k}: ${v}`);
  }

  // --- Billing codes ---
  if (e.codes.length) {
    sectionHeader(labels.codesHeading);
    const c = labels.codeColumns;
    drawTable(
      pdf,
      [c.code, c.system, c.description],
      e.codes.map((code) => [code.code ?? "—", code.system ?? "—", code.description ?? "—"]),
      [1.5, 1.2, 3.3]
    );
  }

  // --- Disclaimer ---
  pdf.setY(pdf.y() + 12);
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  pdf.finalize(labels.footer);
  return pdf.doc;
}

export async function downloadBillingPdf(
  record: PdfBillingRecord,
  extraction: BillingExtraction,
  summary: string | null,
  labels: BillingPdfLabels
): Promise<void> {
  const doc = await buildBillingPdf(record, extraction, summary, labels);
  doc.save(safeFileName(record.title, "billing") + ".pdf");
}

// Builds a professionally-formatted PDF of the extracted lab values, suitable for printing or
// sharing with a doctor. Follows the same layout scaffolding as summary-pdf.ts (A4, manual cursor-
// based pagination, jsPDF dynamically imported so it stays out of the initial bundle).

import type { jsPDF } from "jspdf";
import type { ExtractedTest } from "./lab-reports.types";
import { classify, parseNumber, parseRange } from "./lab-values";
import { isVerified } from "./extracted-values";
import { safeFileName } from "@/backend/lib/download";

export interface ExtractedDataPdfLabels {
  labLabel: string;
  reportDateLabel: string;
  extractedLabel: string;
  reference: string;
  status: string;
  verified: string;
  notVerified: string;
  disclaimer: string;
  footer: string;
}

interface PdfLabReport {
  testName: string | null;
  labName: string | null;
  reportDate: Date | string | null;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 48;

const INK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const ACCENT: [number, number, number] = [2, 132, 199];
const WARN: [number, number, number] = [180, 83, 9]; // warning/amber-700

function fmtDate(d: Date | string | null): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function statusLabel(test: ExtractedTest): string {
  const s = classify(parseNumber(test.value), parseRange(test.referenceRange), test.flag);
  return s === "high" ? "High" : s === "low" ? "Low" : s === "normal" ? "Normal" : "Unknown";
}

export async function buildExtractedDataPdf(
  lab: PdfLabReport,
  tests: ExtractedTest[],
  interpretations: (string | null)[],
  labels: ExtractedDataPdfLabels
): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  function ensureSpace(h: number) {
    if (y + h > PAGE_H - FOOTER_H) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function writeLines(
    text: string,
    size: number,
    style: "normal" | "bold",
    color: number[],
    x = MARGIN,
    w = CONTENT_W
  ) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lineH = size * 1.35;
    for (const line of doc.splitTextToSize(text, w)) {
      ensureSpace(lineH);
      doc.text(line, x, y);
      y += lineH;
    }
  }

  // --- Header ---
  writeLines(lab.testName ?? "Extracted Lab Values", 20, "bold", INK);
  y += 4;
  const meta: string[] = [];
  if (lab.labName) meta.push(`${labels.labLabel}: ${lab.labName}`);
  const rd = fmtDate(lab.reportDate);
  if (rd) meta.push(`${labels.reportDateLabel}: ${rd}`);
  meta.push(`${labels.extractedLabel}: ${fmtDate(new Date())}`);
  writeLines(meta.join("   •   "), 10, "normal", MUTED);
  y += 10;

  // --- One block per test ---
  tests.forEach((test, i) => {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text(test.name ?? "Unnamed test", MARGIN, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    y += 4;
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 12;

    const valueLine = `${test.value ?? "—"}${test.unit ? ` ${test.unit}` : ""}`;
    writeLines(valueLine, 13, "bold", INK);

    const refLine = test.referenceRange
      ? `${labels.reference}: ${test.referenceRange}`
      : `${labels.reference}: —`;
    const verified = isVerified(test);
    const statusLine = `${labels.status}: ${statusLabel(test)}   •   ${
      verified ? labels.verified : labels.notVerified
    }`;
    writeLines(refLine, 9.5, "normal", MUTED);
    writeLines(statusLine, 9.5, "normal", verified ? MUTED : WARN);

    const interpretation = interpretations[i];
    if (interpretation) {
      writeLines(interpretation, 9.5, "normal", INK);
    }
    y += 10;
  });

  // Disclaimer.
  y += 6;
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  // --- Footer on every page ---
  const pages = doc.getNumberOfPages();
  const footerLines = doc.splitTextToSize(labels.footer, CONTENT_W - 40);
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, PAGE_H - FOOTER_H + 6, PAGE_W - MARGIN, PAGE_H - FOOTER_H + 6);
    let fy = PAGE_H - FOOTER_H + 20;
    for (const line of footerLines) {
      doc.text(line, MARGIN, fy);
      fy += 10;
    }
    doc.text(`${p} / ${pages}`, PAGE_W - MARGIN, PAGE_H - FOOTER_H + 20, { align: "right" });
  }

  return doc;
}

export async function downloadExtractedDataPdf(
  lab: PdfLabReport,
  tests: ExtractedTest[],
  interpretations: (string | null)[],
  labels: ExtractedDataPdfLabels
): Promise<void> {
  const doc = await buildExtractedDataPdf(lab, tests, interpretations, labels);
  doc.save(safeFileName(lab.testName ?? "extracted-values", "extracted-values") + ".pdf");
}

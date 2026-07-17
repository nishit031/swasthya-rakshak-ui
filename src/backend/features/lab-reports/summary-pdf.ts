// Builds a professionally-formatted PDF of a lab-report summary, suitable for printing or sharing
// with a doctor. Consumes the already-parsed summary (parse-summary.ts) so the summary/LLM logic is
// untouched. jsPDF is imported dynamically so it stays out of the initial client bundle.

import type { jsPDF } from "jspdf";
import type { ParsedSummary } from "./parse-summary";
import { safeFileName } from "@/backend/lib/download";

export interface SummaryPdfLabels {
  labLabel: string;
  reportDateLabel: string;
  generatedLabel: string;
  overallStatus: string;
  keyFindings: string;
  abnormalResults: string;
  normalResults: string;
  followUp: string;
  disclaimer: string;
  footer: string;
}

interface PdfLabReport {
  testName: string | null;
  labName: string | null;
  reportDate: Date | string | null;
}

// A4 in points, comfortable margins.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 48;

const INK: [number, number, number] = [17, 24, 39]; // gray-900
const MUTED: [number, number, number] = [107, 114, 128]; // gray-500
const ACCENT: [number, number, number] = [2, 132, 199]; // primary/sky-600

function fmtDate(d: Date | string | null): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Split "Platelet Count: 410 (150-400) — mildly high" into a bold title + normal detail.
function splitFinding(s: string): { title: string; detail: string } {
  const m = s.match(/^([^:—-]{2,40})[:—-]\s*(.+)$/);
  if (m) return { title: m[1].trim(), detail: m[2].trim() };
  return { title: s, detail: "" };
}

export async function buildSummaryPdf(
  lab: PdfLabReport,
  parsed: ParsedSummary,
  labels: SummaryPdfLabels
): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  // Add a page and reset the cursor if the next block of height `h` wouldn't fit above the footer.
  function ensureSpace(h: number) {
    if (y + h > PAGE_H - FOOTER_H) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function writeLines(text: string, size: number, style: "normal" | "bold", color: number[]) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lineH = size * 1.35;
    for (const line of doc.splitTextToSize(text, CONTENT_W)) {
      ensureSpace(lineH);
      doc.text(line, MARGIN, y);
      y += lineH;
    }
  }

  function sectionHeader(title: string) {
    y += 10;
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 6;
    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
    y += 12;
  }

  function bullet(title: string, detail: string) {
    const lineH = 10 * 1.35;
    const indent = 14;
    doc.setFontSize(10);
    // Title (bold) with a bullet dot; detail flows after on wrapped lines.
    const titleLines = doc.splitTextToSize(`• ${title}${detail ? ":" : ""}`, CONTENT_W - indent);
    for (const line of titleLines) {
      ensureSpace(lineH);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text(line, MARGIN + indent, y);
      y += lineH;
    }
    if (detail) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
      for (const line of doc.splitTextToSize(detail, CONTENT_W - indent - 8)) {
        ensureSpace(lineH);
        doc.text(line, MARGIN + indent + 8, y);
        y += lineH;
      }
    }
    y += 2;
  }

  // --- Header ---
  writeLines(lab.testName ?? "Lab Report Summary", 20, "bold", INK);
  y += 4;
  const meta: string[] = [];
  if (lab.labName) meta.push(`${labels.labLabel}: ${lab.labName}`);
  const rd = fmtDate(lab.reportDate);
  if (rd) meta.push(`${labels.reportDateLabel}: ${rd}`);
  meta.push(`${labels.generatedLabel}: ${fmtDate(new Date())}`);
  writeLines(meta.join("   •   "), 10, "normal", MUTED);
  y += 6;

  // --- Sections ---
  if (parsed.overallSummary) {
    sectionHeader(labels.overallStatus);
    writeLines(parsed.overallSummary, 11, "normal", INK);
  }
  if (parsed.keyFindings.length) {
    sectionHeader(labels.keyFindings);
    parsed.keyFindings.forEach((f) => bullet(f, ""));
  }
  if (parsed.abnormalResults.length) {
    sectionHeader(labels.abnormalResults);
    parsed.abnormalResults.forEach((r) => {
      const { title, detail } = splitFinding(r);
      bullet(title, detail);
    });
  }
  if (parsed.normalResults.length) {
    sectionHeader(labels.normalResults);
    parsed.normalResults.forEach((n) => bullet(n, ""));
  }
  if (parsed.followUp) {
    sectionHeader(labels.followUp);
    writeLines(parsed.followUp, 11, "normal", INK);
  }

  // Disclaimer block.
  y += 12;
  writeLines(labels.disclaimer, 9, "normal", MUTED);

  // --- Footer on every page ---
  const pages = doc.getNumberOfPages();
  const footerLines = doc.splitTextToSize(labels.footer, CONTENT_W - 40);
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.setDrawColor(226, 232, 240); // gray-200
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

export async function downloadSummaryPdf(
  lab: PdfLabReport,
  parsed: ParsedSummary,
  labels: SummaryPdfLabels
): Promise<void> {
  const doc = await buildSummaryPdf(lab, parsed, labels);
  doc.save(safeFileName(lab.testName ?? "lab-summary", "summary") + ".pdf");
}

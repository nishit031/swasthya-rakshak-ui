// Shared jsPDF scaffolding for Medical Records PDF exports (clinical + medication). Extracted once
// a third PDF export appeared (rule of three). jsPDF is imported dynamically so it stays out of the
// initial bundle. The lab-reports PDFs keep their own copy (separate feature).

import type { jsPDF } from "jspdf";

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN = 48;
export const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_H = 48;

export const INK: [number, number, number] = [17, 24, 39];
export const MUTED: [number, number, number] = [107, 114, 128];
export const ACCENT: [number, number, number] = [2, 132, 199];

export function fmtDate(d: Date | string | null): string | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Strip light markdown so a summary reads cleanly as plain PDF text.
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

export interface PdfDoc {
  doc: jsPDF;
  writeLines: (text: string, size: number, style: "normal" | "bold", color: number[]) => void;
  sectionHeader: (title: string) => void;
  bullet: (text: string) => void;
  ensureSpace: (h: number) => void;
  /** Current vertical cursor (points from top). */
  y: () => number;
  setY: (v: number) => void;
  /** Draw the per-page footer + page numbers. Call last. */
  finalize: (footer: string) => void;
}

// Create an A4 doc with a cursor-based layout toolkit shared across MR PDFs.
export async function createPdfDoc(): Promise<PdfDoc> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

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

  function bullet(text: string) {
    const lineH = 10 * 1.35;
    const indent = 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    for (const line of doc.splitTextToSize(`• ${text}`, CONTENT_W - indent)) {
      ensureSpace(lineH);
      doc.text(line, MARGIN + indent, y);
      y += lineH;
    }
    y += 2;
  }

  function finalize(footer: string) {
    const pages = doc.getNumberOfPages();
    const footerLines = doc.splitTextToSize(footer, CONTENT_W - 40);
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
  }

  return {
    doc,
    writeLines,
    sectionHeader,
    bullet,
    ensureSpace,
    y: () => y,
    setY: (v: number) => {
      y = v;
    },
    finalize
  };
}

// Draw a simple table with fixed proportional column widths and wrapped cells. Advances the cursor.
export function drawTable(
  pdf: PdfDoc,
  headers: string[],
  rows: string[][],
  colWeights: number[]
): void {
  const { doc } = pdf;
  const totalWeight = colWeights.reduce((a, b) => a + b, 0);
  const colW = colWeights.map((w) => (w / totalWeight) * CONTENT_W);
  const colX = colW.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? MARGIN : acc[i - 1] + colW[i - 1]);
    return acc;
  }, []);
  const pad = 4;
  const fontSize = 9;
  const lineH = fontSize * 1.25;

  function drawRow(cells: string[], bold: boolean) {
    const wrapped = cells.map((c, i) => doc.splitTextToSize(c || "—", colW[i] - pad * 2));
    const rowH = Math.max(...wrapped.map((w) => w.length)) * lineH + pad * 2;
    pdf.ensureSpace(rowH);
    const top = pdf.y();
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(
      bold ? ACCENT[0] : INK[0],
      bold ? ACCENT[1] : INK[1],
      bold ? ACCENT[2] : INK[2]
    );
    wrapped.forEach((linesArr, i) => {
      let ty = top + pad + fontSize;
      for (const line of linesArr) {
        doc.text(line, colX[i] + pad, ty);
        ty += lineH;
      }
    });
    // bottom rule
    const bottom = top + rowH;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, bottom, MARGIN + CONTENT_W, bottom);
    pdf.setY(bottom);
  }

  drawRow(headers, true);
  for (const r of rows) drawRow(r, false);
}

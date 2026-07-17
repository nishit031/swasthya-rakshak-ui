// Authentic extraction-quality score for the on-upload metadata auto-fill.
//
// Score = field coverage + OCR quality. When the routed OCR service supplies its real per-line
// mean confidence (extract-text.ts RawOcrMeta.confidence), that is the quality term; otherwise we
// fall back to a text heuristic (length + alphanumeric ratio — garbled scans read as noise),
// since the tesseract.js fallback path still discards its own confidence.

export interface MetadataExtraction {
  testName: string | null;
  labName: string | null;
  reportDate: string | null;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// 0..1: does the OCR text look like real report text, or noise?
function ocrQuality(ocrText: string): number {
  const text = ocrText.trim();
  if (!text) return 0;
  const alnum = (text.match(/[a-zA-Z0-9]/g) ?? []).length;
  const ratio = alnum / text.length; // clean prose ≈ 0.6–0.8; garbled OCR is much lower
  const lengthFactor = clamp(text.length / 400, 0, 1); // ramps to full at ~400 chars
  const ratioFactor = clamp((ratio - 0.3) / 0.3, 0, 1); // 0.3→0, 0.6→1
  return 0.5 * lengthFactor + 0.5 * ratioFactor;
}

// Generic version of the heuristic above — same signal (field coverage + OCR quality), any field
// set. Used by any pre-save AI extraction (lab metadata, medical-record classification, ...).
// Pass the OCR engine's real mean confidence (0..1) when available; it replaces the text heuristic.
export function scoreExtraction(
  ocrText: string,
  fields: Record<string, string | null>,
  engineConfidence?: number
): { score: number; lowConfidenceFields: string[] } {
  const keys = Object.keys(fields);
  const present = keys.filter((k) => fields[k] != null && fields[k] !== "");
  const fieldFraction = keys.length === 0 ? 1 : present.length / keys.length;
  const quality = engineConfidence != null ? clamp(engineConfidence, 0, 1) : ocrQuality(ocrText);

  const score = Math.round(100 * (0.5 * fieldFraction + 0.5 * quality));
  // A field is low-confidence if it's missing, OR present but the OCR it came from looks poor.
  const lowConfidenceFields = keys.filter(
    (k) => fields[k] == null || fields[k] === "" || quality < 0.5
  );
  return { score, lowConfidenceFields };
}

export function computeExtractionConfidence(
  ocrText: string,
  extracted: MetadataExtraction
): { score: number; lowConfidenceFields: string[] } {
  return scoreExtraction(ocrText, { ...extracted });
}

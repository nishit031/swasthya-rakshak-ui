// Canonical imaging model + pure helpers for the imaging intelligence layer. Radiology reports are
// narrative-but-structured: a set of named sections (exam/indication/technique/comparison/
// impression/recommendation) plus structured arrays (findings, measurements, regions). Designed so
// future phases (prior-comparison, lesion tracking, DICOM metadata, change detection) can layer on
// without reshaping stored data. Client+server safe (no server-only imports).

import { scoreExtraction } from "@/backend/features/ai/extraction-confidence";
import type { BadgeTone } from "@/frontend/components/ui/Badge";

export interface ImagingMeasurement {
  value: string | null; // "3", "5.4 x 3.1"
  unit: string | null; // "mm", "cm"
  normalized: string | null; // "3 mm" (or null when not confidently parsed)
  associatedFinding: string | null;
  location: string | null;
  sourceText: string | null;
}

export interface ImagingFinding {
  finding: string | null;
  location: string | null;
  laterality: string | null; // left | right | bilateral | …
  severity: string | null; // mild | moderate | severe | none | …
  measurement: string | null; // display string for the table column
  explanation: string | null; // cautious one-line plain-language definition of the term
  sourceText: string | null; // the original sentence from the report
  confidence: number; // 0-100 per finding
  lowConfidenceFields: string[];
}

export interface ImagingExtraction {
  kind: "imaging";
  exam: string | null;
  indication: string | null;
  technique: string | null;
  comparison: string | null;
  radiologist: string | null;
  reportDate: string | null;
  regions: string[]; // anatomical regions (chest, brain, abdomen, …)
  findings: ImagingFinding[]; // notable/abnormal findings, one object each
  measurements: ImagingMeasurement[];
  impression: string[]; // ordered lines — the most clinically important section
  recommendations: string[];
  normalFindings: string[]; // "no acute fracture", "heart size normal", …
  confidence: number; // overall 0-100
  generatedAt: string; // ISO timestamp
}

const clean = (v: unknown): string | null => {
  if (typeof v === "number") return String(v);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
};

// Coerce an unknown value into a clean string[]: accepts an array, or a single delimited string.
function toStringList(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : clean(v) ? [v] : [];
  return raw
    .map(clean)
    .filter((s): s is string => s !== null)
    .flatMap((s) => (Array.isArray(v) ? [s] : s.split(/\n|;|•/)))
    .map((s) => s.replace(/^[-*\d.\s]+/, "").trim())
    .filter(Boolean);
}

// Map a free-text severity to a Badge tone (never colour alone — the label text is always shown).
export function severityTone(severity: string | null): BadgeTone {
  const s = severity?.toLowerCase() ?? "";
  if (!s) return "gray";
  if (/normal|none|no\b|unremarkable|negative/.test(s)) return "green";
  if (/severe|marked|critical|large|acute/.test(s)) return "red";
  if (/mild|moderate|minimal|small|mild-to-moderate/.test(s)) return "amber";
  return "gray";
}

// Normalize a measurement to "<value> <unit>" when confidently parseable; preserve the original.
export function normalizeMeasurement(
  value: string | null,
  unit: string | null,
  sourceText: string | null
): string | null {
  const v = clean(value);
  const u = clean(unit);
  if (v && u) return `${v} ${u}`;
  // Fall back to pulling a "<num> <unit>" (incl. "5.4 x 3.1 cm") out of the raw text.
  const src = clean(sourceText) ?? v ?? "";
  const m = src.match(/(\d+(?:\.\d+)?(?:\s*[x×]\s*\d+(?:\.\d+)?)*)\s*(mm|cm|ml|mL|cc)\b/);
  if (m) return `${m[1].replace(/\s*[x×]\s*/g, " x ")} ${m[2].toLowerCase()}`;
  return null;
}

function coerceFinding(raw: Record<string, unknown>, content: string): ImagingFinding | null {
  const finding = clean(raw.finding) ?? clean(raw.name) ?? clean(raw.description);
  const sourceText = clean(raw.sourceText) ?? clean(raw.source) ?? clean(raw.text);
  // Drop rows with nothing identifiable so we never render a blank finding.
  if (!finding && !sourceText) return null;

  const item = {
    finding,
    location: clean(raw.location),
    laterality: clean(raw.laterality) ?? clean(raw.side),
    severity: clean(raw.severity),
    measurement: clean(raw.measurement) ?? clean(raw.size),
    explanation: clean(raw.explanation) ?? clean(raw.plainExplanation),
    sourceText
  };
  const { score, lowConfidenceFields } = scoreExtraction(content, {
    finding: item.finding,
    location: item.location,
    severity: item.severity,
    sourceText: item.sourceText
  });
  return { ...item, confidence: score, lowConfidenceFields };
}

function coerceMeasurement(raw: Record<string, unknown>): ImagingMeasurement | null {
  const value = clean(raw.value) ?? clean(raw.size);
  const unit = clean(raw.unit);
  const sourceText = clean(raw.sourceText) ?? clean(raw.source) ?? clean(raw.text);
  if (!value && !sourceText) return null;
  return {
    value,
    unit,
    normalized: normalizeMeasurement(value, unit, sourceText),
    associatedFinding: clean(raw.associatedFinding) ?? clean(raw.finding),
    location: clean(raw.location),
    sourceText
  };
}

function asObjectArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    : [];
}

// Parse + coerce the raw LLM object into an ImagingExtraction. Never invents sections/findings.
export function validateImaging(raw: unknown, content: string): ImagingExtraction {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const findings = asObjectArray(obj.findings)
    .map((f) => coerceFinding(f, content))
    .filter((f): f is ImagingFinding => f !== null);
  const measurements = asObjectArray(obj.measurements)
    .map(coerceMeasurement)
    .filter((m): m is ImagingMeasurement => m !== null);

  const impression = toStringList(obj.impression);
  const exam = clean(obj.exam);
  const indication = clean(obj.indication);

  // Overall confidence: average the finding scores when present, else score the key sections.
  const overall = findings.length
    ? Math.round(findings.reduce((s, f) => s + f.confidence, 0) / findings.length)
    : scoreExtraction(content, { impression: impression.join(" ") || null, exam, indication })
        .score;

  return {
    kind: "imaging",
    exam,
    indication,
    technique: clean(obj.technique),
    comparison: clean(obj.comparison),
    radiologist: clean(obj.radiologist),
    reportDate: clean(obj.reportDate),
    regions: toStringList(obj.regions),
    findings,
    measurements,
    impression,
    recommendations: toStringList(obj.recommendations),
    normalFindings: toStringList(obj.normalFindings),
    confidence: overall,
    generatedAt: new Date().toISOString()
  };
}

// True when the extraction holds at least one structured element worth rendering.
export function hasImagingContent(e: ImagingExtraction): boolean {
  return (
    e.findings.length > 0 ||
    e.impression.length > 0 ||
    e.recommendations.length > 0 ||
    e.normalFindings.length > 0 ||
    !!e.exam
  );
}

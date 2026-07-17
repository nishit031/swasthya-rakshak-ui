// Canonical medication model + pure helpers for the medication intelligence layer. This is the
// single source of medication extraction for the app — designed so future phases (interaction
// checks, adherence, reconciliation, cross-record history) can layer on without refactoring the
// shape. Client+server safe (no server-only imports).

import { scoreExtraction } from "@/backend/features/ai/extraction-confidence";

export const MEDICATION_STATUSES = [
  "current",
  "completed",
  "discontinued",
  "prn",
  "unknown"
] as const;
export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

// A parsed value that keeps the faithful source text alongside a normalized form (or null when we
// couldn't confidently normalize) — so the UI can show the original and search/sort on the norm.
export interface ParsedValue {
  original: string | null;
  normalized: string | null;
}

export interface MedicationItem {
  name: string | null;
  genericName: string | null;
  brandName: string | null;
  strength: string | null;
  dosage: ParsedValue;
  route: string | null;
  frequency: ParsedValue;
  duration: string | null;
  quantity: string | null;
  refills: string | null;
  startDate: string | null;
  endDate: string | null;
  prn: boolean | null;
  instructions: string | null;
  prescriber: string | null;
  status: MedicationStatus;
  confidence: number; // 0-100 per medication
  lowConfidenceFields: string[]; // subset of name/dosage/frequency/duration/instructions
}

export interface MedicationExtraction {
  kind: "medication";
  medications: MedicationItem[];
  confidence: number; // overall 0-100
  generatedAt: string; // ISO timestamp
}

const clean = (v: unknown): string | null => {
  if (typeof v === "number") return String(v);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
};

function toBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  const s = clean(v)?.toLowerCase();
  if (!s) return null;
  if (["yes", "true", "prn", "as needed", "y"].includes(s)) return true;
  if (["no", "false", "n", "scheduled", "regular"].includes(s)) return false;
  return null;
}

function toStatus(v: unknown): MedicationStatus {
  const s = clean(v)?.toLowerCase().replace(/\s+/g, "");
  if (!s) return "unknown";
  if (s.includes("current") || s.includes("active") || s.includes("continu")) return "current";
  if (s.includes("complet") || s.includes("finish")) return "completed";
  if (s.includes("discontinu") || s.includes("stop") || s.includes("cancel")) return "discontinued";
  if (s === "prn" || s.includes("asneeded")) return "prn";
  return "unknown";
}

// --- Normalization (deterministic; preserves original, null when not confidently parsed) ---

// Common schedule expressions → a canonical short form. Keep it conservative: only map cases we're
// sure about; anything else returns null (UI/search fall back to the original text).
// Order matters: multi-dose and specific patterns are tested BEFORE the generic "daily" rule,
// so "twice daily" doesn't get matched by the "daily" alternative of the once-daily pattern.
const FREQUENCY_MAP: [RegExp, string][] = [
  [/\b(4 times|4x|qid|q\.i\.d)\b/i, "four times daily"],
  [/\b(thrice|3 times|3x|tid|t\.i\.d)\b/i, "three times daily"],
  [/\b(twice|2 times|2x|bid|b\.i\.d)\b/i, "twice daily"],
  [/\bq\.?8\.?h\b|\bevery 8 (hours|hrs?)\b/i, "every 8 hours"],
  [/\bq\.?12\.?h\b|\bevery 12 (hours|hrs?)\b/i, "every 12 hours"],
  [/\bq\.?6\.?h\b|\bevery 6 (hours|hrs?)\b/i, "every 6 hours"],
  [/\b(hs|at bedtime|bed ?time|nightly|at night)\b/i, "at bedtime"],
  [/\b(qam|every morning|in the morning|morning)\b/i, "every morning"],
  [/\b(weekly|once a week|every week)\b/i, "weekly"],
  [/\b(monthly|once a month|every month)\b/i, "monthly"],
  [/\b(prn|as needed|when required|sos)\b/i, "as needed"],
  [/\b(once|1 time|1x|od|q\.?d\.?|daily|every day)\b/i, "once daily"]
];

// Indian Rx slot notation: "1-0-1" = morning-noon-night (optionally a 4th slot). The number of
// non-zero slots is the doses per day; a single dose keeps its slot's timing.
const SLOT_FREQ = /\b([0-2])-([0-2])-([0-2])(?:-([0-2]))?\b/;

function normalizeSlotFrequency(text: string): string | null {
  const m = text.match(SLOT_FREQ);
  if (!m) return null;
  const slots = m.slice(1).filter((s) => s !== undefined);
  const doses = slots.filter((s) => s !== "0").length;
  if (doses >= 4) return "four times daily";
  if (doses === 3) return "three times daily";
  if (doses === 2) return "twice daily";
  if (doses === 1) {
    if (slots[0] !== "0") return "every morning";
    if (slots[slots.length - 1] !== "0") return "at bedtime";
    return "once daily";
  }
  return null; // "0-0-0" — nonsense, leave unnormalized
}

export function normalizeFrequency(original: string | null): ParsedValue {
  const o = clean(original);
  if (!o) return { original: o, normalized: null };
  const slot = normalizeSlotFrequency(o);
  if (slot) return { original: o, normalized: slot };
  for (const [re, norm] of FREQUENCY_MAP) if (re.test(o)) return { original: o, normalized: norm };
  return { original: o, normalized: null };
}

// Normalize a dose amount: numeric + unit (mg/ml/mcg/g/units/iu) or a written count of tablets/
// capsules → digits. Preserves original; null if we can't confidently parse.
const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  half: 0.5,
  "one and a half": 1.5
};

export function normalizeDosage(original: string | null): ParsedValue {
  const o = clean(original);
  if (!o) return { original: o, normalized: null };
  const lower = o.toLowerCase();

  // "500 mg", "5 ml", "20 units", "10 mcg", "1 g", "40 iu"
  const unit = lower.match(
    /(\d+(?:\.\d+)?)\s*(mg|mcg|ug|g|ml|units?|iu|tablets?|tabs?|caps?|capsules?|drops?|puffs?|mg\/ml)\b/
  );
  if (unit) {
    const num = unit[1];
    let u = unit[2].replace(/\.$/, "");
    if (/^tab/.test(u)) u = "tablet";
    if (/^cap/.test(u)) u = "capsule";
    if (/^unit/.test(u)) u = "units";
    return { original: o, normalized: `${num} ${u}` };
  }

  // "one tablet", "two capsules", "half tablet"
  const words = Object.keys(WORD_NUMBERS).sort((a, b) => b.length - a.length);
  for (const w of words) {
    const m = lower.match(new RegExp(`\\b${w}\\s+(tablet|tab|capsule|cap|puff|drop)s?\\b`));
    if (m) {
      const n = WORD_NUMBERS[w];
      let u = m[1];
      if (u === "tab") u = "tablet";
      if (u === "cap") u = "capsule";
      return { original: o, normalized: `${n} ${u}${n === 1 ? "" : "s"}` };
    }
  }
  return { original: o, normalized: null };
}

// --- Validation / coercion of the raw LLM array ---

function coerceItem(
  raw: Record<string, unknown>,
  content: string,
  engineConfidence?: number
): MedicationItem {
  const dosage = normalizeDosage(clean(raw.dosage) ?? clean(raw.dose));
  const frequency = normalizeFrequency(clean(raw.frequency) ?? clean(raw.schedule));
  const item: Omit<MedicationItem, "confidence" | "lowConfidenceFields"> = {
    name: clean(raw.name) ?? clean(raw.medication) ?? clean(raw.medicationName),
    genericName: clean(raw.genericName) ?? clean(raw.generic),
    brandName: clean(raw.brandName) ?? clean(raw.brand),
    strength: clean(raw.strength),
    dosage,
    route: clean(raw.route),
    frequency,
    duration: clean(raw.duration),
    quantity: clean(raw.quantity),
    refills: clean(raw.refills) ?? clean(raw.refillInformation) ?? clean(raw.refill),
    startDate: clean(raw.startDate),
    endDate: clean(raw.endDate),
    prn: toBool(raw.prn),
    instructions: clean(raw.instructions) ?? clean(raw.sig),
    prescriber: clean(raw.prescriber) ?? clean(raw.prescribingPhysician) ?? clean(raw.physician),
    status: toStatus(raw.status)
  };
  // PRN status and prn flag reinforce each other.
  if (item.status === "prn") item.prn = item.prn ?? true;

  const { score, lowConfidenceFields } = scoreExtraction(
    content,
    {
      name: item.name,
      dosage: item.dosage.original,
      frequency: item.frequency.original,
      duration: item.duration,
      instructions: item.instructions
    },
    engineConfidence
  );
  return { ...item, confidence: score, lowConfidenceFields };
}

// Merge only EXACT duplicates within one document (same normalized name + strength + frequency +
// instructions). Anything uncertain stays separate — we never collapse distinct regimens.
export function dedupeMedications(items: MedicationItem[]): MedicationItem[] {
  const seen = new Map<string, MedicationItem>();
  const out: MedicationItem[] = [];
  for (const m of items) {
    const key = [
      (m.name ?? "").toLowerCase().trim(),
      (m.strength ?? "").toLowerCase().trim(),
      (m.frequency.normalized ?? m.frequency.original ?? "").toLowerCase().trim(),
      (m.instructions ?? "").toLowerCase().trim()
    ].join("|");
    // Only treat as a dedupe candidate when we actually have a name to match on.
    if (m.name && seen.has(key)) continue;
    if (m.name) seen.set(key, m);
    out.push(m);
  }
  return out;
}

// Parse + coerce the raw LLM object into a MedicationExtraction. Accepts either { medications: [...] }
// or a bare array. Never invents medications; drops entries with no identifiable name AND no dosage.
// Pass the OCR engine's real mean confidence when available — it grounds each item's score.
export function validateMedications(
  raw: unknown,
  content: string,
  engineConfidence?: number
): MedicationExtraction {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { medications?: unknown })?.medications)
      ? (raw as { medications: unknown[] }).medications
      : [];

  const items = arr
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => coerceItem(x, content, engineConfidence))
    // Drop empty rows (nothing identifiable) so we never render a blank medication.
    .filter((m) => m.name || m.dosage.original || m.strength);

  const deduped = dedupeMedications(items);
  const overall = deduped.length
    ? Math.round(deduped.reduce((s, m) => s + m.confidence, 0) / deduped.length)
    : 0;

  return {
    kind: "medication",
    medications: deduped,
    confidence: overall,
    generatedAt: new Date().toISOString()
  };
}

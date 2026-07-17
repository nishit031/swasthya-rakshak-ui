// Canonical immunization model + pure helpers for the immunization intelligence layer. Immunization
// records are a structured table of vaccines given (not narrative sections), so this mirrors the
// medication schema shape. Designed so future phases (schedule/due tracking, catch-up) can layer on
// without reshaping stored data. Client+server safe (no server-only imports).

import { scoreExtraction } from "@/backend/features/ai/extraction-confidence";

export interface VaccineItem {
  name: string | null;
  doseNumber: number | null; // e.g. 1, 2, 3 in a series
  date: string | null; // date administered (YYYY-MM-DD if present)
  manufacturer: string | null;
  lotNumber: string | null;
  route: string | null; // e.g. "intramuscular", "oral"
  site: string | null; // e.g. "left deltoid"
  provider: string | null; // who administered it
  nextDueDate: string | null; // next dose due, only if the document states it
  confidence: number; // 0-100 per vaccine
  lowConfidenceFields: string[]; // subset of name/date/doseNumber
}

export interface ImmunizationExtraction {
  kind: "immunization";
  vaccines: VaccineItem[];
  confidence: number; // overall 0-100
  generatedAt: string; // ISO timestamp
}

const clean = (v: unknown): string | null => {
  if (typeof v === "number") return String(v);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
};

function toDoseNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = clean(v);
  if (!s) return null;
  const m = s.match(/\d+/); // "2nd dose", "dose 3", "booster 1"
  return m ? Number(m[0]) : null;
}

function coerceVaccine(raw: Record<string, unknown>, content: string): VaccineItem {
  const item: Omit<VaccineItem, "confidence" | "lowConfidenceFields"> = {
    name: clean(raw.name) ?? clean(raw.vaccine) ?? clean(raw.vaccineName),
    doseNumber: toDoseNumber(raw.doseNumber ?? raw.dose ?? raw.doseNo),
    date: clean(raw.date) ?? clean(raw.dateAdministered) ?? clean(raw.administeredOn),
    manufacturer: clean(raw.manufacturer) ?? clean(raw.make),
    lotNumber: clean(raw.lotNumber) ?? clean(raw.lot) ?? clean(raw.batchNumber) ?? clean(raw.batch),
    route: clean(raw.route),
    site: clean(raw.site) ?? clean(raw.location),
    provider: clean(raw.provider) ?? clean(raw.administeredBy) ?? clean(raw.physician),
    nextDueDate: clean(raw.nextDueDate) ?? clean(raw.nextDose) ?? clean(raw.dueDate)
  };

  const { score, lowConfidenceFields } = scoreExtraction(content, {
    name: item.name,
    date: item.date,
    doseNumber: item.doseNumber !== null ? String(item.doseNumber) : null
  });
  return { ...item, confidence: score, lowConfidenceFields };
}

// Parse + coerce the raw LLM object into an ImmunizationExtraction. Accepts either { vaccines: [...] }
// or a bare array. Never invents vaccines; drops entries with no identifiable name AND no date.
export function validateVaccines(raw: unknown, content: string): ImmunizationExtraction {
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { vaccines?: unknown })?.vaccines)
      ? (raw as { vaccines: unknown[] }).vaccines
      : [];

  const vaccines = arr
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => coerceVaccine(x, content))
    // Drop empty rows (nothing identifiable) so we never render a blank vaccine.
    .filter((v) => v.name || v.date);

  const overall = vaccines.length
    ? Math.round(vaccines.reduce((s, v) => s + v.confidence, 0) / vaccines.length)
    : 0;

  return {
    kind: "immunization",
    vaccines,
    confidence: overall,
    generatedAt: new Date().toISOString()
  };
}

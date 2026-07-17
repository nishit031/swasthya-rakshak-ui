// Canonical procedure model + pure helpers for the procedure/surgical intelligence layer.
// Procedural documents describe what/how/why was done and what happened after — distinct from
// clinical notes, medications, imaging, and labs. Designed so future phases (implant registry,
// operative history, recovery tracking, revision procedures) can layer on without reshaping stored
// data. Client+server safe (no server-only imports).

import { scoreExtraction } from "@/backend/features/ai/extraction-confidence";
import type { BadgeTone } from "@/frontend/components/ui/Badge";

export const PROCEDURE_OUTCOMES = [
  "successful",
  "completed",
  "partial",
  "aborted",
  "converted",
  "unknown"
] as const;
export type ProcedureOutcomeStatus = (typeof PROCEDURE_OUTCOMES)[number];

export interface ProcedureDevice {
  device: string | null;
  manufacturer: string | null;
  model: string | null;
  location: string | null;
}

export interface ProcedureSpecimen {
  specimen: string | null;
  collectionSite: string | null;
  purpose: string | null;
}

export interface ProcedureOutcome {
  status: ProcedureOutcomeStatus;
  original: string | null; // the report's own wording, preserved
}

export interface ProcedureExtraction {
  kind: "procedure";
  procedureName: string | null;
  procedureCategory: string | null;
  procedureDate: string | null;
  indication: string | null;
  surgeon: string | null;
  facility: string | null;
  operatingRoom: string | null;
  anesthesiaType: string | null;
  bodySite: string | null;
  estimatedBloodLoss: string | null;
  assistants: string[];
  steps: string[]; // high-level, ordered → the visual procedure timeline
  devices: ProcedureDevice[];
  specimens: ProcedureSpecimen[];
  intraoperativeFindings: string[];
  complications: string[]; // only if explicitly stated — never inferred
  postOpInstructions: string[];
  followUp: string[];
  outcome: ProcedureOutcome;
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
  const isArr = Array.isArray(v);
  const raw = isArr ? v : clean(v) ? [v] : [];
  return raw
    .map(clean)
    .filter((s): s is string => s !== null)
    .flatMap((s) => (isArr ? [s] : s.split(/\n|;|•/)))
    .map((s) => s.replace(/^[-*\d.)\s]+/, "").trim())
    .filter(Boolean);
}

// Map an outcome phrase to the enum while preserving the original wording. Conservative — anything
// unrecognized stays "unknown" (the UI/PDF still show the original text).
export function normalizeOutcome(v: unknown): ProcedureOutcome {
  const original = clean(v);
  const s = original?.toLowerCase() ?? "";
  if (!s) return { status: "unknown", original };
  if (/convert/.test(s)) return { status: "converted", original }; // "converted to open" — test first
  if (/abort|abandon|terminat/.test(s)) return { status: "aborted", original };
  if (/partial|incomplete/.test(s)) return { status: "partial", original };
  if (/success|uneventful|well[- ]tolerated|without complication/.test(s))
    return { status: "successful", original };
  if (/complet|finish|done/.test(s)) return { status: "completed", original };
  return { status: "unknown", original };
}

// Badge tone for an outcome (never colour alone — the label text is always shown).
export function outcomeTone(status: ProcedureOutcomeStatus): BadgeTone {
  switch (status) {
    case "successful":
    case "completed":
      return "green";
    case "partial":
      return "amber";
    case "aborted":
    case "converted":
      return "red";
    default:
      return "gray";
  }
}

function coerceDevice(raw: Record<string, unknown>): ProcedureDevice | null {
  const device = clean(raw.device) ?? clean(raw.name) ?? clean(raw.implant);
  if (!device) return null; // drop rows with no identifiable device
  return {
    device,
    manufacturer: clean(raw.manufacturer) ?? clean(raw.make),
    model: clean(raw.model),
    location: clean(raw.location) ?? clean(raw.site)
  };
}

function coerceSpecimen(raw: Record<string, unknown>): ProcedureSpecimen | null {
  const specimen = clean(raw.specimen) ?? clean(raw.name) ?? clean(raw.sample);
  if (!specimen) return null;
  return {
    specimen,
    collectionSite: clean(raw.collectionSite) ?? clean(raw.site) ?? clean(raw.location),
    purpose: clean(raw.purpose) ?? clean(raw.reason)
  };
}

function asObjectArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    : [];
}

// Parse + coerce the raw LLM object into a ProcedureExtraction. Never invents fields/findings.
export function validateProcedure(raw: unknown, content: string): ProcedureExtraction {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const devices = asObjectArray(obj.devices ?? obj.implants)
    .map(coerceDevice)
    .filter((d): d is ProcedureDevice => d !== null);
  const specimens = asObjectArray(obj.specimens)
    .map(coerceSpecimen)
    .filter((s): s is ProcedureSpecimen => s !== null);

  const procedureName = clean(obj.procedureName) ?? clean(obj.procedure) ?? clean(obj.name);
  const intraoperativeFindings = toStringList(obj.intraoperativeFindings ?? obj.findings);
  const complications = toStringList(obj.complications);
  const followUp = toStringList(obj.followUp);
  const outcome = normalizeOutcome(obj.outcome);

  const { score } = scoreExtraction(content, {
    procedureName,
    findings: intraoperativeFindings.join(" ") || null,
    outcome: outcome.original,
    complications: complications.join(" ") || null,
    followUp: followUp.join(" ") || null
  });

  return {
    kind: "procedure",
    procedureName,
    procedureCategory: clean(obj.procedureCategory) ?? clean(obj.category),
    procedureDate: clean(obj.procedureDate) ?? clean(obj.date),
    indication: clean(obj.indication) ?? clean(obj.reason),
    surgeon: clean(obj.surgeon) ?? clean(obj.physician),
    facility: clean(obj.facility) ?? clean(obj.hospital),
    operatingRoom: clean(obj.operatingRoom) ?? clean(obj.room),
    anesthesiaType: clean(obj.anesthesiaType) ?? clean(obj.anesthesia),
    bodySite: clean(obj.bodySite) ?? clean(obj.site),
    estimatedBloodLoss: clean(obj.estimatedBloodLoss) ?? clean(obj.bloodLoss) ?? clean(obj.ebl),
    assistants: toStringList(obj.assistants),
    steps: toStringList(obj.steps ?? obj.procedureSteps),
    devices,
    specimens,
    intraoperativeFindings,
    complications,
    postOpInstructions: toStringList(obj.postOpInstructions ?? obj.postOperativeInstructions),
    followUp,
    outcome,
    confidence: score,
    generatedAt: new Date().toISOString()
  };
}

// True when the extraction holds at least one structured element worth rendering.
export function hasProcedureContent(e: ProcedureExtraction): boolean {
  return (
    !!e.procedureName ||
    e.steps.length > 0 ||
    e.intraoperativeFindings.length > 0 ||
    e.devices.length > 0 ||
    e.specimens.length > 0 ||
    !!e.outcome.original ||
    e.followUp.length > 0
  );
}

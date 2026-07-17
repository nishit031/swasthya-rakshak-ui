// Canonical billing/administrative model + pure helpers for billing records and insurance claims.
// These are administrative (not clinical) documents — amounts, billing codes, and a claim status —
// so this family stands apart from the clinical/medication/imaging/procedure processors. Designed so
// future phases (payment tracking, claim reconciliation) can layer on without reshaping stored data.
// Client+server safe (no server-only imports).

import { scoreExtraction } from "@/backend/features/ai/extraction-confidence";
import type { BadgeTone } from "@/frontend/components/ui/Badge";

export const CLAIM_STATUSES = [
  "paid",
  "denied",
  "pending",
  "partial",
  "submitted",
  "unknown"
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export interface BillingCode {
  code: string | null;
  system: string | null; // e.g. "CPT", "HCPCS", "ICD-10"
  description: string | null;
}

export interface ClaimStatusValue {
  status: ClaimStatus;
  original: string | null; // the document's own wording, preserved
}

export interface BillingExtraction {
  kind: "billing";
  recordType: string | null; // e.g. "invoice", "insurance claim", "explanation of benefits"
  provider: string | null; // billing provider / facility
  date: string | null;
  serviceDescription: string | null;
  codes: BillingCode[];
  amountCharged: string | null; // preserve currency wording as written
  amountPaid: string | null;
  payer: string | null; // insurer / payer
  denialReason: string | null;
  claimStatus: ClaimStatusValue;
  confidence: number; // overall 0-100
  generatedAt: string; // ISO timestamp
}

const clean = (v: unknown): string | null => {
  if (typeof v === "number") return String(v);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
};

// Map a status phrase to the enum while preserving the original wording. Conservative — anything
// unrecognized stays "unknown" (the UI/PDF still show the original text).
export function normalizeClaimStatus(v: unknown): ClaimStatusValue {
  const original = clean(v);
  const s = original?.toLowerCase() ?? "";
  if (!s) return { status: "unknown", original };
  if (/den(y|ied|ial)|reject/.test(s)) return { status: "denied", original };
  if (/partial/.test(s)) return { status: "partial", original };
  if (/paid|settled|approved|reimbursed/.test(s)) return { status: "paid", original };
  if (/pend|process|review|adjudicat/.test(s)) return { status: "pending", original };
  if (/submit|filed|sent/.test(s)) return { status: "submitted", original };
  return { status: "unknown", original };
}

// Badge tone for a claim status (never colour alone — the label text is always shown).
export function claimStatusTone(status: ClaimStatus): BadgeTone {
  switch (status) {
    case "paid":
      return "green";
    case "denied":
      return "red";
    case "partial":
    case "pending":
      return "amber";
    case "submitted":
      return "blue";
    default:
      return "gray";
  }
}

function coerceCode(raw: Record<string, unknown>): BillingCode | null {
  const code = clean(raw.code);
  const description = clean(raw.description) ?? clean(raw.desc);
  if (!code && !description) return null; // drop rows with nothing identifiable
  return {
    code,
    system: clean(raw.system) ?? clean(raw.codeSystem) ?? clean(raw.type),
    description
  };
}

function asObjectArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    : [];
}

// Parse + coerce the raw LLM object into a BillingExtraction. Never invents fields, amounts, or codes.
export function validateBilling(raw: unknown, content: string): BillingExtraction {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const codes = asObjectArray(obj.codes ?? obj.billingCodes)
    .map(coerceCode)
    .filter((c): c is BillingCode => c !== null);

  const provider = clean(obj.provider) ?? clean(obj.facility) ?? clean(obj.biller);
  const serviceDescription = clean(obj.serviceDescription) ?? clean(obj.service);
  const claimStatus = normalizeClaimStatus(obj.claimStatus ?? obj.status);

  const { score } = scoreExtraction(content, {
    provider,
    serviceDescription,
    amountCharged: clean(obj.amountCharged) ?? clean(obj.totalCharged),
    status: claimStatus.original
  });

  return {
    kind: "billing",
    recordType: clean(obj.recordType) ?? clean(obj.documentType) ?? clean(obj.type),
    provider,
    date: clean(obj.date) ?? clean(obj.serviceDate) ?? clean(obj.invoiceDate),
    serviceDescription,
    codes,
    amountCharged: clean(obj.amountCharged) ?? clean(obj.totalCharged) ?? clean(obj.charged),
    amountPaid: clean(obj.amountPaid) ?? clean(obj.paid) ?? clean(obj.totalPaid),
    payer: clean(obj.payer) ?? clean(obj.insurer) ?? clean(obj.insurance),
    denialReason: clean(obj.denialReason) ?? clean(obj.reasonForDenial),
    claimStatus,
    confidence: score,
    generatedAt: new Date().toISOString()
  };
}

// True when the extraction holds at least one field worth rendering.
export function hasBillingContent(e: BillingExtraction): boolean {
  return (
    !!e.provider ||
    !!e.serviceDescription ||
    e.codes.length > 0 ||
    !!e.amountCharged ||
    !!e.amountPaid ||
    !!e.payer ||
    !!e.claimStatus.original
  );
}

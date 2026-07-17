// Smart tags (Phase 7A §2) — derived ONLY from structured data already on the record, never from
// a fresh AI call. Mirrors the per-`kind` switch in timeline.service.ts's `processedHighlight` and
// the `*/search-text.ts` builders. Client+server safe (no Prisma import) so the card can render
// tags without a round-trip, and each tag's `filter` is a ready-to-apply MedicalRecordFilters
// patch — clicking a tag IS the filter shortcut, so nothing needs to be indexed/stored.

import type { BadgeTone } from "@/frontend/components/ui/Badge";
import { groupFor, type DocGroup } from "./document-types";
import { modalityFor } from "./imaging/imaging.registry";
import { outcomeTone } from "./procedure/procedure.schema";
import { claimStatusTone } from "./billing/billing.schema";
import type { MedicalExtraction } from "./medical-records.types";
import type { MedicalRecordFilters } from "./filters";

export interface RecordTag {
  // Literal fallback text (used as-is for condition keywords — free medical terms scanned out of
  // the source document, which may itself be in either language).
  label: string;
  // Preferred i18n key when one already exists for this concept (group/status enums) — the
  // renderer should call t(labelKey) and fall back to `label` only if it's absent.
  labelKey?: string;
  tone: BadgeTone;
  filter: Partial<MedicalRecordFilters>;
}

const GROUP_TONE: Record<DocGroup, BadgeTone> = {
  clinical: "blue",
  imaging: "gray",
  medication: "green",
  procedure: "amber",
  administrative: "red",
  other: "gray"
};

// Deliberately small and literal — never AI-guessed. Scanned out of the source document's own
// (possibly Hindi) text, so these stay as plain condition names rather than a translated key; a
// miss just means no condition tag, never a wrong one. Extend as real documents surface more.
// Exported for reuse by the patient-intelligence condition index — same keyword list, same rule.
export const CONDITION_KEYWORDS: [RegExp, string][] = [
  [/diabet/i, "Diabetes"],
  [/hypertension|high blood pressure/i, "Hypertension"],
  [/asthma/i, "Asthma"],
  [/thyroid/i, "Thyroid"],
  [/anemia|anaemia/i, "Anemia"],
  [/cardiac|heart disease|coronary/i, "Cardiology"],
  [/cancer|carcinoma|tumou?r|malignan/i, "Oncology"],
  [/fracture/i, "Fracture"],
  [/pregnan/i, "Pregnancy"],
  [/allerg/i, "Allergy"]
];

function conditionTagsFromText(text: string | null | undefined): RecordTag[] {
  if (!text) return [];
  const tags: RecordTag[] = [];
  const seen = new Set<string>();
  for (const [re, label] of CONDITION_KEYWORDS) {
    if (re.test(text) && !seen.has(label)) {
      seen.add(label);
      tags.push({ label, tone: "blue", filter: { search: label.toLowerCase() } });
    }
  }
  return tags;
}

function clinicalConditionText(data: Extract<MedicalExtraction, { kind: "clinical" }>): string {
  const s = data.sections ?? {};
  const pick = s.primary_diagnosis ?? s.final_diagnosis ?? s.diagnosis ?? s.assessment;
  return Array.isArray(pick) ? pick.join(" ") : (pick ?? "");
}

// Derives the tag chips for one record. `documentType` drives the group/modality/referral tags
// even when `extraction` is null (unprocessed records still get a family tag from their type).
export function deriveTags(
  documentType: string | null,
  extraction: MedicalExtraction | null
): RecordTag[] {
  const group = groupFor(documentType);
  const tags: RecordTag[] = [
    {
      label: group,
      labelKey: `medicalRecordsAi.docGroup.${group}`,
      tone: GROUP_TONE[group],
      filter: { category: [group] }
    }
  ];

  if (documentType === "referral_note") {
    tags.push({
      label: "Referral",
      labelKey: "medicalRecordTypes.referral_note",
      tone: "blue",
      filter: { documentType: ["referral_note"] }
    });
  }

  if (!extraction) return tags;

  if (extraction.kind === "clinical") {
    tags.push(...conditionTagsFromText(clinicalConditionText(extraction)));
  }

  if (extraction.kind === "medication" && extraction.medications.length > 0) {
    tags.push({
      label: "Medication",
      labelKey: "medicalRecordsAi.docGroup.medication",
      tone: "green",
      filter: { category: ["medication"] }
    });
  }

  if (extraction.kind === "imaging") {
    const modality = modalityFor(documentType);
    if (modality) {
      tags.push({ label: modality, tone: "gray", filter: { documentType: [documentType!] } });
    }
  }

  if (extraction.kind === "procedure") {
    tags.push({
      label: "Surgery",
      labelKey: "medicalRecordsAi.docGroup.procedure",
      tone: "amber",
      filter: { category: ["procedure"] }
    });
    if (extraction.outcome.status !== "unknown") {
      tags.push({
        label: extraction.outcome.status,
        labelKey: `procedureOutcome.${extraction.outcome.status}`,
        tone: outcomeTone(extraction.outcome.status),
        filter: { search: extraction.outcome.status }
      });
    }
  }

  if (extraction.kind === "immunization") {
    tags.push({
      label: "Vaccination",
      labelKey: "medicalRecordTypes.vaccination_record",
      tone: "blue",
      filter: { category: ["clinical"] }
    });
  }

  if (extraction.kind === "billing") {
    tags.push({
      label: "Billing",
      labelKey: "medicalRecordsAi.docGroup.administrative",
      tone: "red",
      filter: { category: ["administrative"] }
    });
    if (extraction.claimStatus.status !== "unknown") {
      tags.push({
        label: extraction.claimStatus.status,
        labelKey: `claimStatus.${extraction.claimStatus.status}`,
        tone: claimStatusTone(extraction.claimStatus.status),
        filter: { search: extraction.claimStatus.status }
      });
    }
  }

  return tags;
}

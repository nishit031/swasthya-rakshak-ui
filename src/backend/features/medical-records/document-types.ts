// Config-driven registry of supported medical document types. This is the single source of
// truth for classification: the AI prompt, the `category` grouping, and (in later phases) each
// type's summary prompt / metadata extractor / display component are all keyed off `key`.
// Adding a new type here is the only step needed to make it classifiable — no other file should
// hardcode a document-type list.

export type DocGroup =
  "clinical" | "imaging" | "medication" | "procedure" | "administrative" | "other";

export interface MedicalDocType {
  key: string;
  label: string;
  group: DocGroup;
  // Extension seams for later phases — deliberately unpopulated in Phase 1.
  summaryPrompt?: string;
  metadataFields?: string[];
}

export const MEDICAL_DOC_TYPES: MedicalDocType[] = [
  { key: "doctor_note", label: "Doctor Note", group: "clinical" },
  { key: "clinician_note", label: "Clinician Note", group: "clinical" },
  { key: "consultation_note", label: "Consultation Note", group: "clinical" },
  { key: "history_physical", label: "History & Physical Examination", group: "clinical" },
  { key: "diagnosis", label: "Diagnosis", group: "clinical" },
  { key: "treatment_plan", label: "Treatment Plan", group: "clinical" },
  { key: "xray_report", label: "X-Ray Report", group: "imaging" },
  { key: "mri_report", label: "MRI Report", group: "imaging" },
  { key: "ct_report", label: "CT Report", group: "imaging" },
  { key: "ultrasound_report", label: "Ultrasound Report", group: "imaging" },
  { key: "prescription", label: "Prescription", group: "medication" },
  { key: "medication_list", label: "Medication List", group: "medication" },
  { key: "procedure_note", label: "Procedure Note", group: "procedure" },
  { key: "surgery_report", label: "Surgery Report", group: "procedure" },
  { key: "discharge_summary", label: "Discharge Summary", group: "clinical" },
  { key: "referral_note", label: "Referral Note", group: "clinical" },
  { key: "immunization_record", label: "Immunization Record", group: "clinical" },
  { key: "vaccination_record", label: "Vaccination Record", group: "clinical" },
  { key: "billing_record", label: "Billing Record", group: "administrative" },
  { key: "insurance_claim", label: "Insurance Claim Record", group: "administrative" },
  { key: "other", label: "Other", group: "other" }
];

export const DOC_TYPE_KEYS = MEDICAL_DOC_TYPES.map((d) => d.key);

export function getDocType(key?: string | null): MedicalDocType | undefined {
  return key ? MEDICAL_DOC_TYPES.find((d) => d.key === key) : undefined;
}

export function groupFor(key?: string | null): DocGroup {
  return getDocType(key)?.group ?? "other";
}

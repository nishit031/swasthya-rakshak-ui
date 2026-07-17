// The clinical-document factory: maps a documentType to its section config + summary focus.
// All clinical note types share ONE processor/prompt/schema/renderer (clinical.*), configured
// only by the entry here — adding a clinical type is a single entry, no new code paths.
//
// Client+server safe (plain data). Keyed by document-types.ts registry keys.

import type { SectionDef } from "./clinical.schema";

export interface ClinicalConfig {
  sections: SectionDef[];
  // Appended to the shared summary prompt to steer emphasis per document type.
  summaryFocus: string;
}

export const CLINICAL_TYPES: Record<string, ClinicalConfig> = {
  doctor_note: {
    summaryFocus:
      "why the patient came in, what was found, what the clinician decided, and what happens next",
    sections: [
      { key: "visit_reason", description: "the reason for the visit", type: "text" },
      { key: "chief_complaint", description: "the patient's main complaint", type: "text" },
      {
        key: "history_present_illness",
        description: "the history of the present illness (HPI)",
        type: "text"
      },
      { key: "assessment", description: "the clinician's assessment", type: "text" },
      { key: "diagnosis", description: "the diagnosis or diagnoses", type: "text" },
      { key: "treatment_plan", description: "the treatment plan", type: "text" },
      { key: "follow_up", description: "follow-up instructions", type: "text" },
      {
        key: "medications",
        description: "medications prescribed or continued (name + dose if present)",
        type: "list"
      }
    ]
  },

  consultation_note: {
    summaryFocus: "the consultation reason, findings, specialist recommendations, and next steps",
    sections: [
      { key: "referring_physician", description: "the referring physician", type: "text" },
      {
        key: "consulting_physician",
        description: "the consulting/specialist physician",
        type: "text"
      },
      { key: "consultation_reason", description: "the reason for the consultation", type: "text" },
      { key: "findings", description: "the consultant's findings", type: "text" },
      { key: "recommendations", description: "the consultant's recommendations", type: "text" },
      { key: "next_steps", description: "the agreed next steps", type: "text" }
    ]
  },

  history_physical: {
    summaryFocus: "the clinical history, exam findings, assessment, and plan",
    sections: [
      { key: "chief_complaint", description: "the chief complaint", type: "text" },
      {
        key: "history_present_illness",
        description: "the history of the present illness (HPI)",
        type: "text"
      },
      { key: "past_medical_history", description: "past medical history", type: "text" },
      { key: "surgical_history", description: "past surgical history", type: "text" },
      { key: "family_history", description: "family history", type: "text" },
      { key: "social_history", description: "social history", type: "text" },
      { key: "allergies", description: "known allergies", type: "list" },
      {
        key: "medications",
        description: "current medications (name + dose if present)",
        type: "list"
      },
      { key: "review_of_systems", description: "the review of systems (ROS)", type: "text" },
      { key: "physical_examination", description: "physical examination findings", type: "text" },
      { key: "assessment", description: "the clinician's assessment", type: "text" },
      { key: "plan", description: "the care plan", type: "text" }
    ]
  },

  diagnosis: {
    summaryFocus:
      "what the diagnosis is, how severe it is, its current status, and the evidence behind it",
    sections: [
      { key: "primary_diagnosis", description: "the primary diagnosis", type: "text" },
      {
        key: "secondary_diagnoses",
        description: "any secondary or additional diagnoses",
        type: "list"
      },
      { key: "severity", description: "the severity or stage", type: "text" },
      { key: "status", description: "the current status (e.g. active, resolved)", type: "text" },
      { key: "clinical_notes", description: "supporting clinical notes", type: "text" },
      {
        key: "supporting_evidence",
        description: "test results or findings supporting the diagnosis",
        type: "list"
      }
    ]
  },

  treatment_plan: {
    summaryFocus:
      "the treatment goals, what medications and procedures are planned, and how progress is monitored",
    sections: [
      { key: "goals", description: "the treatment goals", type: "list" },
      {
        key: "medications",
        description: "planned medications (name + dose if present)",
        type: "list"
      },
      { key: "procedures", description: "planned procedures or interventions", type: "list" },
      {
        key: "lifestyle_recommendations",
        description: "lifestyle or self-care recommendations",
        type: "list"
      },
      { key: "monitoring", description: "how the condition will be monitored", type: "text" },
      { key: "follow_up_schedule", description: "the follow-up schedule", type: "text" }
    ]
  },

  discharge_summary: {
    summaryFocus:
      "why the patient was admitted, what happened during the stay, and what to do after discharge",
    sections: [
      { key: "admission_reason", description: "the reason for admission", type: "text" },
      { key: "hospital_course", description: "the course of the hospital stay", type: "text" },
      { key: "procedures", description: "procedures performed during the stay", type: "list" },
      { key: "final_diagnosis", description: "the final diagnosis at discharge", type: "text" },
      {
        key: "discharge_medications",
        description: "medications to take after discharge (name + dose if present)",
        type: "list"
      },
      {
        key: "discharge_instructions",
        description: "instructions to follow after discharge",
        type: "text"
      },
      { key: "follow_up", description: "follow-up instructions", type: "text" }
    ]
  },

  referral_note: {
    summaryFocus: "who is being referred to whom, why, and what evaluation is being requested",
    sections: [
      { key: "referring_physician", description: "the referring physician", type: "text" },
      { key: "target_specialty", description: "the specialty being referred to", type: "text" },
      { key: "referral_reason", description: "the reason for the referral", type: "text" },
      { key: "clinical_background", description: "relevant clinical background", type: "text" },
      {
        key: "requested_evaluation",
        description: "the evaluation or service being requested",
        type: "text"
      }
    ]
  },

  clinician_note: {
    summaryFocus: "the clinician's observations, assessment, and what they recommend next",
    sections: [
      { key: "observations", description: "the clinician's observations", type: "text" },
      { key: "assessment", description: "the clinician's assessment", type: "text" },
      { key: "recommendations", description: "the clinician's recommendations", type: "list" },
      { key: "care_plan", description: "the care plan", type: "text" },
      { key: "follow_up", description: "follow-up instructions", type: "text" }
    ]
  }
};

export function getClinicalConfig(documentType?: string | null): ClinicalConfig | undefined {
  return documentType ? CLINICAL_TYPES[documentType] : undefined;
}

export function isClinicalProcessable(documentType?: string | null): boolean {
  return getClinicalConfig(documentType) !== undefined;
}

// Shared types for the Patient Intelligence layer (Medical Records Phase 7B). Every value here is
// derived from already-structured extraction data (never OCR, never a fresh LLM call) — the
// `provenance` field lets the UI say plainly whether something is a documented fact read straight
// off a record ("fact") or a deterministic cross-record observation computed here ("pattern").
// A third provenance, "ai_summary", is reserved for the narrative patient summary — deferred to the
// next phase — and is never emitted by this module.

import type { DocGroup } from "../medical-records/document-types";
import type { MedicalExtraction } from "../medical-records/medical-records.types";
import type { MedicationStatus } from "../medical-records/medication/medication.schema";

export type Provenance = "fact" | "pattern" | "ai_summary";

export interface CareEvent {
  recordId: string;
  documentType: string | null;
  kind: MedicalExtraction["kind"] | null;
  group: DocGroup;
  title: string;
  date: string; // ISO — visitDate ?? createdAt
  provider: string | null;
  facility: string | null;
  bodyRegion: string | null;
  diagnoses: string[];
  medications: string[];
}

export interface CareEpisode {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  events: CareEvent[];
  provenance: "pattern";
}

export interface RecordLink {
  fromRecordId: string;
  toRecordId: string;
  reason: string;
  confidence: number; // 0-1
  provenance: "fact";
}

export interface ConditionTimeline {
  name: string;
  firstMentioned: string;
  lastMentioned: string;
  recordIds: string[];
  medicationNames: string[];
  latestFollowUp: string | null;
  provenance: "fact";
}

export interface MedicationTimelineEvent {
  type:
    "started" | "changed" | "dose_modified" | "stopped" | "current" | "discontinued" | "unknown";
  date: string | null;
  recordId: string;
  dosage: string | null;
  frequency: string | null;
}

export interface MedicationTimeline {
  name: string;
  events: MedicationTimelineEvent[];
  currentStatus: MedicationStatus;
  provenance: "fact";
}

export interface ImagingStudy {
  recordId: string;
  date: string | null;
  impression: string | null;
}

export interface ImagingHistoryGroup {
  region: string;
  modality: string | null;
  studies: ImagingStudy[];
  provenance: "fact";
}

export interface ProcedureHistoryEvent {
  recordId: string;
  date: string | null;
  outcome: string;
}

export interface ProcedureHistoryGroup {
  name: string;
  events: ProcedureHistoryEvent[];
  provenance: "fact";
}

export interface VaccinationDose {
  doseNumber: number | null;
  date: string | null;
  recordId: string;
}

export interface VaccinationEntry {
  name: string;
  doses: VaccinationDose[];
  upcoming: { date: string; note: string } | null; // only when a record explicitly states nextDueDate
  provenance: "fact";
}

export interface FollowUp {
  recordId: string;
  description: string;
  documentType: string | null;
  date: string; // the source record's own date — never an invented due date
  provenance: "fact";
}

export interface RecordSummary {
  recordId: string;
  title: string;
  documentType: string | null;
  date: string;
  category: string;
}

export interface PatientInsight {
  text: string;
  provenance: "pattern";
}

export interface PatientProfile {
  generatedAt: string;
  recordCount: number;
  unprocessedCount: number;
  conditions: ConditionTimeline[];
  medications: MedicationTimeline[];
  imaging: ImagingHistoryGroup[];
  procedures: ProcedureHistoryGroup[];
  vaccinations: VaccinationEntry[];
  recentHospitalizations: CareEvent[];
  recentVisits: CareEvent[];
  providers: string[];
  facilities: string[];
  followUps: FollowUp[];
  recentRecords: RecordSummary[];
  episodes: CareEpisode[];
  links: RecordLink[];
  insights: PatientInsight[];
}

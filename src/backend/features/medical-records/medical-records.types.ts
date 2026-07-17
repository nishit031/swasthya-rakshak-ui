import type { ClinicalExtraction } from "./clinical/clinical.schema";
import type { MedicationExtraction } from "./medication/medication.schema";
import type { ImagingExtraction } from "./imaging/imaging.schema";
import type { ProcedureExtraction } from "./procedure/procedure.schema";
import type { ImmunizationExtraction } from "./immunization/immunization.schema";
import type { BillingExtraction } from "./billing/billing.schema";

// A processed record's structured output is a discriminated union by `kind`. Add a new base here
// by extending the union — the card/renderer/timeline switch on `kind`.
export type MedicalExtraction =
  | ClinicalExtraction
  | MedicationExtraction
  | ImagingExtraction
  | ProcedureExtraction
  | ImmunizationExtraction
  | BillingExtraction;

export interface MedicalRecord {
  id: string;
  userId: string;
  familyMemberId: string | null;
  title: string;
  category: string;
  documentType: string | null;
  physician: string | null;
  extractionConfidence: number | null;
  summaryText: string | null;
  extractedDataJson: MedicalExtraction | null;
  searchText: string | null;
  fileUrl: string;
  fileType: string;
  thumbnailUrl: string | null;
  sourceName: string | null;
  visitDate: Date | null;
  notes: string | null;
  originalFilename: string | null;
  fileSizeBytes: number | null;
  sha256: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMedicalRecordInput {
  familyMemberId?: string;
  title: string;
  // Optional — when documentType is provided, category is derived from the registry group.
  category?: string;
  documentType?: string;
  physician?: string;
  extractionConfidence?: number;
  fileUrl: string;
  fileType: string;
  thumbnailUrl?: string;
  sourceName?: string;
  visitDate?: string;
  notes?: string;
  // Layer 1 (original-file) metadata, produced by the /upload endpoint.
  originalFilename?: string;
  fileSizeBytes?: number;
  sha256?: string;
}

// Editable metadata subset (Phase 7A "Record editing"). Never touches extractedDataJson/
// summaryText/searchText/fileUrl — those are only written by the on-demand processing pipeline.
// `familyMemberId: null` explicitly clears it (moves the record back to "self").
export interface UpdateMedicalRecordInput {
  familyMemberId?: string | null;
  title?: string;
  documentType?: string;
  physician?: string;
  sourceName?: string;
  visitDate?: string | null;
  notes?: string;
}

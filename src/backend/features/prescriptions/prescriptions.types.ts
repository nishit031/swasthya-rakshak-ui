import type { Medicine } from "./medicine";

export interface Prescription {
  id: string;
  userId: string;
  familyMemberId: string | null;
  prescribedById: string | null;
  dailyVisitId: string | null;
  doctorName: string | null;
  hospitalName: string | null;
  visitDate: Date | null;
  medicinesJson: unknown;
  diagnosis: string | null;
  attachmentUrl: string | null;
  createdAt: Date;
  // Populated when a connected doctor authored this prescription in-app.
  prescribedByName?: string | null;
}

export interface CreatePrescriptionInput {
  familyMemberId?: string;
  doctorName?: string;
  hospitalName?: string;
  visitDate?: string;
  medicinesJson?: Medicine[];
  diagnosis?: string;
  attachmentUrl?: string;
}

// Used by a doctor prescribing to one of their connected patients.
export interface CreatePrescriptionForPatientInput extends CreatePrescriptionInput {
  patientId: string;
  // The daily-queue visit this prescription was written under, if any.
  dailyVisitId?: string;
}

// Used by a doctor editing one of their own prescriptions (no patient/visit reassignment).
export type UpdatePrescriptionInput = CreatePrescriptionInput;

// Prescription as seen by the authoring doctor — carries the patient's display name.
export interface DoctorAuthoredPrescription extends Prescription {
  patientName: string;
}

import type { Prescription } from "@/backend/features/prescriptions/prescriptions.types";

export interface DailyVisit {
  id: string;
  doctorId: string;
  patientId: string;
  visitDate: Date;
  tokenNumber: number;
  createdAt: Date;
  patientName: string;
  patientPhone: string;
  // Prescriptions written under this visit — empty until the doctor prescribes.
  prescriptions: Prescription[];
}

export interface AddDailyVisitInput {
  patientId: string;
  date?: string;
}

import type { MedicalRecordFilters } from "@/backend/features/medical-records/filters";

// A user-named, saved Medical Records filter combination shown in the sidebar (Phase 7A §3).
export interface SavedView {
  id: string;
  userId: string;
  name: string;
  filterJson: MedicalRecordFilters;
  createdAt: Date;
}

export interface CreateSavedViewInput {
  name: string;
  filterJson: MedicalRecordFilters;
}

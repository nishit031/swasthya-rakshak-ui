import type { RecordTag } from "@/backend/features/medical-records/tags";

export interface TimelineEvent {
  id: string;
  userId: string;
  familyMemberId: string | null;
  eventType: string;
  referenceType: string | null;
  referenceId: string | null;
  title: string;
  description: string | null;
  // Physician/facility, when the underlying record has one — used to sub-group same-day events
  // by "same physician" / "same hospitalization" (Phase 7A §8).
  physician: string | null;
  facility: string | null;
  // Smart tags (medical_record events only — see tags.ts); empty for other event types.
  tags: RecordTag[];
  eventDate: Date;
  createdAt: Date;
}

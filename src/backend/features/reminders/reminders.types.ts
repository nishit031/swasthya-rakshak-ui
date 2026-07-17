export interface Reminder {
  id: string;
  userId: string;
  familyMemberId: string | null;
  prescriptionId: string | null;
  title: string;
  reminderType: string;
  scheduledAt: Date;
  repeatType: string | null;
  status: string;
  courseEndDate: Date | null;
  completedAt: Date | null;
  retryCount: number;
  snoozedUntil: Date | null;
  doseSlot: string | null;
  doseFood: string | null;
  createdAt: Date;
  /** The prescription's diagnosis note, surfaced in the popup as "instructions". */
  prescriptionDiagnosis?: string | null;
}

export interface CreateReminderInput {
  familyMemberId?: string;
  title: string;
  reminderType: string;
  scheduledAt: string;
  repeatType?: string;
}

export interface UpdateReminderInput {
  title?: string;
  reminderType?: string;
  scheduledAt?: string;
  repeatType?: string;
  status?: string;
  /** Snooze this reminder for a retry instead of completing it (SQS-DLQ-style dismiss). */
  dismiss?: boolean;
}

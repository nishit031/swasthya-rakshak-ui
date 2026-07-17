"use client";

import { useEffect, useRef } from "react";
import { apiFetch } from "@/backend/lib/api-client";
import type { Reminder } from "@/backend/features/reminders/reminders.types";
import { typeConfig } from "@/backend/features/reminders/reminder-ui";
import {
  acknowledgeOccurrence,
  currentDueOccurrence,
  loadShownKeys,
  occurrenceKey,
  saveShownKeys
} from "@/backend/features/reminders/reminder-schedule";
import { useNotification } from "@/frontend/components/providers/NotificationContext";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

const POLL_MS = 30_000;
// Drop fired-occurrence keys older than this so the set doesn't grow without bound.
const KEY_TTL_MS = 2 * 24 * 60 * 60 * 1000;

function isRecurring(repeatType: string | null): boolean {
  return !!repeatType && repeatType !== "none";
}

/** Polls for due reminders and surfaces them as slide-in toasts. Renders nothing. */
export function ReminderWatcher() {
  const { notify, dismiss } = useNotification();
  const { t, formatMessage } = useTranslation();
  const shownRef = useRef<Set<string>>(loadShownKeys());

  useEffect(() => {
    async function check() {
      const res = await apiFetch<Reminder[]>("/reminders");
      if (!res.success) return;
      const reminders = res.data ?? [];

      const now = new Date();

      // Prune stale keys: occurrences older than the TTL (parsed from the key's timestamp).
      for (const key of shownRef.current) {
        const iso = key.split("::")[1];
        const ts = iso ? Date.parse(iso) : NaN;
        if (Number.isNaN(ts) || now.getTime() - ts > KEY_TTL_MS) shownRef.current.delete(key);
      }

      for (const reminder of reminders) {
        if (reminder.status !== "active") continue;

        const recurring = isRecurring(reminder.repeatType);

        // Non-recurring reminders (every prescription dose, and one-time manual reminders) fire
        // at `scheduledAt`, then again at `snoozedUntil` after each dismiss — an SQS-DLQ-style
        // redrive, up to MAX_RETRIES. Recurring reminders keep firing on their normal occurrence.
        let fireAt: Date | null;
        if (recurring) {
          fireAt = currentDueOccurrence(
            new Date(reminder.scheduledAt),
            reminder.repeatType,
            now,
            reminder.courseEndDate ? new Date(reminder.courseEndDate) : null
          );
        } else {
          const due = new Date(reminder.snoozedUntil ?? reminder.scheduledAt);
          fireAt = due.getTime() <= now.getTime() ? due : null;
        }
        if (!fireAt) continue;

        const fireAtISO = fireAt.toISOString();
        const key = occurrenceKey(reminder.id, fireAtISO);
        if (shownRef.current.has(key)) continue;
        shownRef.current.add(key);

        const { icon, tone } = typeConfig(reminder.reminderType);
        const timeLabel = fireAt.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short"
        });

        const hasDose = !!reminder.doseSlot && !!reminder.doseFood;
        let body = hasDose
          ? formatMessage("reminders.notification.doseBody", {
              slot: t(`reminders.notification.slot.${reminder.doseSlot}`),
              food: t(`reminders.notification.food.${reminder.doseFood}`),
              time: timeLabel
            })
          : formatMessage("reminders.notification.dueBody", {
              type: reminder.reminderType,
              time: timeLabel
            });
        if (reminder.prescriptionDiagnosis) {
          body += ` · ${formatMessage("reminders.notification.instructionsNote", {
            diagnosis: reminder.prescriptionDiagnosis
          })}`;
        }

        // Recurring reminders acknowledge only the current dose (no status change) and fire
        // again at the next occurrence; non-recurring ones (medication doses, one-time manual
        // reminders) can be marked done for good, or dismissed — which snoozes a retry on the
        // server instead of ending the reminder, so it never silently completes.
        const actions = recurring
          ? [
              {
                label: t("reminders.notification.taken"),
                variant: "primary" as const,
                onClick: () => {
                  acknowledgeOccurrence(reminder.id, fireAtISO);
                  dismiss(reminder.id);
                }
              },
              {
                label: t("reminders.notification.dismiss"),
                variant: "outline" as const,
                onClick: () => {
                  acknowledgeOccurrence(reminder.id, fireAtISO);
                  dismiss(reminder.id);
                }
              }
            ]
          : [
              {
                label: t("reminders.notification.markDone"),
                variant: "primary" as const,
                onClick: async () => {
                  await apiFetch(`/reminders/${reminder.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "done" })
                  });
                  dismiss(reminder.id);
                }
              },
              {
                label: t("reminders.notification.dismiss"),
                variant: "outline" as const,
                onClick: async () => {
                  await apiFetch(`/reminders/${reminder.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ dismiss: true })
                  });
                  dismiss(reminder.id);
                }
              }
            ];

        notify({
          id: reminder.id,
          title: formatMessage("reminders.notification.dueTitle", { title: reminder.title }),
          body,
          tone,
          icon,
          actions
        });
      }

      saveShownKeys(shownRef.current);
    }

    check();
    const interval = setInterval(check, POLL_MS);
    return () => clearInterval(interval);
  }, [notify, dismiss, t, formatMessage]);

  return null;
}

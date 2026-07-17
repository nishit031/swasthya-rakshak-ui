import { Bell, FlaskConical, Hospital, Pill, Syringe, type LucideIcon } from "lucide-react";
import type { BadgeTone } from "@/frontend/components/ui/Badge";

/** Tones used to colour reminder type chips and card accents. */
export type IconTone = "primary" | "secondary" | "accent" | "success" | "warning";

export const TONE_CHIP: Record<IconTone, string> = {
  primary: "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300",
  secondary: "bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300",
  accent: "bg-accent-100 text-accent-600 dark:bg-accent-900/40 dark:text-accent-300",
  success: "bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-300",
  warning: "bg-warning-100 text-warning-600 dark:bg-warning-900/40 dark:text-warning-300"
};

export const TONE_BORDER: Record<IconTone, string> = {
  primary: "border-l-primary-400 dark:border-l-primary-500",
  secondary: "border-l-secondary-400 dark:border-l-secondary-500",
  accent: "border-l-accent-400 dark:border-l-accent-500",
  success: "border-l-success-400 dark:border-l-success-500",
  warning: "border-l-warning-400 dark:border-l-warning-500"
};

/** Icon + tone for each reminder type. Falls back to `other`. */
export const TYPE_CONFIG: Record<string, { icon: LucideIcon; tone: IconTone }> = {
  medication: { icon: Pill, tone: "success" },
  appointment: { icon: Hospital, tone: "primary" },
  test: { icon: FlaskConical, tone: "accent" },
  vaccination: { icon: Syringe, tone: "warning" },
  other: { icon: Bell, tone: "secondary" }
};

/** Config for a reminder type, defaulting to `other` for unknown types. */
export function typeConfig(reminderType: string) {
  return TYPE_CONFIG[reminderType] ?? TYPE_CONFIG.other;
}

/** Human-friendly relative label (Overdue / Today / Tomorrow / In N days / date) with a badge tone.
 *  `now` is injectable so the calendar-day math can be unit-tested deterministically. */
export function getRelative(
  scheduledAt: string,
  now: Date = new Date()
): { label: string; tone: BadgeTone } {
  const date = new Date(scheduledAt);
  const diffMs = date.getTime() - now.getTime();

  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const tomorrowEnd = new Date(todayEnd.getTime() + 24 * 60 * 60 * 1000);

  if (diffMs < 0) return { label: "Overdue", tone: "red" };
  if (date <= todayEnd) return { label: "Today", tone: "green" };
  if (date <= tomorrowEnd) return { label: "Tomorrow", tone: "blue" };

  // Count whole calendar days (midnight-to-midnight), not elapsed 24h spans — otherwise two
  // reminders on the same date but different times of day round into different "In N days" buckets.
  const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((midnight(date) - midnight(now)) / (1000 * 60 * 60 * 24));
  if (days < 7) return { label: `In ${days} days`, tone: "amber" };
  return {
    label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    tone: "gray"
  };
}

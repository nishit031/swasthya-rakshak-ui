"use client";

import { useId } from "react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { cn } from "./cn";
import { FieldWrap } from "./Field";
import { DatePicker } from "./DatePicker";

export interface DateTimePickerProps {
  /** "YYYY-MM-DDTHH:mm", or "" for empty — same contract as native `<input type="datetime-local">`. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  /** "YYYY-MM-DDTHH:mm" bounds; only the date portion is enforced (matches DatePicker's min/max). */
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  wrapClassName?: string;
  "aria-label"?: string;
}

function splitValue(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}

function todayISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Composes the custom `DatePicker` (date part) with a native `<input type="time">` (time part)
 * into a single "YYYY-MM-DDTHH:mm" value — the same contract as native
 * `<input type="datetime-local">`. The time part stays native: its popup is small and already
 * dark-mode-correct via `.field`'s `color-scheme`, so only the full-month calendar grid (the
 * actual placement complaint) needed a custom replacement.
 *
 * Note: unlike the native control, a `required` DateTimePicker only gets native browser
 * constraint-validation on its time half — the calendar's trigger is a button, which browsers
 * don't validate as a required form control. Callers that rely on `required` blocking submission
 * should also check the value explicitly before submitting (see `reminders/page.tsx`).
 */
export function DateTimePicker({
  value,
  onChange,
  label,
  id,
  min,
  max,
  required,
  disabled,
  className,
  wrapClassName,
  "aria-label": ariaLabel
}: DateTimePickerProps) {
  const { t } = useTranslation();
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const { date, time } = splitValue(value);
  const { date: minDate } = splitValue(min ?? "");
  const { date: maxDate } = splitValue(max ?? "");

  function setDate(newDate: string) {
    onChange(newDate ? `${newDate}T${time || "00:00"}` : "");
  }

  function setTime(newTime: string) {
    onChange(`${date || todayISODate()}T${newTime}`);
  }

  return (
    <FieldWrap label={label} htmlFor={inputId} className={wrapClassName}>
      <div className="flex gap-2">
        <DatePicker
          id={inputId}
          value={date}
          onChange={setDate}
          min={minDate || undefined}
          max={maxDate || undefined}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
          className={cn("flex-1", className)}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required={required}
          disabled={disabled}
          aria-label={t("datePicker.selectTime")}
          className="field w-32 flex-shrink-0"
        />
      </div>
    </FieldWrap>
  );
}

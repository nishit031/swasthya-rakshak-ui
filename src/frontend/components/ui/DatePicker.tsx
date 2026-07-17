"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { cn } from "./cn";
import { FieldWrap } from "./Field";
import { Button } from "./Button";
import { usePopoverPosition } from "./usePopoverPosition";
import {
  addMonths,
  buildMonthGrid,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  parseISODate,
  toISODate
} from "./date-grid";

export interface DatePickerProps {
  /** "YYYY-MM-DD", or "" for empty — same contract as native `<input type="date">`. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  placeholder?: string;
  /** "YYYY-MM-DD" bounds; out-of-range days render disabled. */
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  wrapClassName?: string;
  "aria-label"?: string;
}

const MIN_YEAR_SPAN = 120;

/**
 * Custom calendar date picker replacing native `<input type="date">`, whose popup placement and
 * styling the browser controls and we can't fix with CSS. Renders a trigger button styled to
 * match `.field`, and a portaled (to `document.body`) popover positioned from the trigger's
 * `getBoundingClientRect()` so it always sits correctly even inside a scrollable `Modal` — see
 * `usePopoverPosition`.
 */
export function DatePicker({
  value,
  onChange,
  label,
  id,
  placeholder,
  min,
  max,
  disabled,
  className,
  wrapClassName,
  "aria-label": ariaLabel
}: DatePickerProps) {
  const { t, language } = useTranslation();
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [open, setOpen] = useState(false);
  const [pickingYear, setPickingYear] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => parseISODate(value), [value]);
  const minDate = useMemo(() => (min ? parseISODate(min) : null), [min]);
  const maxDate = useMemo(() => (max ? parseISODate(max) : null), [max]);

  const [viewDate, setViewDate] = useState(() => selected ?? new Date());

  const close = useCallback(() => setOpen(false), []);
  const position = usePopoverPosition(triggerRef, open, close);

  // Re-sync the visible month to the selected date (or today) each time the popover opens.
  // Intentionally keyed on `open` alone — this should only run at the moment of opening, not
  // whenever `selected` changes while already open (that would fight the user's month navigation).
  useEffect(() => {
    if (open) {
      setViewDate(selected ?? new Date());
      setPickingYear(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      close();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  function isDisabledDay(day: Date): boolean {
    if (minDate && isBeforeDay(day, minDate)) return true;
    if (maxDate && isAfterDay(day, maxDate)) return true;
    return false;
  }

  function selectDay(day: Date) {
    if (isDisabledDay(day)) return;
    onChange(toISODate(day));
    close();
  }

  function goToday() {
    const now = new Date();
    if (isDisabledDay(now)) return;
    onChange(toISODate(now));
    close();
  }

  function clearValue() {
    onChange("");
    close();
  }

  const grid = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );
  const monthLabel = t(`datePicker.months.${viewDate.getMonth()}`);
  const weekdayLabels = useMemo(
    () => Array.from({ length: 7 }, (_, i) => t(`datePicker.weekdaysShort.${i}`)),
    [t]
  );

  const displayValue = selected
    ? selected.toLocaleDateString(language === "hi" ? "hi-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : null;

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () =>
      Array.from(
        { length: MIN_YEAR_SPAN + 1 },
        (_, i) => currentYear - MIN_YEAR_SPAN + i
      ).reverse(),
    [currentYear]
  );

  return (
    <FieldWrap label={label} htmlFor={inputId} className={wrapClassName}>
      <button
        ref={triggerRef}
        type="button"
        id={inputId}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "field flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60",
          className
        )}
      >
        <span
          className={
            displayValue ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
          }
        >
          {displayValue ?? placeholder ?? t("datePicker.selectDate")}
        </span>
        <CalendarDays size={16} className="flex-shrink-0 text-gray-400" />
      </button>

      {open &&
        position &&
        createPortal(
          <motion.div
            ref={popoverRef}
            role="dialog"
            aria-label={label ?? t("datePicker.selectDate")}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: position.top, left: position.left, zIndex: 110 }}
            className="w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t("datePicker.prevMonth")}
                onClick={() => setViewDate((d) => addMonths(d, -1))}
              >
                <ChevronLeft size={16} />
              </Button>
              <button
                type="button"
                onClick={() => setPickingYear((p) => !p)}
                className="rounded-md px-2 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
              >
                {monthLabel} {viewDate.getFullYear()}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t("datePicker.nextMonth")}
                onClick={() => setViewDate((d) => addMonths(d, 1))}
              >
                <ChevronRight size={16} />
              </Button>
            </div>

            {pickingYear ? (
              <div
                role="listbox"
                aria-label={t("datePicker.selectYear")}
                className="grid max-h-56 grid-cols-4 gap-1 overflow-y-auto"
              >
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setViewDate((d) => new Date(y, d.getMonth(), 1));
                      setPickingYear(false);
                    }}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-sm",
                      y === viewDate.getFullYear()
                        ? "bg-primary-600 text-white"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-gray-400 dark:text-gray-500">
                  {weekdayLabels.map((w, i) => (
                    <span key={i}>{w}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {grid.map((day, i) => {
                    const inMonth = day.getMonth() === viewDate.getMonth();
                    const isSelected = selected !== null && isSameDay(day, selected);
                    const isToday = isSameDay(day, new Date());
                    const disabledDay = isDisabledDay(day);
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={disabledDay}
                        onClick={() => selectDay(day)}
                        className={cn(
                          "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
                          !inMonth && "text-gray-300 dark:text-gray-600",
                          inMonth && !isSelected && "text-gray-700 dark:text-gray-200",
                          !isSelected && !disabledDay && "hover:bg-gray-100 dark:hover:bg-gray-800",
                          isToday && !isSelected && "ring-1 ring-inset ring-primary-400",
                          isSelected && "bg-primary-600 text-white",
                          disabledDay && "cursor-not-allowed opacity-30"
                        )}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
              <Button type="button" variant="ghost" size="sm" onClick={clearValue}>
                {t("datePicker.clear")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={goToday}>
                {t("datePicker.today")}
              </Button>
            </div>
          </motion.div>,
          document.body
        )}
    </FieldWrap>
  );
}

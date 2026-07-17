"use client";

// Advanced filtering for the Medical Records list (Phase 7A §1). No multi-select/combobox
// primitive exists in the app yet, so this builds one small checkbox-based popover, reusing the
// `usePopoverPosition` portal pattern (as DatePicker does) rather than adding a dependency.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, X, ChevronDown, Bookmark } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { Input, Select } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";
import { usePopoverPosition } from "@/frontend/components/ui/usePopoverPosition";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import {
  activeFilterCount,
  isEmptyFilters,
  type ConfidenceBucket,
  type MedicalRecordFilters,
  type ProcessedFilter
} from "@/backend/features/medical-records/filters";
import {
  MEDICAL_DOC_TYPES,
  type DocGroup
} from "@/backend/features/medical-records/document-types";
import { GROUP_UI } from "./doc-type-ui";

const GROUPS: DocGroup[] = [
  "clinical",
  "imaging",
  "medication",
  "procedure",
  "administrative",
  "other"
];

function toggleValue(list: string[] | undefined, value: string): string[] | undefined {
  const set = new Set(list ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return set.size ? Array.from(set) : undefined;
}

export function RecordFilterBar({
  filters,
  onChange,
  onReset,
  onSaveView,
  members
}: {
  filters: MedicalRecordFilters;
  onChange: (patch: Partial<MedicalRecordFilters>) => void;
  onReset: () => void;
  onSaveView?: (name: string) => Promise<void>;
  members: FamilyMember[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [savingView, setSavingView] = useState(false);
  const [viewName, setViewName] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const position = usePopoverPosition(triggerRef, open, close, { width: 320, heightEstimate: 480 });

  // Close on outside click / Escape.
  const handleDocPointer = useCallback((e: MouseEvent) => {
    const target = e.target as Node;
    if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
    setOpen(false);
  }, []);

  // Move keyboard focus into the panel on open, and back to the trigger on close, so keyboard
  // users aren't dropped at the bottom of the page (the panel is portaled to document.body).
  // Skips the initial mount so the trigger isn't auto-focused on first render.
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (open) panelRef.current?.focus();
    else triggerRef.current?.focus();
  }, [open]);

  const count = activeFilterCount(filters);
  const hasAny = !isEmptyFilters(filters);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <SlidersHorizontal size={15} />
          {t("medicalRecordsAi.filters")}
          {count > 0 && (
            <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-xs font-semibold text-white">
              {count}
            </span>
          )}
        </button>

        <Select
          aria-label={t("medicalRecordsAi.sortLabel")}
          value={filters.sortBy ?? "createdAt"}
          onChange={(e) => onChange({ sortBy: e.target.value as MedicalRecordFilters["sortBy"] })}
          wrapClassName="mb-0"
          className="w-auto"
        >
          <option value="createdAt">{t("medicalRecordsAi.sortNewest")}</option>
          <option value="visitDate">{t("medicalRecordsAi.sortVisitDate")}</option>
          <option value="updatedAt">{t("medicalRecordsAi.sortRecentlyUpdated")}</option>
        </Select>

        {hasAny && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={14} />
            {t("medicalRecordsAi.clearFilters")}
          </button>
        )}
      </div>

      <ActiveFilterChips filters={filters} onChange={onChange} members={members} />

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t("medicalRecordsAi.filters")}
            tabIndex={-1}
            style={{ position: "fixed", top: position.top, left: position.left }}
            className="z-50 flex max-h-[70vh] w-80 flex-col gap-4 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-lg outline-none dark:border-gray-700 dark:bg-gray-900"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <FilterSection title={t("medicalRecordsAi.filterCategory")}>
              <div className="flex flex-col gap-1.5">
                {GROUPS.map((g) => (
                  <CheckboxRow
                    key={g}
                    checked={!!filters.category?.includes(g)}
                    onChange={() => onChange({ category: toggleValue(filters.category, g) })}
                    label={t(`medicalRecordsAi.docGroup.${g}`)}
                    tone={GROUP_UI[g].tone}
                  />
                ))}
              </div>
            </FilterSection>

            <DocTypeSection filters={filters} onChange={onChange} />

            <FilterSection title={t("medicalRecordsAi.filterPhysician")}>
              <Input
                value={filters.physician ?? ""}
                onChange={(e) => onChange({ physician: e.target.value || undefined })}
                placeholder={t("medicalRecordsAi.filterPhysicianPlaceholder")}
                wrapClassName="mb-0"
              />
            </FilterSection>

            <FilterSection title={t("medicalRecordsAi.filterFacility")}>
              <Input
                value={filters.facility ?? ""}
                onChange={(e) => onChange({ facility: e.target.value || undefined })}
                placeholder={t("medicalRecordsAi.filterFacilityPlaceholder")}
                wrapClassName="mb-0"
              />
            </FilterSection>

            <FilterSection title={t("medicalRecordsAi.filterDateRange")}>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  value={filters.dateFrom ?? ""}
                  onChange={(v) => onChange({ dateFrom: v || undefined })}
                  placeholder={t("medicalRecordsAi.filterFrom")}
                  wrapClassName="mb-0"
                />
                <DatePicker
                  value={filters.dateTo ?? ""}
                  onChange={(v) => onChange({ dateTo: v || undefined })}
                  placeholder={t("medicalRecordsAi.filterTo")}
                  wrapClassName="mb-0"
                />
              </div>
            </FilterSection>

            <FilterSection title={t("medicalRecordsAi.filterConfidence")}>
              <Select
                value={filters.confidence ?? ""}
                onChange={(e) =>
                  onChange({ confidence: (e.target.value || undefined) as ConfidenceBucket })
                }
                wrapClassName="mb-0"
              >
                <option value="">{t("medicalRecordsAi.filterAny")}</option>
                <option value="high">{t("labReportsAi.confHigh")}</option>
                <option value="review">{t("labReportsAi.confReview")}</option>
                <option value="low">{t("labReportsAi.confLow")}</option>
              </Select>
            </FilterSection>

            <FilterSection title={t("medicalRecordsAi.filterProcessed")}>
              <Select
                value={filters.processed ?? ""}
                onChange={(e) =>
                  onChange({ processed: (e.target.value || undefined) as ProcessedFilter })
                }
                wrapClassName="mb-0"
              >
                <option value="">{t("medicalRecordsAi.filterAny")}</option>
                <option value="processed">{t("medicalRecordsAi.filterProcessedYes")}</option>
                <option value="unprocessed">{t("medicalRecordsAi.filterProcessedNo")}</option>
              </Select>
            </FilterSection>

            {members.length > 0 && (
              <FilterSection title={t("medicalRecordsAi.filterFamilyMember")}>
                <Select
                  value={filters.familyMemberId ?? ""}
                  onChange={(e) => onChange({ familyMemberId: e.target.value || undefined })}
                  wrapClassName="mb-0"
                >
                  <option value="">{t("medicalRecordsAi.filterAny")}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              </FilterSection>
            )}

            {onSaveView && hasAny && (
              <FilterSection title={t("medicalRecordsAi.saveViewLabel")}>
                <div className="flex gap-2">
                  <Input
                    value={viewName}
                    onChange={(e) => setViewName(e.target.value)}
                    placeholder={t("medicalRecordsAi.saveViewPlaceholder")}
                    wrapClassName="mb-0 flex-1"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!viewName.trim() || savingView}
                    onClick={async () => {
                      setSavingView(true);
                      await onSaveView(viewName.trim());
                      setSavingView(false);
                      setViewName("");
                    }}
                  >
                    <Bookmark size={14} />
                    {t("common.save")}
                  </Button>
                </div>
              </FilterSection>
            )}

            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              {t("common.close")}
            </Button>
          </div>,
          document.body
        )}

      {open && (
        // Invisible full-viewport layer to catch outside clicks (cheaper than a window listener
        // that has to distinguish trigger/panel clicks itself).
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => handleDocPointer(e.nativeEvent)}
          aria-hidden
        />
      )}
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {title}
      </span>
      {children}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  tone
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  tone?: "blue" | "green" | "amber" | "red" | "gray";
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-gray-600"
      />
      {tone ? <Badge tone={tone}>{label}</Badge> : <span>{label}</span>}
    </label>
  );
}

// Document-type checkboxes, grouped under a <details> per category so 20 types stay scannable.
function DocTypeSection({
  filters,
  onChange
}: {
  filters: MedicalRecordFilters;
  onChange: (patch: Partial<MedicalRecordFilters>) => void;
}) {
  const { t } = useTranslation();
  return (
    <FilterSection title={t("medicalRecordsAi.filterDocumentType")}>
      <div className="flex flex-col gap-1">
        {GROUPS.map((g) => {
          const types = MEDICAL_DOC_TYPES.filter((d) => d.group === g);
          return (
            <details key={g} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                <ChevronDown
                  size={13}
                  className="shrink-0 transition-transform group-open:rotate-180"
                />
                {t(`medicalRecordsAi.docGroup.${g}`)}
              </summary>
              <div className="flex flex-col gap-1 py-1 pl-6">
                {types.map((d) => (
                  <CheckboxRow
                    key={d.key}
                    checked={!!filters.documentType?.includes(d.key)}
                    onChange={() =>
                      onChange({ documentType: toggleValue(filters.documentType, d.key) })
                    }
                    label={t(`medicalRecordTypes.${d.key}`)}
                  />
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </FilterSection>
  );
}

// Renders each active facet as a removable chip so the user sees (and can undo) filters at a glance.
function ActiveFilterChips({
  filters,
  onChange,
  members
}: {
  filters: MedicalRecordFilters;
  onChange: (patch: Partial<MedicalRecordFilters>) => void;
  members: FamilyMember[];
}) {
  const { t } = useTranslation();
  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  for (const g of filters.category ?? []) {
    chips.push({
      key: `category-${g}`,
      label: t(`medicalRecordsAi.docGroup.${g}`),
      onRemove: () => onChange({ category: toggleValue(filters.category, g) })
    });
  }
  for (const dt of filters.documentType ?? []) {
    chips.push({
      key: `doctype-${dt}`,
      label: t(`medicalRecordTypes.${dt}`),
      onRemove: () => onChange({ documentType: toggleValue(filters.documentType, dt) })
    });
  }
  if (filters.physician) {
    chips.push({
      key: "physician",
      label: `${t("medicalRecordsAi.filterPhysician")}: ${filters.physician}`,
      onRemove: () => onChange({ physician: undefined })
    });
  }
  if (filters.facility) {
    chips.push({
      key: "facility",
      label: `${t("medicalRecordsAi.filterFacility")}: ${filters.facility}`,
      onRemove: () => onChange({ facility: undefined })
    });
  }
  if (filters.dateFrom || filters.dateTo) {
    chips.push({
      key: "dateRange",
      label: `${filters.dateFrom ?? "…"} → ${filters.dateTo ?? "…"}`,
      onRemove: () => onChange({ dateFrom: undefined, dateTo: undefined })
    });
  }
  if (filters.confidence) {
    chips.push({
      key: "confidence",
      label: t(
        `labReportsAi.conf${filters.confidence[0].toUpperCase()}${filters.confidence.slice(1)}`
      ),
      onRemove: () => onChange({ confidence: undefined })
    });
  }
  if (filters.processed) {
    chips.push({
      key: "processed",
      label: t(
        filters.processed === "processed"
          ? "medicalRecordsAi.filterProcessedYes"
          : "medicalRecordsAi.filterProcessedNo"
      ),
      onRemove: () => onChange({ processed: undefined })
    });
  }
  if (filters.familyMemberId) {
    const member = members.find((m) => m.id === filters.familyMemberId);
    chips.push({
      key: "familyMember",
      label: member?.name ?? filters.familyMemberId,
      onRemove: () => onChange({ familyMemberId: undefined })
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.onRemove}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {c.label}
          <X size={12} />
        </button>
      ))}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  AlertTriangle,
  FileText,
  RefreshCw,
  Pill,
  SearchX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Button } from "@/frontend/components/ui/Button";
import { Badge, type BadgeTone } from "@/frontend/components/ui/Badge";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import type {
  MedicationItem,
  MedicationStatus
} from "@/backend/features/medical-records/medication/medication.schema";

const STATUS_TONE: Record<MedicationStatus, BadgeTone> = {
  current: "green",
  completed: "blue",
  discontinued: "red",
  prn: "amber",
  unknown: "gray"
};

type SortKey = "name" | "strength" | "dose" | "frequency" | "duration" | "status";

function sortValue(m: MedicationItem, key: SortKey): string {
  switch (key) {
    case "name":
      return (m.name ?? "").toLowerCase();
    case "strength":
      return (m.strength ?? "").toLowerCase();
    case "dose":
      return (m.dosage.normalized ?? m.dosage.original ?? "").toLowerCase();
    case "frequency":
      return (m.frequency.normalized ?? m.frequency.original ?? "").toLowerCase();
    case "duration":
      return (m.duration ?? "").toLowerCase();
    case "status":
      return m.status;
  }
}

// A row is worth flagging "Review suggested" when its extraction confidence is low.
const LOW_CONFIDENCE = 60;

export function MedicationsView({
  record,
  busy,
  onRegenerate,
  onDownloadPdf
}: {
  record: MedicalRecord;
  busy?: boolean;
  onRegenerate: () => void;
  onDownloadPdf: () => void;
}) {
  const { t } = useTranslation();
  const extraction = record.extractedDataJson;
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const meds = useMemo(() => {
    if (!extraction || extraction.kind !== "medication") return [];
    if (!sort) return extraction.medications;
    const copy = [...extraction.medications];
    copy.sort((a, b) => sortValue(a, sort.key).localeCompare(sortValue(b, sort.key)) * sort.dir);
    return copy;
  }, [extraction, sort]);

  if (!extraction || extraction.kind !== "medication") return null;

  if (meds.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("medicalRecordsAi.emptyMedsTitle")}
        description={t("medicalRecordsAi.emptyMedsDesc")}
        action={
          <Button onClick={onRegenerate} disabled={busy}>
            <RefreshCw size={16} />
            {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
          </Button>
        }
      />
    );
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: "name", label: t("medicalRecordsAi.colMedication") },
    { key: "strength", label: t("medicalRecordsAi.colStrength") },
    { key: "dose", label: t("medicalRecordsAi.colDose") },
    { key: "frequency", label: t("medicalRecordsAi.colFrequency") },
    { key: "duration", label: t("medicalRecordsAi.colDuration") },
    { key: "status", label: t("medicalRecordsAi.colStatus") }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header: count + overall quality */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Pill size={16} className="text-primary-500" />
          {meds.length} {t("medicalRecordsAi.medicationsCount")}
        </p>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t("medicalRecordsAi.extractionQuality")}
          </span>
          <ConfidenceBadge score={extraction.confidence} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="w-8 px-2 py-2.5" aria-hidden />
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 transition-colors hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {col.label}
                    <ChevronsUpDown
                      size={12}
                      className={
                        sort?.key === col.key
                          ? "text-primary-500"
                          : "text-gray-300 dark:text-gray-600"
                      }
                    />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meds.map((m, idx) => {
              const low = m.confidence < LOW_CONFIDENCE;
              const open = openRow === idx;
              return (
                <MedRow
                  key={idx}
                  m={m}
                  idx={idx}
                  open={open}
                  low={low}
                  onToggle={() => setOpenRow(open ? null : idx)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
        <button
          type="button"
          onClick={onDownloadPdf}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <FileText size={16} />
          {t("medicalRecordsAi.toolbarDownloadPdf")}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} />
          {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
        </button>
      </div>

      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {t("medicalRecordsAi.disclaimer")}
      </p>
    </div>
  );
}

function MedRow({
  m,
  idx,
  open,
  low,
  onToggle
}: {
  m: MedicationItem;
  idx: number;
  open: boolean;
  low: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const rowTint = idx % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-800/20" : "";

  const details: { label: string; value: string | null }[] = [
    { label: t("medicalRecordsAi.medRoute"), value: m.route },
    { label: t("medicalRecordsAi.medQuantity"), value: m.quantity },
    { label: t("medicalRecordsAi.medRefills"), value: m.refills },
    {
      label: t("medicalRecordsAi.medDates"),
      value: m.startDate || m.endDate ? `${m.startDate ?? "—"} → ${m.endDate ?? "—"}` : null
    },
    {
      label: t("medicalRecordsAi.medPrn"),
      value:
        m.prn == null ? null : m.prn ? t("medicalRecordsAi.prnYes") : t("medicalRecordsAi.prnNo")
    },
    { label: t("medicalRecordsAi.medInstructions"), value: m.instructions },
    { label: t("medicalRecordsAi.medPrescriber"), value: m.prescriber }
  ].filter((d) => d.value);

  return (
    <>
      <tr
        className={`cursor-pointer border-b border-gray-100 align-top transition-colors hover:bg-primary-50/40 dark:border-gray-800/60 dark:hover:bg-primary-900/10 ${rowTint}`}
        onClick={onToggle}
      >
        <td className="px-2 py-2.5 text-gray-400">
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            <ChevronDown size={15} />
          </motion.span>
        </td>
        <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
          <span className="flex items-center gap-1.5">
            {m.name ?? "—"}
            {low && (
              <span
                title={t("medicalRecordsAi.reviewSuggested")}
                aria-label={t("medicalRecordsAi.reviewSuggested")}
                className="inline-flex text-warning-500"
              >
                <AlertTriangle size={13} />
              </span>
            )}
          </span>
          {(m.genericName || m.brandName) && (
            <span className="mt-0.5 block text-xs font-normal text-gray-400 dark:text-gray-500">
              {[m.brandName, m.genericName].filter(Boolean).join(" · ")}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
          {m.strength ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{m.dosage.original ?? "—"}</td>
        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
          {m.frequency.original ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{m.duration ?? "—"}</td>
        <td className="px-3 py-2.5">
          <Badge tone={STATUS_TONE[m.status]}>{t(`medicationStatus.${m.status}`)}</Badge>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && (
          <tr>
            <td colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 bg-gray-50/70 px-11 py-3 dark:bg-gray-800/30">
                  {details.length === 0 && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {t("medicalRecordsAi.medNoDetail")}
                    </p>
                  )}
                  {details.map((d) => (
                    <div key={d.label} className="flex gap-2 text-sm">
                      <span className="w-28 shrink-0 text-gray-500 dark:text-gray-400">
                        {d.label}
                      </span>
                      <span className="text-gray-800 dark:text-gray-200">{d.value}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <span className="w-28 shrink-0 text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                      {t("medicalRecordsAi.extractionQuality")}
                    </span>
                    <ConfidenceBadge score={m.confidence} />
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

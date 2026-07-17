"use client";

import { useState } from "react";
import { ChevronDown, AlertTriangle, FileText, RefreshCw, Syringe, SearchX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Button } from "@/frontend/components/ui/Button";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import type { VaccineItem } from "@/backend/features/medical-records/immunization/immunization.schema";

// A row is worth flagging "Review suggested" when its extraction confidence is low.
const LOW_CONFIDENCE = 60;

export function ImmunizationView({
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
  const [openRow, setOpenRow] = useState<number | null>(null);

  if (!extraction || extraction.kind !== "immunization") return null;
  const vaccines = extraction.vaccines;

  if (vaccines.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("medicalRecordsAi.emptyVaccinesTitle")}
        description={t("medicalRecordsAi.emptyVaccinesDesc")}
        action={
          <Button onClick={onRegenerate} disabled={busy}>
            <RefreshCw size={16} />
            {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
          </Button>
        }
      />
    );
  }

  const columns = [
    t("medicalRecordsAi.colVaccine"),
    t("medicalRecordsAi.colDoseNumber"),
    t("medicalRecordsAi.colDate"),
    t("medicalRecordsAi.colProvider"),
    t("medicalRecordsAi.colNextDue")
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header: count + overall quality */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Syringe size={16} className="text-primary-500" />
          {vaccines.length} {t("medicalRecordsAi.vaccinesCount")}
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
              {columns.map((label) => (
                <th key={label} className="px-3 py-2.5 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vaccines.map((v, idx) => {
              const open = openRow === idx;
              return (
                <VaccineRow
                  key={idx}
                  v={v}
                  low={v.confidence < LOW_CONFIDENCE}
                  open={open}
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

function VaccineRow({
  v,
  low,
  open,
  onToggle
}: {
  v: VaccineItem;
  low: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  const details: { label: string; value: string | null }[] = [
    { label: t("medicalRecordsAi.vacManufacturer"), value: v.manufacturer },
    { label: t("medicalRecordsAi.vacLotNumber"), value: v.lotNumber },
    { label: t("medicalRecordsAi.vacRoute"), value: v.route },
    { label: t("medicalRecordsAi.vacSite"), value: v.site }
  ].filter((d) => d.value);

  return (
    <>
      <tr
        className="cursor-pointer border-b border-gray-100 align-top transition-colors hover:bg-primary-50/40 dark:border-gray-800/60 dark:hover:bg-primary-900/10"
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
            {v.name ?? "—"}
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
        </td>
        <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
          {v.doseNumber ?? "—"}
        </td>
        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{v.date ?? "—"}</td>
        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{v.provider ?? "—"}</td>
        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{v.nextDueDate ?? "—"}</td>
      </tr>
      <AnimatePresence initial={false}>
        {open && (
          <tr>
            <td colSpan={6} className="p-0">
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
                      {t("medicalRecordsAi.vacNoDetail")}
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
                    <ConfidenceBadge score={v.confidence} />
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

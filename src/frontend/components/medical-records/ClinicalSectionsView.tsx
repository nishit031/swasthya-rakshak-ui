"use client";

import { FileText, RefreshCw, SearchX } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Button } from "@/frontend/components/ui/Button";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import { getClinicalConfig } from "@/backend/features/medical-records/clinical/clinical.registry";

// Base renderer for extracted clinical sections. Renders only sections that hold real data,
// in the document type's configured order; text as a paragraph, list sections as bullets.
export function ClinicalSectionsView({
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
  const config = getClinicalConfig(record.documentType);
  const extraction = record.extractedDataJson;

  if (!config || !extraction || extraction.kind !== "clinical") return null;

  const filled = config.sections.filter((def) => {
    const v = extraction.sections[def.key];
    return v != null && (!Array.isArray(v) || v.length > 0);
  });

  if (filled.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("medicalRecordsAi.emptySectionsTitle")}
        description={t("medicalRecordsAi.emptySectionsDesc")}
        action={
          <Button onClick={onRegenerate} disabled={busy}>
            <RefreshCw size={16} />
            {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t("medicalRecordsAi.extractionQuality")}
          </span>
          <ConfidenceBadge score={extraction.confidence} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filled.map((def) => {
          const value = extraction.sections[def.key];
          return (
            <div
              key={def.key}
              className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30"
            >
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                {t(`medicalRecordSections.${def.key}`)}
              </p>
              {Array.isArray(value) ? (
                <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-200">
                  {value.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{value}</p>
              )}
            </div>
          );
        })}
      </div>

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
    </div>
  );
}

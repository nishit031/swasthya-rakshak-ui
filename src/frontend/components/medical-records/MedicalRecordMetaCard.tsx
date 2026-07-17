"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import type { MedicalRecordClassification } from "@/backend/features/ai/ai.types";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";

// Compact "what the AI found" panel shown after classification in the Add-record modal.
export function MedicalRecordMetaCard({ meta }: { meta: MedicalRecordClassification }) {
  const { t } = useTranslation();
  const partial = meta.lowConfidenceFields.length > 0;
  const typeLabel = meta.documentType
    ? t(`medicalRecordTypes.${meta.documentType}`)
    : t("medicalRecordsAi.typeUnrecognized");

  const rows: { key: string; label: string; value: string | null }[] = [
    { key: "documentType", label: t("medicalRecordsAi.fieldDocumentType"), value: typeLabel },
    { key: "title", label: t("medicalRecordsAi.fieldTitle"), value: meta.title },
    { key: "facility", label: t("medicalRecordsAi.fieldFacility"), value: meta.facility },
    { key: "physician", label: t("medicalRecordsAi.fieldPhysician"), value: meta.physician },
    { key: "recordDate", label: t("medicalRecordsAi.fieldRecordDate"), value: meta.recordDate }
  ];

  return (
    <div className="rounded-xl border border-secondary-200 bg-secondary-50/60 p-4 dark:border-secondary-900/50 dark:bg-secondary-900/20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
          {t("medicalRecordsAi.metaTitle")}
        </p>
        <ConfidenceBadge score={meta.confidence} />
      </div>

      <p
        className={`mb-3 flex items-center gap-1.5 text-sm font-medium ${
          partial
            ? "text-warning-700 dark:text-warning-300"
            : "text-success-700 dark:text-success-300"
        }`}
      >
        {partial ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
        {partial ? t("medicalRecordsAi.parsedPartial") : t("medicalRecordsAi.parsedOk")}
      </p>

      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => {
          const low = meta.lowConfidenceFields.includes(r.key);
          return (
            <li key={r.key} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{r.label}</span>
              <span className="flex min-w-0 items-center gap-1.5 text-right font-medium text-gray-900 dark:text-white">
                {low && (
                  <AlertTriangle
                    size={13}
                    className="shrink-0 text-warning-500"
                    aria-label={t("medicalRecordsAi.verify")}
                  />
                )}
                <span className="truncate">{r.value ?? "—"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

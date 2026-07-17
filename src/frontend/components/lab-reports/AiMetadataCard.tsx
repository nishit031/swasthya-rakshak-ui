"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import type { MetadataResult } from "@/backend/features/ai/ai.types";
import { ConfidenceBadge } from "./ConfidenceBadge";

// Compact "what the AI found" panel shown after analysis in the Add-report modal.
export function AiMetadataCard({ meta }: { meta: MetadataResult }) {
  const { t } = useTranslation();
  const partial = meta.lowConfidenceFields.length > 0;

  const rows: { key: string; label: string; value: string | null }[] = [
    { key: "testName", label: t("labReportsAi.fieldTestName"), value: meta.testName },
    { key: "labName", label: t("labReportsAi.fieldLabName"), value: meta.labName },
    { key: "reportDate", label: t("labReportsAi.fieldReportDate"), value: meta.reportDate }
  ];

  return (
    <div className="rounded-xl border border-secondary-200 bg-secondary-50/60 p-4 dark:border-secondary-900/50 dark:bg-secondary-900/20">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:text-secondary-300">
          {t("labReportsAi.metaTitle")}
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
        {partial ? t("labReportsAi.parsedPartial") : t("labReportsAi.parsedOk")}
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
                    aria-label={t("labReportsAi.verify")}
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

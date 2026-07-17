"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Badge } from "@/frontend/components/ui/Badge";
import type { LabReport, ExtractedData } from "@/backend/features/lab-reports/lab-reports.types";
import { parseSummary } from "@/backend/features/lab-reports/parse-summary";
import { parseNumber, parseRange, classify } from "@/backend/features/lab-reports/lab-values";
import { sanitizeTests } from "@/backend/features/lab-reports/extracted-values";

/** Compact AI summary for the document viewer side panel. */
export function SummaryViewerPanel({ lab, summaryText }: { lab: LabReport; summaryText: string }) {
  const { t } = useTranslation();
  const s = parseSummary(summaryText);

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">
          {lab.testName ?? t("labReportsAi.summaryTitle")}
        </p>
        {(lab.labName || lab.reportDate) && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {[lab.labName, lab.reportDate && new Date(lab.reportDate).toLocaleDateString("en-IN")]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </div>

      {s.overallSummary && (
        <div
          className={`rounded-lg border p-3 ${
            s.hasAbnormal
              ? "border-warning-200 bg-warning-50/60 dark:border-warning-900/50 dark:bg-warning-900/15"
              : "border-success-200 bg-success-50/60 dark:border-success-900/50 dark:bg-success-900/15"
          }`}
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            {t("labReportsAi.secOverall")}
          </p>
          <p className="leading-relaxed text-gray-800 dark:text-gray-100">{s.overallSummary}</p>
        </div>
      )}

      {s.abnormalResults.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("labReportsAi.secAbnormal")}
          </p>
          <ul className="flex flex-col gap-1.5">
            {s.abnormalResults.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-warning-800 dark:text-warning-200"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.keyFindings.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("labReportsAi.secKeyFindings")}
          </p>
          <ul className="flex flex-col gap-1">
            {s.keyFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-gray-700 dark:text-gray-300">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-primary-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {s.followUp && (
        <div className="rounded-lg border border-primary-200 bg-primary-50/60 p-3 dark:border-primary-900/50 dark:bg-primary-900/15">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
            {t("labReportsAi.secFollowUp")}
          </p>
          <p className="leading-relaxed text-gray-700 dark:text-gray-200">{s.followUp}</p>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">{t("labReportsAi.disclaimer")}</p>
    </div>
  );
}

/** Compact extracted values list for the document viewer side panel. */
export function ValuesViewerPanel({ extracted }: { extracted: ExtractedData }) {
  const { t } = useTranslation();
  const tests = sanitizeTests(extracted.tests ?? []);

  if (tests.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t("labReportsAi.emptyExtractedDesc")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {tests.map((test, i) => {
        const value = parseNumber(test.value);
        const range = parseRange(test.referenceRange);
        const status = classify(value, range, test.flag);
        const statusLabel =
          status === "normal"
            ? t("labResult.normal")
            : status === "high"
              ? t("labResult.high")
              : status === "low"
                ? t("labResult.low")
                : t("labResult.unknown");
        const tone = status === "normal" ? "green" : status === "unknown" ? "gray" : "amber";

        return (
          <li
            key={i}
            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                {test.name ?? t("labResult.unknown")}
              </p>
              <p className="text-xs tabular-nums text-gray-600 dark:text-gray-300">
                {test.value ?? "—"}
                {test.unit ? ` ${test.unit}` : ""}
              </p>
            </div>
            <Badge tone={tone} className="shrink-0">
              {statusLabel}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}

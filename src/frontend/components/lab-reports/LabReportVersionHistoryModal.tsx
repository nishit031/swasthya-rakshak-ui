"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, History, Loader2 } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Modal } from "@/frontend/components/ui/Modal";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { ConfidenceBadge } from "./ConfidenceBadge";
import type {
  LabReport,
  LabReportVersionSummary,
  LabReportVersionDetail
} from "@/backend/features/lab-reports/lab-reports.types";

function formatVersionDate(d: Date | string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

/**
 * Read-only history of past `POST /ai/extract` runs for a lab report (Layer-3
 * `extraction_versions`, `GET /lab-reports/:id/versions`). Each entry expands in place to show
 * that version's extracted values — no restore/rollback, since no such endpoint exists.
 */
export function LabReportVersionHistoryModal({
  lab,
  onClose
}: {
  lab: LabReport | null;
  onClose: () => void;
}) {
  const { t, formatMessage } = useTranslation();
  const [versions, setVersions] = useState<LabReportVersionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, LabReportVersionDetail>>({});
  const [detailLoading, setDetailLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!lab) return;
    setLoading(true);
    setError(null);
    setVersions([]);
    setExpanded(null);
    setDetails({});
    apiFetch<LabReportVersionSummary[]>(`/lab-reports/${lab.id}/versions`).then((res) => {
      setLoading(false);
      if (!res.success || !res.data) {
        setError(res.message || t("common.error"));
        return;
      }
      setVersions(res.data);
    });
  }, [lab, t]);

  async function toggleVersion(versionNumber: number) {
    if (expanded === versionNumber) {
      setExpanded(null);
      return;
    }
    setExpanded(versionNumber);
    if (!lab || details[versionNumber]) return;
    setDetailLoading(versionNumber);
    const res = await apiFetch<LabReportVersionDetail>(
      `/lab-reports/${lab.id}/versions/${versionNumber}`
    );
    setDetailLoading(null);
    if (res.success && res.data) {
      setDetails((prev) => ({ ...prev, [versionNumber]: res.data! }));
    }
  }

  const highestVersion = versions.length > 0 ? versions[0].versionNumber : null;

  return (
    <Modal
      open={lab !== null}
      onClose={onClose}
      title={t("labReportsAi.historyTitle")}
      size="max-w-xl"
    >
      <div className="flex flex-col gap-3">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 size={14} className="animate-spin" />
            {t("common.loading")}
          </p>
        )}

        {!loading && error && (
          <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
            {error}
          </p>
        )}

        {!loading && !error && versions.length === 0 && (
          <EmptyState
            icon={History}
            title={t("labReportsAi.historyEmpty")}
            description={t("labReportsAi.historyEmptyDesc")}
          />
        )}

        {!loading && !error && versions.length > 0 && (
          <div className="flex flex-col gap-2">
            {versions.map((v) => {
              const isOpen = expanded === v.versionNumber;
              const detail = details[v.versionNumber];
              const tests = detail?.extractedDataJson?.tests ?? [];
              return (
                <div key={v.id} className="rounded-xl border border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => toggleVersion(v.versionNumber)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatMessage("labReportsAi.historyVersion", { n: v.versionNumber })}
                      </span>
                      {v.versionNumber === highestVersion && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                          {t("labReportsAi.historyCurrent")}
                        </span>
                      )}
                      {v.confidence != null && (
                        <ConfidenceBadge score={v.confidence} showLabel={false} />
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatVersionDate(v.createdAt)}
                      </span>
                    </div>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} className="text-gray-400" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                          {detailLoading === v.versionNumber && (
                            <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Loader2 size={14} className="animate-spin" />
                              {t("common.loading")}
                            </p>
                          )}
                          {detail && tests.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t("labReportsAi.historyNoTests")}
                            </p>
                          )}
                          {detail && tests.length > 0 && (
                            <ul className="flex flex-col gap-1.5 text-sm">
                              {tests.map((test, i) => (
                                <li
                                  key={i}
                                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-gray-100 pb-1.5 last:border-0 last:pb-0 dark:border-gray-800/60"
                                >
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {test.name ?? t("labResult.unknown")}
                                  </span>
                                  <span className="tabular-nums text-gray-600 dark:text-gray-300">
                                    {test.value ?? "—"}
                                    {test.unit ? ` ${test.unit}` : ""}
                                    {test.referenceRange ? ` (${test.referenceRange})` : ""}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

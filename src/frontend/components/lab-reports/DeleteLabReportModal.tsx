"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/frontend/components/ui/Modal";
import { Button } from "@/frontend/components/ui/Button";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import type { LabReport } from "@/backend/features/lab-reports/lab-reports.types";

interface DeleteLabReportModalProps {
  lab: LabReport | null; // null = closed, unless bulkCount is set
  // When set, the modal is in bulk-delete mode for this many selected reports (lab is ignored).
  bulkCount?: number;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

/**
 * Styled confirmation dialog for deleting a lab report (or a bulk-selected batch of them).
 * Replaces the bare window.confirm() call with a branded, accessible modal.
 * Shows the report name and a clear warning that the action is permanent.
 */
export function DeleteLabReportModal({
  lab,
  bulkCount,
  onClose,
  onConfirm,
  loading
}: DeleteLabReportModalProps) {
  const { t, formatMessage } = useTranslation();
  const isBulk = !!bulkCount;

  return (
    <Modal
      open={isBulk || lab !== null}
      onClose={onClose}
      title={t("deleteLabReport.title")}
      size="max-w-sm"
    >
      <div className="flex flex-col gap-4">
        {/* Warning icon + message */}
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error-100 text-error-600 dark:bg-error-900/40 dark:text-error-400">
            <AlertTriangle size={20} />
          </span>
          <div>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
              {isBulk
                ? formatMessage("labReportsAi.bulkDeleteConfirm", { count: bulkCount })
                : t("deleteLabReport.body")}
            </p>
            {!isBulk && lab?.testName && (
              <p className="mt-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                {lab.testName}
              </p>
            )}
            {!isBulk && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t("deleteLabReport.warning")}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button variant="danger" onClick={onConfirm} disabled={loading} className="flex-1">
            {loading ? t("common.loading") : t("deleteLabReport.confirm")}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

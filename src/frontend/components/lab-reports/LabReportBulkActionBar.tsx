"use client";

// Bulk operations toolbar for lab reports: summarize all, extract all, delete selected.
// Mirrors medical-records/BulkActionBar.tsx.

import { Trash2, Sparkles, FileJson, X } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Button } from "@/frontend/components/ui/Button";

export function LabReportBulkActionBar({
  count,
  onClear,
  onDelete,
  onSummarize,
  onExtract,
  busy,
  busyLabel
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onSummarize: () => void;
  onExtract: () => void;
  busy?: boolean;
  busyLabel?: string;
}) {
  const { t, formatMessage } = useTranslation();

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/30">
      <span className="text-sm font-semibold text-primary-800 dark:text-primary-200">
        {formatMessage("labReportsAi.selectedCount", { count })}
      </span>

      {busy ? (
        <span className="text-sm text-primary-700 dark:text-primary-300">{busyLabel}</span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onClick={onSummarize}>
            <Sparkles size={14} />
            {t("labReportsAi.bulkSummarize")}
          </Button>
          <Button size="sm" variant="secondary" onClick={onExtract}>
            <FileJson size={14} />
            {t("labReportsAi.bulkExtract")}
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 size={14} />
            {t("common.delete")}
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={onClear}
        aria-label={t("common.cancel")}
        className="ml-auto rounded-md p-1.5 text-primary-600 hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-primary-300 dark:hover:bg-primary-900/50"
      >
        <X size={16} />
      </button>
    </div>
  );
}

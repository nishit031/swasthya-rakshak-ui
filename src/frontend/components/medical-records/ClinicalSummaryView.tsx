"use client";

import { fileUrl } from "@/backend/lib/api-url";
import Markdown from "markdown-to-jsx";
import { ExternalLink, FileText, RefreshCw } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";

// Renders the AI clinical summary (markdown) plus a disclaimer and an action bar. Kept simple —
// the summary prompt emits short "## " sections which markdown-to-jsx renders directly, so no
// custom parser is needed (unlike the lab summary's fixed-section view).
export function ClinicalSummaryView({
  record,
  summaryText,
  busy,
  onRegenerate,
  onDownloadPdf
}: {
  record: MedicalRecord;
  summaryText: string;
  busy?: boolean;
  onRegenerate: () => void;
  onDownloadPdf: () => void;
}) {
  const { t } = useTranslation();
  const generatedAt = record.extractedDataJson?.generatedAt;

  return (
    <div className="flex flex-col gap-4">
      {generatedAt && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("medicalRecordsAi.generatedAt")}{" "}
          {new Date(generatedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })}
        </p>
      )}

      <div className="prose-clinical flex flex-col gap-2 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
        <Markdown
          options={{
            overrides: {
              h2: {
                props: {
                  className:
                    "mt-3 text-sm font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300"
                }
              },
              h3: {
                props: { className: "mt-2 text-sm font-semibold text-gray-900 dark:text-white" }
              },
              ul: { props: { className: "ml-4 list-disc space-y-1" } },
              p: { props: { className: "text-gray-700 dark:text-gray-200" } }
            }
          }}
        >
          {summaryText}
        </Markdown>
      </div>

      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {t("medicalRecordsAi.disclaimer")}
      </p>

      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
        <ActionButton
          icon={ExternalLink}
          label={t("medicalRecordsAi.actViewOriginal")}
          href={fileUrl(record.fileUrl)}
        />
        <ActionButton
          icon={FileText}
          label={t("medicalRecordsAi.toolbarDownloadPdf")}
          onClick={onDownloadPdf}
        />
        <ActionButton
          icon={RefreshCw}
          label={busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
          onClick={onRegenerate}
          disabled={busy}
        />
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  href,
  onClick,
  disabled
}: {
  icon: typeof ExternalLink;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        <Icon size={16} />
        {label}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <Icon size={16} />
      {label}
    </button>
  );
}

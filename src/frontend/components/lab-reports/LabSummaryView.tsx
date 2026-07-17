"use client";

import { useState } from "react";
import { Eye, FileText, RefreshCw, CheckCircle2, AlertTriangle, Share2 } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Badge } from "@/frontend/components/ui/Badge";
import type { LabReport } from "@/backend/features/lab-reports/lab-reports.types";
import { parseSummary } from "@/backend/features/lab-reports/parse-summary";
import { buildSummaryPdf, downloadSummaryPdf } from "@/backend/features/lab-reports/summary-pdf";
import { safeFileName } from "@/backend/lib/download";
import { shareReport } from "@/backend/lib/share";
import { fileUrl } from "@/backend/lib/api-url";
import { ConfidenceBadge } from "./ConfidenceBadge";

// Splits a finding line like "Platelet Count: 410 K/uL — mildly elevated" into a title + detail.
function splitFinding(s: string): { title: string; detail: string } {
  const m = s.match(/^([^:—-]{2,40})[:—-]\s*(.+)$/);
  if (m) return { title: m[1].trim(), detail: m[2].trim() };
  return { title: s, detail: "" };
}

export function LabSummaryView({
  lab,
  summaryText,
  busy,
  onRegenerate,
  onViewOriginal
}: {
  lab: LabReport;
  summaryText: string;
  busy?: boolean;
  onRegenerate: () => void;
  onViewOriginal: () => void;
}) {
  const { t } = useTranslation();
  const s = parseSummary(summaryText);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const pdfLabels = {
    labLabel: t("labReportsAi.fieldLabName"),
    reportDateLabel: t("labReportsAi.fieldReportDate"),
    generatedLabel: t("labReportsAi.generatedAt"),
    overallStatus: t("labReportsAi.secOverall"),
    keyFindings: t("labReportsAi.secKeyFindings"),
    abnormalResults: t("labReportsAi.secAbnormal"),
    normalResults: t("labReportsAi.secNormal"),
    followUp: t("labReportsAi.secFollowUp"),
    disclaimer: t("labReportsAi.disclaimer"),
    footer: t("labReportsAi.pdfFooter")
  };

  async function downloadSummary() {
    try {
      await downloadSummaryPdf(lab, s, pdfLabels);
    } catch {
      // PDF generation failed (e.g. lazy-loaded jsPDF unavailable) — surface nothing destructive.
    }
  }

  async function shareSummary() {
    try {
      const doc = await buildSummaryPdf(lab, s, pdfLabels);
      const filename = safeFileName(lab.testName ?? "lab-summary", "summary") + ".pdf";
      const outcome = await shareReport(
        { blob: doc.output("blob"), filename, mimeType: "application/pdf" },
        {
          title: lab.testName ?? t("labReportsAi.summaryTitle"),
          text: t("labReportsAi.shareText"),
          url: fileUrl(lab.fileUrl)
        }
      );
      if (outcome === "copied") {
        setShareState("copied");
        setTimeout(() => setShareState("idle"), 1500);
      } else if (outcome === "unsupported") {
        doc.save(filename);
      }
    } catch {
      // PDF generation failed (e.g. lazy-loaded jsPDF unavailable) — surface nothing destructive.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Report header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {lab.testName ?? t("labReportsAi.summaryTitle")}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            {lab.labName && <span>{lab.labName}</span>}
            {lab.reportDate && (
              <span>
                {new Date(lab.reportDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {lab.extractionConfidence != null && (
            <ConfidenceBadge score={Math.round(lab.extractionConfidence)} />
          )}
          <Badge tone={s.hasAbnormal ? "amber" : "green"} className="gap-1">
            {s.hasAbnormal ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
            {s.hasAbnormal ? t("labReportsAi.resultReview") : t("labReportsAi.resultNormal")}
          </Badge>
        </div>
      </div>

      {/* Overall status */}
      {s.overallSummary && (
        <div
          className={`rounded-xl border p-4 ${
            s.hasAbnormal
              ? "border-warning-200 bg-warning-50/60 dark:border-warning-900/50 dark:bg-warning-900/15"
              : "border-success-200 bg-success-50/60 dark:border-success-900/50 dark:bg-success-900/15"
          }`}
        >
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            {s.hasAbnormal ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
            {t("labReportsAi.secOverall")}
          </p>
          <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100">
            {s.overallSummary}
          </p>
        </div>
      )}

      {/* Key findings */}
      {s.keyFindings.length > 0 && (
        <Section title={t("labReportsAi.secKeyFindings")}>
          <ul className="flex flex-col gap-1.5">
            {s.keyFindings.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-primary-500" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Abnormal results */}
      {s.abnormalResults.length > 0 && (
        <Section title={t("labReportsAi.secAbnormal")}>
          <div className="grid gap-3 sm:grid-cols-2">
            {s.abnormalResults.map((r, i) => {
              const { title, detail } = splitFinding(r);
              return (
                <div
                  key={i}
                  className="rounded-lg border border-warning-200 bg-warning-50/50 p-3 dark:border-warning-900/50 dark:bg-warning-900/15"
                >
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-warning-800 dark:text-warning-200">
                    <AlertTriangle size={14} className="shrink-0" />
                    {title}
                  </p>
                  {detail && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                      {detail}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Normal results */}
      {s.normalResults.length > 0 && (
        <Section title={t("labReportsAi.secNormal")}>
          <div className="flex flex-wrap gap-2">
            {s.normalResults.map((n, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-300"
              >
                <CheckCircle2 size={12} />
                {n}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Follow-up */}
      {s.followUp && (
        <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-900/50 dark:bg-primary-900/15">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
            {t("labReportsAi.secFollowUp")}
          </p>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">{s.followUp}</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {t("labReportsAi.disclaimer")}
      </p>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
        <ActionButton
          icon={Eye}
          label={t("labReportsAi.actViewOriginal")}
          onClick={onViewOriginal}
        />
        <ActionButton
          icon={FileText}
          label={t("labReportsAi.actDownloadSummary")}
          onClick={downloadSummary}
        />
        <ActionButton
          icon={Share2}
          label={
            shareState === "copied" ? t("labReportsAi.linkCopied") : t("labReportsAi.actShare")
          }
          onClick={shareSummary}
        />
        <ActionButton
          icon={RefreshCw}
          label={t("labReportsAi.actRegenerate")}
          onClick={onRegenerate}
          disabled={busy}
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {title}
      </p>
      {children}
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
  icon: typeof Eye;
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

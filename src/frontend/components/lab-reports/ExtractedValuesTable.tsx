"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Info,
  Calendar,
  Building2,
  Search,
  Eye,
  FileText,
  Sheet,
  Copy,
  Check,
  RefreshCw,
  SearchX,
  Share2
} from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Badge, type BadgeTone } from "@/frontend/components/ui/Badge";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Field";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import type {
  LabReport,
  ExtractedData,
  ExtractedTest
} from "@/backend/features/lab-reports/lab-reports.types";
import { parseSummary } from "@/backend/features/lab-reports/parse-summary";
import {
  parseNumber,
  parseRange,
  classify,
  type Status
} from "@/backend/features/lab-reports/lab-values";
import {
  bucketFor,
  computeValuesQuality,
  matchInterpretation,
  isVerified,
  sanitizeTests,
  buildValuesCsv,
  buildValuesText,
  type ValueBucket
} from "@/backend/features/lab-reports/extracted-values";
import { markerPct, bandPct } from "@/backend/features/lab-reports/lab-values";
import {
  buildExtractedDataPdf,
  downloadExtractedDataPdf
} from "@/backend/features/lab-reports/extracted-data-pdf";
import { downloadTextBlob, safeFileName } from "@/backend/lib/download";
import { shareReport } from "@/backend/lib/share";
import { fileUrl } from "@/backend/lib/api-url";
import { ConfidenceBadge } from "./ConfidenceBadge";

type Filter = "all" | ValueBucket;

const STATUS_TONE: Record<Status, BadgeTone> = {
  normal: "green",
  high: "amber",
  low: "amber",
  unknown: "gray"
};
// Abnormal/review rise to the top so the eye lands on what matters first.
const BUCKET_ORDER: Record<ValueBucket, number> = { abnormal: 0, review: 1, normal: 2, unrated: 3 };

interface Row {
  test: ExtractedTest;
  bucket: ValueBucket;
  status: Status;
  verified: boolean;
  idx: number;
}

export function ExtractedValuesTable({
  lab,
  extracted,
  busyAction,
  onRegenerate,
  onViewOriginal
}: {
  lab: LabReport;
  extracted: ExtractedData;
  busyAction?: "summary" | "extract" | null;
  onRegenerate: () => void;
  onViewOriginal: () => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  // Deterministic salvage (e.g. a flag letter extracted as the value) before any bucketing/export.
  const tests: ExtractedTest[] = useMemo(() => sanitizeTests(extracted.tests ?? []), [extracted]);
  const quality = useMemo(() => computeValuesQuality(tests), [tests]);

  const rows: Row[] = useMemo(
    () =>
      tests.map((test, idx) => {
        const value = parseNumber(test.value);
        const range = parseRange(test.referenceRange);
        return {
          test,
          bucket: bucketFor(test),
          status: classify(value, range, test.flag),
          verified: isVerified(test),
          idx
        };
      }),
    [tests]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (filter === "all" ? true : r.bucket === filter))
      .filter((r) => (q ? (r.test.name ?? "").toLowerCase().includes(q) : true))
      .sort((a, b) => BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket]);
  }, [rows, filter, query]);

  const pdfLabels = {
    labLabel: t("labReportsAi.fieldLabName"),
    reportDateLabel: t("labReportsAi.fieldReportDate"),
    extractedLabel: t("labReportsAi.extractedDate"),
    reference: t("labReportsAi.reference"),
    status: t("labReportsAi.colStatus"),
    verified: t("labReportsAi.verified"),
    notVerified: t("labReportsAi.notVerified"),
    disclaimer: t("labReportsAi.disclaimer"),
    footer: t("labReportsAi.pdfFooter")
  };

  // Interpretations are matched from the AI summary for the PDF only — the on-screen table stays
  // flat (no per-row explanation).
  function buildInterpretations() {
    const parsed = lab.summaryText ? parseSummary(lab.summaryText) : null;
    return tests.map((test) => matchInterpretation(test.name ?? "", parsed));
  }

  async function handleDownloadPdf() {
    await downloadExtractedDataPdf(lab, tests, buildInterpretations(), pdfLabels);
  }

  async function handleShare() {
    const doc = await buildExtractedDataPdf(lab, tests, buildInterpretations(), pdfLabels);
    const filename = safeFileName(lab.testName ?? "extracted-values", "extracted-values") + ".pdf";
    const outcome = await shareReport(
      { blob: doc.output("blob"), filename, mimeType: "application/pdf" },
      {
        title: lab.testName ?? t("labReportsAi.extractedTitle"),
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
  }
  function handleExportCsv() {
    downloadTextBlob(
      safeFileName(lab.testName ?? "extracted-values", "extracted-values") + ".csv",
      buildValuesCsv(tests),
      "text/csv"
    );
  }
  function handleCopy() {
    navigator.clipboard.writeText(buildValuesText(tests)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  // Raw dump — LLM output wasn't valid JSON.
  if (extracted.raw) {
    return (
      <pre className="max-h-[60vh] overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
        {extracted.raw}
      </pre>
    );
  }
  if (tests.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("labReportsAi.emptyExtractedTitle")}
        description={t("labReportsAi.emptyExtractedDesc")}
        action={
          <Button onClick={onRegenerate} disabled={busyAction === "extract"}>
            <RefreshCw size={16} />
            {t("labReportsAi.actRegenerate")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header: quality line + counts + meta + one report-level quality badge */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className={`flex items-center gap-1.5 text-sm font-semibold ${
              quality.reviewCount === 0
                ? "text-success-700 dark:text-success-300"
                : "text-warning-700 dark:text-warning-300"
            }`}
          >
            {quality.reviewCount === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {quality.reviewCount === 0
              ? t("labReportsAi.extractedSuccess")
              : t("labReportsAi.extractedPartial")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={14} className="text-success-500" />
              {quality.normalCount} {t("labReportsAi.normalValues")}
            </span>
            {quality.reviewCount > 0 && (
              <span className="flex items-center gap-1">
                <AlertTriangle size={14} className="text-warning-500" />
                {quality.reviewCount} {t("labReportsAi.needsReview")}
              </span>
            )}
            {quality.unratedCount > 0 && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Info size={14} />
                {quality.unratedCount} {t("labReportsAi.noRangePrinted")}
              </span>
            )}
            {lab.reportDate && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Calendar size={14} />
                {new Date(lab.reportDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            )}
            {lab.labName && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Building2 size={14} />
                {lab.labName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t("labReportsAi.extractionQuality")}
          </span>
          <ConfidenceBadge score={quality.score} />
        </div>
      </div>

      {/* Controls: search + status filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("labReportsAi.searchValues")}
            aria-label={t("labReportsAi.searchValues")}
            wrapClassName="mb-0"
            className="w-48 pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", t("labReportsAi.filterAll")],
              ["normal", t("labReportsAi.filterNormal")],
              ["abnormal", t("labReportsAi.filterAbnormal")],
              ["unrated", t("labReportsAi.noRangePrinted")],
              ["review", t("labReportsAi.needsReview")]
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === key
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table (sm and up) */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <th className="px-3 py-2.5 font-semibold">{t("labReportsAi.colTest")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("labReportsAi.colResult")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("labReportsAi.colRange")}</th>
              <th className="px-3 py-2.5 font-semibold">{t("labReportsAi.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <ValueRow key={r.idx} row={r} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Stacked cards (below sm) — the table's columns don't fit a phone screen without
          horizontal scrolling, so each test becomes a card instead. */}
      <div className="flex flex-col gap-2.5 sm:hidden">
        {visible.map((r) => (
          <ValueCard key={r.idx} row={r} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
        <ToolbarButton
          icon={Eye}
          label={t("labReportsAi.actViewOriginal")}
          onClick={onViewOriginal}
        />
        <ToolbarButton
          icon={FileText}
          label={t("labReportsAi.toolbarDownloadPdf")}
          onClick={handleDownloadPdf}
        />
        <ToolbarButton
          icon={Sheet}
          label={t("labReportsAi.toolbarExportCsv")}
          onClick={handleExportCsv}
        />
        <ToolbarButton
          icon={copied ? Check : Copy}
          label={copied ? t("labReportsAi.copied") : t("labReportsAi.toolbarCopyValues")}
          onClick={handleCopy}
        />
        <ToolbarButton
          icon={Share2}
          label={
            shareState === "copied" ? t("labReportsAi.linkCopied") : t("labReportsAi.actShare")
          }
          onClick={handleShare}
        />
        <ToolbarButton
          icon={RefreshCw}
          label={
            busyAction === "extract"
              ? t("labReportsAi.extracting")
              : t("labReportsAi.actRegenerate")
          }
          onClick={onRegenerate}
          disabled={busyAction === "extract"}
        />
      </div>

      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {t("labReportsAi.disclaimer")}
      </p>
    </div>
  );
}

function ValueRow({ row }: { row: Row }) {
  const { t } = useTranslation();
  const { test, status, verified } = row;
  const range = parseRange(test.referenceRange);
  const noRange = verified && range.low == null && range.high == null;

  const statusLabel =
    status === "normal"
      ? t("labResult.normal")
      : status === "high"
        ? t("labResult.high")
        : status === "low"
          ? t("labResult.low")
          : t("labResult.unknown");

  // Small hover-info instead of a loud block: why a value can't be judged (unverified OCR, or no
  // reference range). Native title = reliable tooltip that isn't clipped by the table's overflow.
  const infoText = !verified
    ? `${t("labReportsAi.unverifiedWarningTitle")} — ${t("labReportsAi.detectedAs")}: "${
        test.value || "—"
      }". ${t("labReportsAi.unverifiedWarningBody")}`
    : noRange
      ? t("labReportsAi.noRangeNote")
      : null;

  // Row tint by priority: abnormal warm, review/unverified subtle, normal none.
  const rowTint =
    row.bucket === "abnormal"
      ? "bg-warning-50/50 dark:bg-warning-900/10"
      : row.bucket === "review"
        ? "bg-gray-50/70 dark:bg-gray-800/30"
        : "";

  // Show the visual range bar only when we have a numeric value + two-sided range.
  const numericValue = parseNumber(test.value);
  const showBar = numericValue != null && range.low != null && range.high != null;

  return (
    <tr className={`border-b border-gray-100 align-top dark:border-gray-800/60 ${rowTint}`}>
      <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
        {test.name ?? t("labResult.unknown")}
      </td>
      <td className="px-3 py-2.5 tabular-nums text-gray-900 dark:text-white">
        <div className="flex flex-col gap-1.5">
          <span>
            {test.value ?? "—"}
            {test.unit ? (
              <span className="ml-1 text-xs font-normal text-gray-500">{test.unit}</span>
            ) : null}
          </span>
          {showBar && (
            <RangeBar value={numericValue!} low={range.low!} high={range.high!} status={status} />
          )}
        </div>
      </td>
      <td className="px-3 py-2.5 text-xs tabular-nums text-gray-500 dark:text-gray-400">
        {test.referenceRange || "—"}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Badge tone={STATUS_TONE[status]} className="gap-1">
            {status === "normal" ? (
              <CheckCircle2 size={12} />
            ) : status === "unknown" ? (
              <HelpCircle size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            {statusLabel}
          </Badge>
          {verified && !noRange ? (
            <ShieldCheck
              size={13}
              className="text-success-500"
              aria-label={t("labReportsAi.verified")}
            />
          ) : infoText ? (
            <button
              type="button"
              title={infoText}
              aria-label={infoText}
              className={`inline-flex ${
                verified
                  ? "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  : "text-warning-500"
              }`}
            >
              <Info size={14} />
            </button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

// ─── Value Card (mobile) ───────────────────────────────────────────────────────
// Same information as a ValueRow, stacked vertically for narrow screens.
function ValueCard({ row }: { row: Row }) {
  const { t } = useTranslation();
  const { test, status, verified } = row;
  const range = parseRange(test.referenceRange);
  const noRange = verified && range.low == null && range.high == null;

  const statusLabel =
    status === "normal"
      ? t("labResult.normal")
      : status === "high"
        ? t("labResult.high")
        : status === "low"
          ? t("labResult.low")
          : t("labResult.unknown");

  const infoText = !verified
    ? `${t("labReportsAi.unverifiedWarningTitle")} — ${t("labReportsAi.detectedAs")}: "${
        test.value || "—"
      }". ${t("labReportsAi.unverifiedWarningBody")}`
    : noRange
      ? t("labReportsAi.noRangeNote")
      : null;

  const cardTint =
    row.bucket === "abnormal"
      ? "border-warning-200 bg-warning-50/50 dark:border-warning-900/40 dark:bg-warning-900/10"
      : row.bucket === "review"
        ? "border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-800/30"
        : "border-gray-200 dark:border-gray-800";

  const numericValue = parseNumber(test.value);
  const showBar = numericValue != null && range.low != null && range.high != null;

  return (
    <div className={`rounded-xl border p-3 ${cardTint}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-gray-900 dark:text-white">
          {test.name ?? t("labResult.unknown")}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone={STATUS_TONE[status]} className="gap-1">
            {status === "normal" ? (
              <CheckCircle2 size={12} />
            ) : status === "unknown" ? (
              <HelpCircle size={12} />
            ) : (
              <AlertTriangle size={12} />
            )}
            {statusLabel}
          </Badge>
          {verified && !noRange ? (
            <ShieldCheck
              size={13}
              className="text-success-500"
              aria-label={t("labReportsAi.verified")}
            />
          ) : infoText ? (
            <button
              type="button"
              title={infoText}
              aria-label={infoText}
              className={`inline-flex ${
                verified
                  ? "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  : "text-warning-500"
              }`}
            >
              <Info size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1.5 tabular-nums text-gray-900 dark:text-white">
        <span className="text-base font-semibold">{test.value ?? "—"}</span>
        {test.unit && <span className="text-xs font-normal text-gray-500">{test.unit}</span>}
      </div>
      {showBar && (
        <div className="mt-2">
          <RangeBar
            value={numericValue!}
            low={range.low!}
            high={range.high!}
            status={status}
            className="w-full"
          />
        </div>
      )}
      <p className="mt-1.5 text-xs tabular-nums text-gray-500 dark:text-gray-400">
        {t("labReportsAi.colRange")}: {test.referenceRange || "—"}
      </p>
    </div>
  );
}

// ─── Range Bar ────────────────────────────────────────────────────────────────
// Thin inline gauge showing where the value falls relative to the normal band.
// Only rendered when both low + high range bounds and a numeric value are present.
function RangeBar({
  value,
  low,
  high,
  status,
  className
}: {
  value: number;
  low: number;
  high: number;
  status: "normal" | "high" | "low" | "unknown";
  className?: string;
}) {
  const markerPos = markerPct(value, low, high);
  const { left: bandLeft, width: bandWidth } = bandPct(value, low, high);

  const markerColor =
    status === "normal"
      ? "bg-success-500"
      : status === "high" || status === "low"
        ? "bg-warning-500"
        : "bg-gray-400";

  return (
    <div
      className={`relative h-1.5 min-w-[80px] rounded-full bg-gray-200 dark:bg-gray-700 ${className ?? "w-full max-w-[140px]"}`}
      role="img"
      aria-label={`Value ${value} — normal range ${low}–${high}`}
    >
      {/* Normal band (green shaded zone) */}
      <span
        className="absolute inset-y-0 rounded-full bg-success-200 dark:bg-success-900/50"
        style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
      />
      {/* Value marker dot */}
      <span
        className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm dark:border-gray-900 ${markerColor}`}
        style={{ left: `${markerPos}%` }}
      />
    </div>
  );
}

function ToolbarButton({
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

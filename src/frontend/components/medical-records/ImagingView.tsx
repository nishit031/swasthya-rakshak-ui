"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronsUpDown,
  AlertTriangle,
  FileText,
  RefreshCw,
  ScanLine,
  Ruler,
  Stethoscope,
  ArrowRightCircle,
  CheckCircle2,
  SearchX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { ConfidenceBadge } from "@/frontend/components/lab-reports/ConfidenceBadge";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import { modalityFor } from "@/backend/features/medical-records/imaging/imaging.registry";
import {
  severityTone,
  type ImagingFinding
} from "@/backend/features/medical-records/imaging/imaging.schema";

const LOW_CONFIDENCE = 60;

type SortKey = "finding" | "location" | "severity" | "measurement" | "confidence";

function sortValue(f: ImagingFinding, key: SortKey): string {
  switch (key) {
    case "finding":
      return (f.finding ?? "").toLowerCase();
    case "location":
      return (f.location ?? "").toLowerCase();
    case "severity":
      return (f.severity ?? "").toLowerCase();
    case "measurement":
      return (f.measurement ?? "").toLowerCase();
    case "confidence":
      return String(f.confidence).padStart(3, "0");
  }
}

export function ImagingView({
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
  const extraction = record.extractedDataJson;
  const modality = modalityFor(record.documentType);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [openRow, setOpenRow] = useState<number | null>(null);

  const e = extraction?.kind === "imaging" ? extraction : null;

  const findings = useMemo(() => {
    if (!e) return [];
    if (!sort) return e.findings;
    const copy = [...e.findings];
    copy.sort((a, b) => sortValue(a, sort.key).localeCompare(sortValue(b, sort.key)) * sort.dir);
    return copy;
  }, [e, sort]);

  if (!e) return null;

  const hasAnything =
    e.findings.length ||
    e.measurements.length ||
    e.impression.length ||
    e.recommendations.length ||
    e.normalFindings.length;

  if (!hasAnything) {
    return (
      <EmptyState
        icon={SearchX}
        title={t("medicalRecordsAi.emptyImgTitle")}
        description={t("medicalRecordsAi.emptyImgDesc")}
        action={
          <Button onClick={onRegenerate} disabled={busy}>
            <RefreshCw size={16} />
            {busy ? t("medicalRecordsAi.reprocessing") : t("medicalRecordsAi.regenerate")}
          </Button>
        }
      />
    );
  }

  function toggleSort(key: SortKey) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: "finding", label: t("medicalRecordsAi.colFinding") },
    { key: "location", label: t("medicalRecordsAi.colLocation") },
    { key: "severity", label: t("medicalRecordsAi.colSeverity") },
    { key: "measurement", label: t("medicalRecordsAi.colMeasurement") },
    { key: "confidence", label: t("medicalRecordsAi.colConfidence") }
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* At-a-glance summary card */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-secondary-200 bg-secondary-50/50 p-4 dark:border-secondary-900/50 dark:bg-secondary-900/20 sm:grid-cols-4">
        <Stat icon={ScanLine} label={t("medicalRecordsAi.imgModality")} value={modality ?? "—"} />
        <Stat
          icon={Stethoscope}
          label={t("medicalRecordsAi.imgRegions")}
          value={e.regions.length ? e.regions.join(", ") : (e.exam ?? "—")}
        />
        <Stat
          icon={AlertTriangle}
          label={t("medicalRecordsAi.imgFindingsCount")}
          value={String(e.findings.length)}
        />
        <Stat
          icon={ArrowRightCircle}
          label={t("medicalRecordsAi.imgRecommendationsCount")}
          value={String(e.recommendations.length)}
        />
        {e.exam && (
          <div className="col-span-2 sm:col-span-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              {t("medicalRecordsAi.imgExam")}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200">{e.exam}</p>
          </div>
        )}
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t("medicalRecordsAi.extractionQuality")}
          </span>
          <ConfidenceBadge score={e.confidence} />
        </div>
      </div>

      {/* Findings table */}
      {e.findings.length > 0 && (
        <div>
          <SectionLabel icon={AlertTriangle} label={t("medicalRecordsAi.tabFindings")} />
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="w-8 px-2 py-2.5" aria-hidden />
                  {columns.map((col) => (
                    <th key={col.key} className="px-3 py-2.5 font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-gray-800 dark:hover:text-gray-200"
                      >
                        {col.label}
                        <ChevronsUpDown
                          size={12}
                          className={
                            sort?.key === col.key
                              ? "text-primary-500"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {findings.map((f, idx) => (
                  <FindingRow
                    key={idx}
                    f={f}
                    idx={idx}
                    open={openRow === idx}
                    low={f.confidence < LOW_CONFIDENCE}
                    onToggle={() => setOpenRow(openRow === idx ? null : idx)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Measurements table */}
      {e.measurements.length > 0 && (
        <div>
          <SectionLabel icon={Ruler} label={t("medicalRecordsAi.imgMeasurements")} />
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-3 py-2.5 font-semibold">
                    {t("medicalRecordsAi.colMeasurement")}
                  </th>
                  <th className="px-3 py-2.5 font-semibold">{t("medicalRecordsAi.colLocation")}</th>
                  <th className="px-3 py-2.5 font-semibold">
                    {t("medicalRecordsAi.colAssociatedFinding")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {e.measurements.map((m, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 align-top dark:border-gray-800/60"
                  >
                    <td className="px-3 py-2.5 font-medium tabular-nums text-gray-900 dark:text-white">
                      {m.normalized ?? m.value ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                      {m.location ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                      {m.associatedFinding ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Impression */}
      {e.impression.length > 0 && (
        <InfoCard
          tone="primary"
          icon={Stethoscope}
          title={t("medicalRecordsAi.imgImpression")}
          lines={e.impression}
          ordered
        />
      )}

      {/* Recommendations */}
      {e.recommendations.length > 0 && (
        <InfoCard
          tone="amber"
          icon={ArrowRightCircle}
          title={t("medicalRecordsAi.imgRecommendations")}
          lines={e.recommendations}
        />
      )}

      {/* Normal findings */}
      {e.normalFindings.length > 0 && (
        <InfoCard
          tone="green"
          icon={CheckCircle2}
          title={t("medicalRecordsAi.imgNormalFindings")}
          lines={e.normalFindings}
        />
      )}

      {/* Toolbar */}
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

      <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {t("medicalRecordsAi.disclaimer")}
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value
}: {
  icon: typeof ScanLine;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        <Icon size={12} />
        {label}
      </p>
      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white" title={value}>
        {value}
      </p>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: typeof ScanLine; label: string }) {
  return (
    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      <Icon size={14} />
      {label}
    </p>
  );
}

const CARD_TONE = {
  primary: {
    box: "border-primary-200 bg-primary-50/50 dark:border-primary-900/50 dark:bg-primary-900/15",
    title: "text-primary-700 dark:text-primary-300"
  },
  amber: {
    box: "border-warning-200 bg-warning-50/50 dark:border-warning-900/50 dark:bg-warning-900/15",
    title: "text-warning-700 dark:text-warning-300"
  },
  green: {
    box: "border-success-200 bg-success-50/50 dark:border-success-900/50 dark:bg-success-900/15",
    title: "text-success-700 dark:text-success-300"
  }
} as const;

function InfoCard({
  tone,
  icon: Icon,
  title,
  lines,
  ordered
}: {
  tone: keyof typeof CARD_TONE;
  icon: typeof ScanLine;
  title: string;
  lines: string[];
  ordered?: boolean;
}) {
  const cls = CARD_TONE[tone];
  return (
    <div className={`rounded-xl border p-4 ${cls.box}`}>
      <p
        className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${cls.title}`}
      >
        <Icon size={14} />
        {title}
      </p>
      {ordered ? (
        <ol className="ml-4 list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-200">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      ) : (
        <ul className="ml-4 list-disc space-y-1 text-sm text-gray-700 dark:text-gray-200">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FindingRow({
  f,
  idx,
  open,
  low,
  onToggle
}: {
  f: ImagingFinding;
  idx: number;
  open: boolean;
  low: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const rowTint = idx % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-800/20" : "";
  const hasDetail = !!(f.sourceText || f.explanation || f.laterality);

  return (
    <>
      <tr
        className={`border-b border-gray-100 align-top transition-colors dark:border-gray-800/60 ${hasDetail ? "cursor-pointer hover:bg-primary-50/40 dark:hover:bg-primary-900/10" : ""} ${rowTint}`}
        onClick={hasDetail ? onToggle : undefined}
      >
        <td className="px-2 py-2.5 text-gray-400">
          {hasDetail && (
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown size={15} />
            </motion.span>
          )}
        </td>
        <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">
          <span className="flex items-center gap-1.5">
            {f.finding ?? "—"}
            {low && (
              <span
                title={t("medicalRecordsAi.reviewSuggested")}
                aria-label={t("medicalRecordsAi.reviewSuggested")}
                className="inline-flex text-warning-500"
              >
                <AlertTriangle size={13} />
              </span>
            )}
          </span>
        </td>
        <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
          {[f.laterality, f.location].filter(Boolean).join(" ") || "—"}
        </td>
        <td className="px-3 py-2.5">
          {f.severity ? (
            <Badge tone={severityTone(f.severity)}>{f.severity}</Badge>
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </td>
        <td className="px-3 py-2.5 tabular-nums text-gray-700 dark:text-gray-300">
          {f.measurement ?? "—"}
        </td>
        <td className="px-3 py-2.5">
          <ConfidenceBadge score={f.confidence} showLabel={false} />
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && hasDetail && (
          <tr>
            <td colSpan={6} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 bg-gray-50/70 px-11 py-3 dark:bg-gray-800/30">
                  {f.explanation && (
                    <div className="flex gap-2 text-sm">
                      <span className="w-24 shrink-0 text-gray-500 dark:text-gray-400">
                        {t("medicalRecordsAi.imgInPlainTerms")}
                      </span>
                      <span className="text-gray-800 dark:text-gray-200">{f.explanation}</span>
                    </div>
                  )}
                  {f.sourceText && (
                    <div className="flex gap-2 text-sm">
                      <span className="w-24 shrink-0 text-gray-500 dark:text-gray-400">
                        {t("medicalRecordsAi.imgSource")}
                      </span>
                      <span className="italic text-gray-600 dark:text-gray-300">
                        “{f.sourceText}”
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

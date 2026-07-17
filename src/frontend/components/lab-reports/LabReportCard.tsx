"use client";

import { fileUrl } from "@/backend/lib/api-url";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Sparkles, FileJson, ChevronDown, Edit2, Eye, History } from "lucide-react";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import type { LabReport, ExtractedData } from "@/backend/features/lab-reports/lab-reports.types";
import { SummaryProgress } from "./SummaryProgress";
import { LabSummaryView } from "./LabSummaryView";
import { ExtractedValuesTable } from "./ExtractedValuesTable";
import { LabReportThumbnail } from "./LabReportThumbnail";
import { DocumentViewerModal } from "@/frontend/components/ui/DocumentViewerModal";
import {
  SummaryViewerPanel,
  ValuesViewerPanel
} from "@/frontend/components/lab-reports/LabReportViewerPanels";

// Which report workspaces the user has left expanded — persisted so the choice survives refresh /
// navigation (matches the app's existing `sr:*` localStorage convention).
const LS_KEY = "sr:labSummaryExpanded";
function readExpandedMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function persistExpanded(id: string, val: boolean) {
  if (typeof window === "undefined") return;
  const map = readExpandedMap();
  if (val) map[id] = true;
  else delete map[id];
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

type View = "summary" | "values";
type ViewerContext = "none" | "summary" | "values";

export function LabReportCard({
  lab,
  summary,
  extracted,
  busyAction,
  onSummarize,
  onExtract,
  onEdit,
  onDelete,
  onHistory,
  selectable = false,
  selected = false,
  onToggleSelect
}: {
  lab: LabReport;
  summary?: string;
  extracted?: ExtractedData;
  busyAction?: "summary" | "extract" | null;
  onSummarize: () => void;
  onExtract: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onHistory: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(() => !!readExpandedMap()[lab.id]);
  const [view, setView] = useState<View>(summary ? "summary" : "values");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerContext, setViewerContext] = useState<ViewerContext>("none");

  function openViewer(context: ViewerContext = "none") {
    setViewerContext(context);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
    setViewerContext("none");
  }

  const viewerSidePanel =
    viewerContext === "summary" && summary
      ? {
          title: t("labReportsAi.viewerSideSummary"),
          content: <SummaryViewerPanel lab={lab} summaryText={summary} />
        }
      : viewerContext === "values" && extracted
        ? {
            title: t("labReportsAi.viewerSideValues"),
            content: <ValuesViewerPanel extracted={extracted} />
          }
        : undefined;

  // Auto-expand once when a summary is freshly generated in-session, so the user keeps watching.
  const prevSummary = useRef(summary);
  useEffect(() => {
    if (!prevSummary.current && summary) {
      setExpanded(true);
      setView("summary");
      persistExpanded(lab.id, true);
    }
    prevSummary.current = summary;
  }, [summary, lab.id]);

  // Auto-open the Lab Values tab once when extraction freshly completes in-session (not on page
  // load for an already-extracted report).
  const prevExtracted = useRef(extracted);
  useEffect(() => {
    if (!prevExtracted.current && extracted) {
      setExpanded(true);
      setView("values");
      persistExpanded(lab.id, true);
    }
    prevExtracted.current = extracted;
  }, [extracted, lab.id]);

  function toggle() {
    setExpanded((e) => {
      const next = !e;
      persistExpanded(lab.id, next);
      return next;
    });
  }

  const generating = busyAction === "summary";
  const hasWorkspace = !generating && (!!summary || !!extracted);

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <LabReportThumbnail
          filePath={lab.fileUrl}
          originalFilename={lab.originalFilename}
          testName={lab.testName}
          onClick={() => openViewer("none")}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white">
            {lab.testName ?? "Unnamed test"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
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
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={summary ? "green" : "gray"}>
            {summary ? t("labReportsAi.summaryReady") : t("labReportsAi.notAnalyzed")}
          </Badge>
          {extracted && (
            <button
              type="button"
              onClick={onHistory}
              aria-label={t("labReportsAi.historyLabel")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            >
              <History size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label={t("common.edit")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <Edit2 size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={t("common.delete")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-900/30 dark:hover:text-error-400"
          >
            <Trash2 size={16} />
          </button>
          {selectable && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={() => onToggleSelect?.(lab.id)}
              aria-label={t("labReportsAi.selectReport")}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:border-gray-600"
            />
          )}
        </div>
      </div>

      {/* Generating: force-open progress panel */}
      {generating && (
        <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
          <SummaryProgress />
        </div>
      )}

      {/* Workspace: summary and/or extracted data available */}
      {hasWorkspace && (
        <div className="border-t border-gray-200 pt-2 dark:border-gray-800">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            className="flex w-full items-center justify-between rounded-md py-1.5 text-sm font-medium text-primary-700 transition-colors hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-200"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={16} />
              {expanded
                ? summary
                  ? t("labReportsAi.hideSummary")
                  : t("labReportsAi.hideDetails")
                : summary
                  ? t("labReportsAi.viewSummary")
                  : t("labReportsAi.viewDetails")}
            </span>
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={18} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-4 pt-3">
                  {/* Tabs */}
                  <div className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                    <TabButton
                      active={view === "summary"}
                      onClick={() => setView("summary")}
                      label={t("labReportsAi.tabSummary")}
                    />
                    <TabButton
                      active={view === "values"}
                      onClick={() => setView("values")}
                      label={t("labReportsAi.tabValues")}
                    />
                  </div>

                  {view === "summary" ? (
                    summary ? (
                      // Regenerating a summary flips busyAction to "summary", which collapses this
                      // workspace into the progress panel — so no busy state is needed here.
                      <LabSummaryView
                        lab={lab}
                        summaryText={summary}
                        onRegenerate={onSummarize}
                        onViewOriginal={() => openViewer("summary")}
                      />
                    ) : (
                      <TabCta
                        icon={Sparkles}
                        label={t("labReportsAi.summarize")}
                        onClick={onSummarize}
                      />
                    )
                  ) : extracted ? (
                    <ExtractedValuesTable
                      lab={lab}
                      extracted={extracted}
                      busyAction={busyAction}
                      onRegenerate={onExtract}
                      onViewOriginal={() => openViewer("values")}
                    />
                  ) : (
                    <TabCta
                      icon={FileJson}
                      label={
                        busyAction === "extract"
                          ? t("labReportsAi.extracting")
                          : t("labReportsAi.extract")
                      }
                      onClick={onExtract}
                      disabled={busyAction === "extract"}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Nothing yet: primary actions */}
      {!generating && !summary && !extracted && (
        <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button size="sm" onClick={onSummarize}>
            <Sparkles size={16} />
            {t("labReportsAi.summarize")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExtract}
            disabled={busyAction === "extract"}
          >
            <FileJson size={16} />
            {busyAction === "extract" ? t("labReportsAi.extracting") : t("labReportsAi.extract")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => openViewer("none")}>
            <Eye size={16} />
            {t("labReportsAi.actViewOriginal")}
          </Button>
        </div>
      )}

      <DocumentViewerModal
        open={viewerOpen}
        onClose={closeViewer}
        fileUrl={fileUrl(lab.fileUrl)}
        originalFilename={lab.originalFilename}
        testName={lab.testName}
        sidePanel={viewerSidePanel}
      />
    </GlassCard>
  );
}

function TabButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-white text-primary-700 shadow-sm dark:bg-gray-900 dark:text-primary-300"
          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function TabCta({
  icon: Icon,
  label,
  onClick,
  disabled
}: {
  icon: typeof Sparkles;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-center py-8">
      <Button onClick={onClick} disabled={disabled}>
        <Icon size={16} />
        {label}
      </Button>
    </div>
  );
}

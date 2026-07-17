"use client";

import { useEffect, useState } from "react";
import {
  FlaskConical,
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
  FileJson,
  type LucideIcon
} from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type { LabReport, ExtractedData } from "@/backend/features/lab-reports/lab-reports.types";
import type { AiInsight } from "@/backend/features/ai/ai.types";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { useNotification } from "@/frontend/components/providers/NotificationContext";
import { AddLabReportModal } from "@/frontend/components/lab-reports/AddLabReportModal";
import { AiConsentModal } from "@/frontend/components/lab-reports/AiConsentModal";
import { LabReportCard } from "@/frontend/components/lab-reports/LabReportCard";
import { LabReportCardSkeleton } from "@/frontend/components/lab-reports/LabReportCardSkeleton";
import { DeleteLabReportModal } from "@/frontend/components/lab-reports/DeleteLabReportModal";
import { EditLabReportModal } from "@/frontend/components/lab-reports/EditLabReportModal";
import { LabReportBulkActionBar } from "@/frontend/components/lab-reports/LabReportBulkActionBar";
import { LabReportVersionHistoryModal } from "@/frontend/components/lab-reports/LabReportVersionHistoryModal";
import { LabTrendsView } from "@/frontend/components/lab-reports/LabTrendsView";

// Parse the extraction JSON; if it isn't parseable, keep the raw text so we can still show it.
function parseExtracted(s: string): ExtractedData {
  try {
    return JSON.parse(s) as ExtractedData;
  } catch {
    return { raw: s };
  }
}

export default function LabReportsPage() {
  const { t, formatMessage } = useTranslation();
  const { notify, dismiss } = useNotification();
  const [items, setItems] = useState<LabReport[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"reports" | "trends">("reports");
  // Per-report AI state, keyed by report id: which action is running, and the result to show.
  const [aiBusy, setAiBusy] = useState<{ id: string; action: "summary" | "extract" } | null>(null);
  const [aiResult, setAiResult] = useState<
    Record<string, { summary?: string; extracted?: ExtractedData }>
  >({});
  // Consent prompt for summarize/extract: the action to replay after the user grants consent.
  const [consentFor, setConsentFor] = useState<{
    lab: LabReport;
    action: "summary" | "extract";
  } | null>(null);
  const [grantingConsent, setGrantingConsent] = useState(false);
  // Delete modal state
  const [deleteLab, setDeleteLab] = useState<LabReport | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  // Edit modal state
  const [editLab, setEditLab] = useState<LabReport | null>(null);
  // Version history modal state
  const [historyLab, setHistoryLab] = useState<LabReport | null>(null);

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    current: number;
    total: number;
    action: "summary" | "extract";
  } | null>(null);

  // Success confirmation toast — auto-dismisses after a few seconds (unlike reminder toasts,
  // which stay until the user acts on them).
  function notifySuccess(title: string, icon: LucideIcon) {
    const id = notify({ title, tone: "success", icon });
    setTimeout(() => dismiss(id), 3500);
  }

  function handleReportAdded() {
    load();
    notifySuccess(t("labReportsAi.toastSaved"), CheckCircle2);
  }

  async function load() {
    const [labs, fam] = await Promise.all([
      apiFetch<LabReport[]>("/lab-reports"),
      apiFetch<FamilyMember[]>("/family-members")
    ]);
    if (labs.success) setItems(labs.data ?? []);
    if (fam.success) setMembers(fam.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleDeleteRequest(lab: LabReport) {
    setDeleteLab(lab);
  }

  function closeDeleteModal() {
    setDeleteLab(null);
    setConfirmBulkDelete(false);
  }

  async function confirmDelete() {
    setDeleting(true);
    if (confirmBulkDelete) {
      const count = selected.size;
      for (const id of selected) await apiFetch(`/lab-reports/${id}`, { method: "DELETE" });
      setSelected(new Set());
      notifySuccess(formatMessage("labReportsAi.toastBulkDeleted", { count }), Trash2);
    } else if (deleteLab) {
      await apiFetch(`/lab-reports/${deleteLab.id}`, { method: "DELETE" });
      notifySuccess(t("labReportsAi.toastDeleted"), Trash2);
    }
    setDeleting(false);
    closeDeleteModal();
    load();
  }

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelected(new Set());
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkRunAi(action: "summary" | "extract") {
    const targets = items.filter((l) => selected.has(l.id));
    setBulkBusy(true);
    for (let i = 0; i < targets.length; i++) {
      setBulkProgress({ current: i + 1, total: targets.length, action });
      await runAi(targets[i], action, { silent: true });
    }
    setBulkBusy(false);
    setBulkProgress(null);
    if (targets.length > 0) {
      notifySuccess(
        formatMessage(
          action === "summary"
            ? "labReportsAi.toastBulkSummaryGenerated"
            : "labReportsAi.toastBulkValuesExtracted",
          { count: targets.length }
        ),
        action === "summary" ? Sparkles : FileJson
      );
    }
  }

  // Runs OCR + AI on a saved report via the redaction gateway. `silent` suppresses the individual
  // success toast when called from the bulk loop, which shows one aggregate toast instead.
  async function runAi(lab: LabReport, action: "summary" | "extract", opts?: { silent?: boolean }) {
    setAiBusy({ id: lab.id, action });
    setError(null);
    const res = await apiFetch<AiInsight>(`/ai/${action}`, {
      method: "POST",
      body: JSON.stringify({ sourceType: "lab_report", sourceId: lab.id })
    });
    setAiBusy(null);
    if (!res.success || !res.data) {
      // 403 = AI consent not granted → prompt for it, then replay this action on Allow.
      if (res.message?.toLowerCase().includes("consent")) {
        setConsentFor({ lab, action });
      } else {
        setError(res.message || t("common.error"));
      }
      return;
    }
    setAiResult((prev) => ({
      ...prev,
      [lab.id]: {
        ...prev[lab.id],
        ...(action === "summary"
          ? { summary: res.data!.insightText }
          : { extracted: parseExtracted(res.data!.insightText) })
      }
    }));
    if (!opts?.silent) {
      notifySuccess(
        action === "summary"
          ? t("labReportsAi.toastSummaryGenerated")
          : t("labReportsAi.toastValuesExtracted"),
        action === "summary" ? Sparkles : FileJson
      );
    }
  }

  // Grant AI consent (persisted on the profile), then replay the action that was blocked.
  async function grantConsentAndRun() {
    if (!consentFor) return;
    setGrantingConsent(true);
    const res = await apiFetch("/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ aiConsent: true })
    });
    setGrantingConsent(false);
    if (!res.success) {
      setError(res.message || t("common.error"));
      return;
    }
    const pending = consentFor;
    setConsentFor(null);
    runAi(pending.lab, pending.action);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("nav2.labReports")}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {items.length === 0
                ? "No reports yet"
                : `${items.length} test report${items.length === 1 ? "" : "s"} on file`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleSelectMode} aria-pressed={selectMode}>
            {selectMode ? t("labReportsAi.exitSelectMode") : t("labReportsAi.selectReports")}
          </Button>
          <Button
            onClick={() => {
              setShowAdd(true);
              setError(null);
            }}
          >
            <Plus size={16} />
            {t("common.add")}
          </Button>
        </div>
      </div>

      <div className="flex w-fit items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <PageTabButton
          active={tab === "reports"}
          onClick={() => setTab("reports")}
          label={t("labReportsAi.tabReports")}
        />
        <PageTabButton
          active={tab === "trends"}
          onClick={() => setTab("trends")}
          label={t("labReportsAi.tabTrends")}
        />
      </div>

      {tab === "reports" && selectMode && (
        <LabReportBulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={() => setConfirmBulkDelete(true)}
          onSummarize={() => bulkRunAi("summary")}
          onExtract={() => bulkRunAi("extract")}
          busy={bulkBusy}
          busyLabel={
            bulkProgress
              ? formatMessage(
                  bulkProgress.action === "summary"
                    ? "labReportsAi.bulkSummarizing"
                    : "labReportsAi.bulkExtracting",
                  { current: bulkProgress.current, total: bulkProgress.total }
                )
              : undefined
          }
        />
      )}

      {tab === "reports" && error && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          {error}
        </p>
      )}

      {tab === "reports" && loading && (
        <div className="flex flex-col gap-4">
          <LabReportCardSkeleton />
          <LabReportCardSkeleton />
          <LabReportCardSkeleton />
        </div>
      )}

      {tab === "reports" && !loading && items.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={FlaskConical}
            title="No lab reports yet"
            description="Upload your first lab report to get started — AI will read it and fill in the details for you."
            action={
              <Button
                onClick={() => {
                  setShowAdd(true);
                  setError(null);
                }}
              >
                <Plus size={16} />
                {t("common.add")}
              </Button>
            }
          />
        </GlassCard>
      )}

      {tab === "reports" && !loading && items.length > 0 && (
        <div className="flex flex-col gap-4">
          {items.map((lab) => (
            <LabReportCard
              key={lab.id}
              lab={lab}
              summary={aiResult[lab.id]?.summary ?? lab.summaryText ?? undefined}
              extracted={aiResult[lab.id]?.extracted ?? lab.extractedDataJson ?? undefined}
              busyAction={aiBusy?.id === lab.id ? aiBusy.action : null}
              onSummarize={() => runAi(lab, "summary")}
              onExtract={() => runAi(lab, "extract")}
              onEdit={() => setEditLab(lab)}
              onDelete={() => handleDeleteRequest(lab)}
              onHistory={() => setHistoryLab(lab)}
              selectable={selectMode}
              selected={selected.has(lab.id)}
              onToggleSelect={toggleSelected}
            />
          ))}
        </div>
      )}

      {tab === "trends" && !loading && <LabTrendsView labs={items} />}

      <AddLabReportModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        members={members}
        onSaved={handleReportAdded}
      />

      <AiConsentModal
        open={consentFor !== null}
        onClose={() => setConsentFor(null)}
        onAllow={grantConsentAndRun}
        loading={grantingConsent}
      />

      <DeleteLabReportModal
        lab={deleteLab}
        bulkCount={confirmBulkDelete ? selected.size : undefined}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        loading={deleting}
      />

      <EditLabReportModal
        lab={editLab}
        onClose={() => setEditLab(null)}
        members={members}
        onSaved={load}
      />

      <LabReportVersionHistoryModal lab={historyLab} onClose={() => setHistoryLab(null)} />
    </div>
  );
}

function PageTabButton({
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
      aria-pressed={active}
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

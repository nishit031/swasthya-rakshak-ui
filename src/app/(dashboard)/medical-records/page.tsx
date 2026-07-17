"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { Stethoscope, Plus, Search, SearchX, FilterX, Sparkles } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { extensionFromUrl, safeFileName, triggerDownload } from "@/backend/lib/download";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { AddMedicalRecordModal } from "@/frontend/components/medical-records/AddMedicalRecordModal";
import { MedicalRecordCard } from "@/frontend/components/medical-records/MedicalRecordCard";
import { EditRecordModal } from "@/frontend/components/medical-records/EditRecordModal";
import { RecordFilterBar } from "@/frontend/components/medical-records/RecordFilterBar";
import { RecordSearchBox } from "@/frontend/components/medical-records/RecordSearchBox";
import { BulkActionBar } from "@/frontend/components/medical-records/BulkActionBar";
import { SAVED_VIEWS_CHANGED_EVENT } from "@/frontend/components/medical-records/SavedViewsNav";
import { AiConsentModal } from "@/frontend/components/lab-reports/AiConsentModal";
import { useRecordFilters } from "@/backend/features/medical-records/useRecordFilters";
import { serializeFilters, isEmptyFilters } from "@/backend/features/medical-records/filters";
import { isProcessable } from "@/backend/features/medical-records/processable";
import { addRecentSearch } from "@/backend/features/medical-records/recent-searches";

function MedicalRecordsPageContent() {
  const { t, formatMessage } = useTranslation();
  const { filters, setFilters, resetFilters } = useRecordFilters();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryInput, setQueryInput] = useState(filters.search ?? "");
  // The record currently being processed (extract + summary in flight).
  const [busyId, setBusyId] = useState<string | null>(null);
  // Consent prompt: the record to re-process once consent is granted.
  const [consentFor, setConsentFor] = useState<MedicalRecord | null>(null);
  const [grantingConsent, setGrantingConsent] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);

  // Bulk selection
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const loadRecords = useCallback(async () => {
    const qs = serializeFilters(filters).toString();
    const recs = await apiFetch<MedicalRecord[]>(`/medical-records${qs ? `?${qs}` : ""}`);
    if (recs.success) setRecords(recs.data ?? []);
    setLoading(false);
  }, [filters]);

  // Load family members once.
  useEffect(() => {
    apiFetch<FamilyMember[]>("/family-members").then((fam) => {
      if (fam.success) setMembers(fam.data ?? []);
    });
  }, []);

  // Load / re-load records whenever the URL-persisted filters change.
  useEffect(() => {
    loadRecords();
    if (filters.search) addRecentSearch(filters.search);
  }, [loadRecords, filters.search]);

  // Debounce the search box into the URL-persisted filter (matches the prior UX).
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters({ search: queryInput.trim() || undefined }),
      queryInput ? 300 : 0
    );
    return () => clearTimeout(timer);
  }, [queryInput]);

  // Stable (useCallback) so the same function reference flows to every card — required for
  // MedicalRecordCard's memo() to actually skip re-rendering unrelated cards.
  const handleDelete = useCallback(
    async (record: MedicalRecord) => {
      if (!confirm("Delete this record?")) return;
      await apiFetch(`/medical-records/${record.id}`, { method: "DELETE" });
      loadRecords();
    },
    [loadRecords]
  );

  // Fetches a signed URL for the record, then downloads the original file to the device.
  const handleExport = useCallback(async (r: MedicalRecord) => {
    const res = await apiFetch<MedicalRecord>(`/medical-records/${r.id}`);
    if (!res.success || !res.data) {
      setError(res.message || "Could not download this file");
      return;
    }
    const filename = safeFileName(r.title, "record") + extensionFromUrl(res.data.fileUrl);
    triggerDownload(res.data.fileUrl, filename);
  }, []);

  // Runs on-demand clinical processing (OCR → extract + summary) via the redaction gateway.
  const runProcess = useCallback(
    async (record: MedicalRecord) => {
      setBusyId(record.id);
      setError(null);
      const res = await apiFetch<MedicalRecord>(`/medical-records/${record.id}/process`, {
        method: "POST"
      });
      setBusyId(null);
      if (!res.success || !res.data) {
        // 403 = AI consent not granted → prompt for it, then replay on Allow.
        if (res.message?.toLowerCase().includes("consent")) {
          setConsentFor(record);
        } else {
          setError(res.message || t("common.error"));
        }
        return;
      }
      // Swap the updated record (now carrying summary + sections) into the list in place.
      setRecords((prev) => prev.map((r) => (r.id === res.data!.id ? res.data! : r)));
    },
    [t]
  );

  // Grant AI consent (persisted on the profile), then replay the blocked processing.
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
    runProcess(pending);
  }

  async function saveCurrentView(name: string) {
    await apiFetch("/saved-views", {
      method: "POST",
      body: JSON.stringify({ name, filterJson: filters })
    });
    window.dispatchEvent(new Event(SAVED_VIEWS_CHANGED_EVENT));
  }

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelected(new Set());
  }

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function bulkDelete() {
    if (!confirm(formatMessage("medicalRecordsAi.bulkDeleteConfirm", { count: selected.size })))
      return;
    setBulkBusy(true);
    for (const id of selected) await apiFetch(`/medical-records/${id}`, { method: "DELETE" });
    setBulkBusy(false);
    setSelected(new Set());
    loadRecords();
  }

  async function bulkExport() {
    for (const id of selected) {
      const record = records.find((r) => r.id === id);
      if (record) await handleExport(record);
    }
  }

  async function bulkProcess() {
    const targets = records.filter(
      (r) => selected.has(r.id) && isProcessable(r.documentType) && !r.summaryText
    );
    setBulkBusy(true);
    for (let i = 0; i < targets.length; i++) {
      setBulkProgress({ current: i + 1, total: targets.length });
      await runProcess(targets[i]);
    }
    setBulkBusy(false);
    setBulkProgress(null);
  }

  async function bulkMove(familyMemberId: string | null) {
    setBulkBusy(true);
    for (const id of selected) {
      await apiFetch(`/medical-records/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ familyMemberId })
      });
    }
    setBulkBusy(false);
    setSelected(new Set());
    loadRecords();
  }

  const hasQuery = !!filters.search?.trim();
  const hasOtherFilters = !isEmptyFilters({ ...filters, search: undefined });
  const noneAtAll = !loading && records.length === 0 && !hasQuery && !hasOtherFilters;
  const noProcessedMatch =
    !loading && records.length === 0 && filters.processed === "processed" && !hasQuery;
  const noFilterMatch =
    !loading && records.length === 0 && hasOtherFilters && !hasQuery && !noProcessedMatch;
  const noSearchResults = !loading && records.length === 0 && hasQuery;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("nav2.medicalRecords")}
          </h1>
          {!loading && !hasQuery && !hasOtherFilters && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {records.length === 0
                ? t("medicalRecordsAi.noRecordsYet")
                : `${records.length} ${t("medicalRecordsAi.documentsStored")}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleSelectMode} aria-pressed={selectMode}>
            {selectMode
              ? t("medicalRecordsAi.exitSelectMode")
              : t("medicalRecordsAi.selectRecords")}
          </Button>
          <Button
            onClick={() => {
              setShowAdd(true);
              setError(null);
            }}
          >
            <Plus size={16} />
            {t("medicalRecordsAi.addRecord")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <RecordSearchBox
          value={queryInput}
          onChange={setQueryInput}
          onSubmit={(v) => setFilters({ search: v.trim() || undefined })}
        />
        <RecordFilterBar
          filters={filters}
          onChange={setFilters}
          onReset={() => {
            resetFilters();
            setQueryInput("");
          }}
          onSaveView={saveCurrentView}
          members={members}
        />
      </div>

      {selectMode && (
        <BulkActionBar
          count={selected.size}
          onClear={() => setSelected(new Set())}
          onDelete={bulkDelete}
          onExport={bulkExport}
          onProcess={bulkProcess}
          onMove={bulkMove}
          members={members}
          busy={bulkBusy}
          busyLabel={
            bulkProgress
              ? formatMessage("medicalRecordsAi.bulkProcessing", {
                  current: bulkProgress.current,
                  total: bulkProgress.total
                })
              : undefined
          }
        />
      )}

      {error && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {noSearchResults && (
        <GlassCard>
          <EmptyState
            icon={Search}
            title={t("medicalRecordsAi.noSearchResults")}
            description=""
            action={
              <Button variant="outline" onClick={() => setQueryInput("")}>
                <SearchX size={16} />
                {t("common.cancel")}
              </Button>
            }
          />
        </GlassCard>
      )}

      {noProcessedMatch && (
        <GlassCard>
          <EmptyState
            icon={Sparkles}
            title={t("medicalRecordsAi.noProcessedTitle")}
            description={t("medicalRecordsAi.noProcessedDesc")}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  resetFilters();
                  setQueryInput("");
                }}
              >
                <FilterX size={16} />
                {t("medicalRecordsAi.clearFilters")}
              </Button>
            }
          />
        </GlassCard>
      )}

      {noFilterMatch && (
        <GlassCard>
          <EmptyState
            icon={FilterX}
            title={t("medicalRecordsAi.noFilterMatchTitle")}
            description={t("medicalRecordsAi.noFilterMatchDesc")}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  resetFilters();
                  setQueryInput("");
                }}
              >
                <FilterX size={16} />
                {t("medicalRecordsAi.clearFilters")}
              </Button>
            }
          />
        </GlassCard>
      )}

      {noneAtAll && (
        <GlassCard>
          <EmptyState
            icon={Stethoscope}
            title={t("medicalRecordsAi.emptyTitle")}
            description={t("medicalRecordsAi.emptyDesc")}
            action={
              <Button
                onClick={() => {
                  setShowAdd(true);
                  setError(null);
                }}
              >
                <Plus size={16} />
                {t("medicalRecordsAi.addRecord")}
              </Button>
            }
          />
        </GlassCard>
      )}

      {/* ponytail: renders the full list (no windowing) — fine at pilot scale (a patient's own
          records, realistically dozens). MedicalRecordCard is memoized with stable callback refs
          so unrelated state (search/selection) doesn't re-render every card; if a user's list
          grows into the thousands, add virtualization (e.g. react-window) here. */}
      {!loading && records.length > 0 && (
        <div className="flex flex-col gap-4">
          {records.map((r) => (
            <MedicalRecordCard
              key={r.id}
              record={r}
              busy={busyId === r.id}
              onProcess={runProcess}
              onDelete={handleDelete}
              onExport={handleExport}
              onEdit={setEditingRecord}
              onTagClick={setFilters}
              selectable={selectMode}
              selected={selected.has(r.id)}
              onToggleSelect={toggleSelected}
              searchQuery={filters.search}
            />
          ))}
        </div>
      )}

      <AddMedicalRecordModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        members={members}
        onSaved={() => loadRecords()}
      />

      <EditRecordModal
        record={editingRecord}
        open={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        members={members}
        onSaved={(updated) => {
          setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }}
        onReprocess={runProcess}
      />

      <AiConsentModal
        open={consentFor !== null}
        onClose={() => setConsentFor(null)}
        onAllow={grantConsentAndRun}
        loading={grantingConsent}
      />
    </div>
  );
}

export default function MedicalRecordsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>}>
      <MedicalRecordsPageContent />
    </Suspense>
  );
}

"use client";

import { apiUrl } from "@/backend/lib/api-url";
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { getAccessToken } from "@/backend/features/auth/auth.client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { Modal } from "@/frontend/components/ui/Modal";
import { Button } from "@/frontend/components/ui/Button";
import { Input, Select } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";
import type { MetadataResult } from "@/backend/features/ai/ai.types";
import type { CreateLabReportInput } from "@/backend/features/lab-reports/lab-reports.types";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import { StagedLoader } from "./StagedLoader";
import { AiMetadataCard } from "./AiMetadataCard";
import { AiConsentModal } from "./AiConsentModal";

const today = () => new Date().toISOString().slice(0, 10);

type Phase = "idle" | "analyzing" | "review";

interface FormState {
  testName: string;
  labName: string;
  reportDate: string;
  familyMemberId: string;
}

/** AI-assisted upload: pick a file → OCR+LLM auto-fill the fields → review → save. */
export function AddLabReportModal({
  open,
  onClose,
  members,
  onSaved
}: {
  open: boolean;
  onClose: () => void;
  members: FamilyMember[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    originalFilename: string;
    fileSizeBytes: number;
    sha256: string;
  } | null>(null);
  const [meta, setMeta] = useState<MetadataResult | null>(null);
  const [form, setForm] = useState<FormState>({
    testName: "",
    labName: "",
    reportDate: today(),
    familyMemberId: ""
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needConsent, setNeedConsent] = useState(false);
  const [grantingConsent, setGrantingConsent] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  function reset() {
    setPhase("idle");
    setFileUrl(null);
    setFileMeta(null);
    setMeta(null);
    setForm({ testName: "", labName: "", reportDate: today(), familyMemberId: "" });
    setError(null);
    setNeedConsent(false);
  }

  function close() {
    reset();
    onClose();
  }

  // Uploads the picked file, then runs metadata analysis and prefills the form.
  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    onPickFile(e.dataTransfer.files?.[0]);
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPhase("analyzing");

    // 1. Upload the raw file (raw fetch — multipart, manual auth header).
    const fd = new FormData();
    fd.append("file", file);
    const token = getAccessToken();
    const up = await fetch(apiUrl("/api/v1/upload"), {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd
    })
      .then((r) => r.json())
      .catch(() => null);

    if (!up?.success) {
      setError(up?.message || "Upload failed");
      setPhase("review"); // let the user still fill manually
      return;
    }
    setFileUrl(up.data.fileUrl);
    setFileMeta({
      originalFilename: up.data.originalName,
      fileSizeBytes: up.data.fileSize,
      sha256: up.data.sha256
    });
    await runAnalyze(up.data.fileUrl);
  }

  // Calls /ai/analyze on an already-uploaded file and prefills fields. Falls back gracefully.
  async function runAnalyze(url: string) {
    setPhase("analyzing");
    const res = await apiFetch<MetadataResult>("/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ fileUrl: url })
    });

    if (!res.success || !res.data) {
      if (res.message?.toLowerCase().includes("consent")) {
        setNeedConsent(true);
        return; // keep loader off; consent modal drives the retry
      }
      // Non-consent failure → manual entry, keep today's date, show a friendly hint.
      setMeta(null);
      setForm((f) => ({ ...f, reportDate: today() }));
      setError(res.message || t("labReportsAi.errRead"));
      setPhase("review");
      return;
    }

    const m = res.data;
    setMeta(m);
    setForm((f) => ({
      ...f,
      testName: m.testName ?? f.testName,
      labName: m.labName ?? f.labName,
      reportDate: m.reportDate ?? today()
    }));
    setPhase("review");
  }

  async function grantConsent() {
    setGrantingConsent(true);
    const res = await apiFetch("/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ aiConsent: true })
    });
    setGrantingConsent(false);
    setNeedConsent(false);
    if (!res.success) {
      setError(res.message || t("common.error"));
      setPhase("review");
      return;
    }
    if (fileUrl) runAnalyze(fileUrl);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl) {
      setError("Please select a file");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: CreateLabReportInput = {
      fileUrl,
      ...(form.testName && { testName: form.testName }),
      ...(form.labName && { labName: form.labName }),
      ...(form.reportDate && { reportDate: form.reportDate }),
      ...(form.familyMemberId && { familyMemberId: form.familyMemberId }),
      ...(meta && { extractionConfidence: meta.confidence }),
      ...fileMeta
    };
    const res = await apiFetch("/lab-reports", { method: "POST", body: JSON.stringify(payload) });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Failed to save");
      return;
    }
    onSaved();
    close();
  }

  const analyzeStages = [
    t("labReportsAi.stageReading"),
    t("labReportsAi.stageOcr"),
    t("labReportsAi.stageExtracting"),
    t("labReportsAi.stageDone")
  ];

  return (
    <>
      <Modal open={open} onClose={close} title={t("labReportsAi.addTitle")}>
        <div className="flex flex-col gap-4">
          <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("labReportsAi.addSubtitle")}
          </p>

          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {error}
            </p>
          )}

          {phase === "idle" && (
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                isDragging
                  ? "animate-pulse border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/20"
                  : "border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-primary-600 dark:hover:bg-primary-900/10"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
                  isDragging
                    ? "bg-primary-200 text-primary-700 dark:bg-primary-800/60 dark:text-primary-200"
                    : "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
                }`}
              >
                <UploadCloud size={24} />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {isDragging ? t("labReportsAi.dropHint") : t("labReportsAi.uploadLabel")}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("labReportsAi.uploadHint")}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
            </label>
          )}

          {phase === "analyzing" && !needConsent && <StagedLoader stages={analyzeStages} />}

          {phase === "review" && (
            <form onSubmit={save} className="flex flex-col gap-4">
              {meta && <AiMetadataCard meta={meta} />}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t("labReportsAi.fieldTestName")}
                  value={form.testName}
                  onChange={(e) => setForm({ ...form, testName: e.target.value })}
                  placeholder="e.g. CBC, Lipid Profile"
                />
                <Input
                  label={t("labReportsAi.fieldLabName")}
                  value={form.labName}
                  onChange={(e) => setForm({ ...form, labName: e.target.value })}
                  placeholder="e.g. SRL Diagnostics"
                />
              </div>

              <DatePicker
                label={t("labReportsAi.fieldReportDate")}
                value={form.reportDate}
                onChange={(v) => setForm({ ...form, reportDate: v })}
              />

              {meta && meta.lowConfidenceFields.length > 0 && (
                <p className="text-xs text-warning-600 dark:text-warning-400">
                  {t("labReportsAi.verify")}
                </p>
              )}

              {members.length > 0 && (
                <Select
                  label={t("labReportsAi.forMember")}
                  value={form.familyMemberId}
                  onChange={(e) => setForm({ ...form, familyMemberId: e.target.value })}
                >
                  <option value="">{t("labReportsAi.self")}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="mt-2 flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? t("labReportsAi.saving") : t("labReportsAi.save")}
                </Button>
                <Button type="button" variant="outline" onClick={close}>
                  {t("common.cancel")}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      <AiConsentModal
        open={needConsent}
        onClose={() => {
          setNeedConsent(false);
          setPhase("review"); // declined → manual entry
          setForm((f) => ({ ...f, reportDate: today() }));
        }}
        onAllow={grantConsent}
        loading={grantingConsent}
      />
    </>
  );
}

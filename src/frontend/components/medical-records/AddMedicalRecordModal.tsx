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
import type { MedicalRecordClassification } from "@/backend/features/ai/ai.types";
import type { CreateMedicalRecordInput } from "@/backend/features/medical-records/medical-records.types";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import { MEDICAL_DOC_TYPES } from "@/backend/features/medical-records/document-types";
import { StagedLoader } from "@/frontend/components/lab-reports/StagedLoader";
import { AiConsentModal } from "@/frontend/components/lab-reports/AiConsentModal";
import { MedicalRecordMetaCard } from "./MedicalRecordMetaCard";

const today = () => new Date().toISOString().slice(0, 10);

type Phase = "idle" | "analyzing" | "review";

interface FormState {
  title: string;
  documentType: string;
  facility: string;
  physician: string;
  recordDate: string;
  familyMemberId: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  documentType: "",
  facility: "",
  physician: "",
  recordDate: today(),
  familyMemberId: ""
};

/** AI-assisted upload: pick a file → OCR+LLM classifies + prefills → review → save. */
export function AddMedicalRecordModal({
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
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<{
    originalFilename: string;
    fileSizeBytes: number;
    sha256: string;
  } | null>(null);
  const [meta, setMeta] = useState<MedicalRecordClassification | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needConsent, setNeedConsent] = useState(false);
  const [grantingConsent, setGrantingConsent] = useState(false);

  function reset() {
    setPhase("idle");
    setFileUrl(null);
    setFileType(null);
    setFileMeta(null);
    setMeta(null);
    setForm(EMPTY_FORM);
    setError(null);
    setNeedConsent(false);
  }

  function close() {
    reset();
    onClose();
  }

  // Uploads the picked file, then runs classification and prefills the form.
  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setPhase("analyzing");

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
      setPhase("review");
      return;
    }
    setFileUrl(up.data.fileUrl);
    setFileType(up.data.fileType);
    setFileMeta({
      originalFilename: up.data.originalName,
      fileSizeBytes: up.data.fileSize,
      sha256: up.data.sha256
    });
    await runClassify(up.data.fileUrl);
  }

  // Calls /ai/classify on an already-uploaded file and prefills fields. Falls back gracefully.
  async function runClassify(url: string) {
    setPhase("analyzing");
    const res = await apiFetch<MedicalRecordClassification>("/ai/classify", {
      method: "POST",
      body: JSON.stringify({ fileUrl: url })
    });

    if (!res.success || !res.data) {
      if (res.message?.toLowerCase().includes("consent")) {
        setNeedConsent(true);
        return;
      }
      setMeta(null);
      setForm((f) => ({ ...f, recordDate: today() }));
      setError(res.message || t("medicalRecordsAi.typeUnrecognized"));
      setPhase("review");
      return;
    }

    const m = res.data;
    setMeta(m);
    setForm((f) => ({
      ...f,
      title: m.title ?? f.title,
      documentType: m.documentType ?? f.documentType,
      facility: m.facility ?? f.facility,
      physician: m.physician ?? f.physician,
      recordDate: m.recordDate ?? today()
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
    if (fileUrl) runClassify(fileUrl);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!fileUrl || !fileType) {
      setError("Please select a file");
      return;
    }
    if (!form.title.trim()) {
      setError("Please enter a title");
      return;
    }
    setSaving(true);
    setError(null);
    const payload: CreateMedicalRecordInput = {
      fileUrl,
      fileType,
      title: form.title,
      ...(form.documentType && { documentType: form.documentType }),
      ...(form.facility && { sourceName: form.facility }),
      ...(form.physician && { physician: form.physician }),
      ...(form.recordDate && { visitDate: form.recordDate }),
      ...(form.familyMemberId && { familyMemberId: form.familyMemberId }),
      ...(meta && { extractionConfidence: meta.confidence }),
      ...fileMeta
    };
    const res = await apiFetch("/medical-records", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Failed to save");
      return;
    }
    onSaved();
    close();
  }

  const classifyStages = [
    t("medicalRecordsAi.stageReading"),
    t("medicalRecordsAi.stageOcr"),
    t("medicalRecordsAi.stageClassifying"),
    t("medicalRecordsAi.stageDone")
  ];

  return (
    <>
      <Modal open={open} onClose={close} title={t("medicalRecordsAi.addTitle")}>
        <div className="flex flex-col gap-4">
          <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("medicalRecordsAi.addSubtitle")}
          </p>

          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {error}
            </p>
          )}

          {phase === "idle" && (
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition-colors hover:border-primary-400 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:border-primary-600 dark:hover:bg-primary-900/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                <UploadCloud size={24} />
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t("medicalRecordsAi.uploadLabel")}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("medicalRecordsAi.uploadHint")}
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

          {phase === "analyzing" && !needConsent && <StagedLoader stages={classifyStages} />}

          {phase === "review" && (
            <form onSubmit={save} className="flex flex-col gap-4">
              {meta && <MedicalRecordMetaCard meta={meta} />}

              <Input
                label={t("medicalRecordsAi.fieldTitle")}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Discharge Summary — Apollo Hospital"
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label={t("medicalRecordsAi.fieldDocumentType")}
                  value={form.documentType}
                  onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                >
                  <option value="">— select —</option>
                  {MEDICAL_DOC_TYPES.map((d) => (
                    <option key={d.key} value={d.key}>
                      {t(`medicalRecordTypes.${d.key}`)}
                    </option>
                  ))}
                </Select>
                <DatePicker
                  label={t("medicalRecordsAi.fieldRecordDate")}
                  value={form.recordDate}
                  onChange={(v) => setForm({ ...form, recordDate: v })}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label={t("medicalRecordsAi.fieldFacility")}
                  value={form.facility}
                  onChange={(e) => setForm({ ...form, facility: e.target.value })}
                  placeholder="e.g. Apollo Hospital"
                />
                <Input
                  label={t("medicalRecordsAi.fieldPhysician")}
                  value={form.physician}
                  onChange={(e) => setForm({ ...form, physician: e.target.value })}
                  placeholder="e.g. Dr. Sharma"
                />
              </div>

              {meta && meta.lowConfidenceFields.length > 0 && (
                <p className="text-xs text-warning-600 dark:text-warning-400">
                  {t("medicalRecordsAi.verify")}
                </p>
              )}

              {members.length > 0 && (
                <Select
                  label={t("medicalRecordsAi.forMember")}
                  value={form.familyMemberId}
                  onChange={(e) => setForm({ ...form, familyMemberId: e.target.value })}
                >
                  <option value="">{t("medicalRecordsAi.self")}</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="mt-2 flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? t("medicalRecordsAi.saving") : t("medicalRecordsAi.save")}
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
          setPhase("review");
          setForm((f) => ({ ...f, recordDate: today() }));
        }}
        onAllow={grantConsent}
        loading={grantingConsent}
      />
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  CircleSlash,
  Pencil,
  Pill,
  Plus,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { useNotification } from "@/frontend/components/providers/NotificationContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Modal } from "@/frontend/components/ui/Modal";
import { Input, Textarea, Select } from "@/frontend/components/ui/Field";
import type {
  Medicine,
  MedicineFormValues,
  MedicineSource,
  Paginated
} from "@/backend/features/medicines/medicine.types";

const EMPTY_FORM: MedicineFormValues = {
  name: "",
  genericName: "",
  brandNames: "",
  dosageForms: "",
  commonUsage: "",
  sideEffects: "",
  interactions: "",
  warnings: "",
  contraindications: "",
  notes: "",
  isVerified: true
};

// Comma-separated input <-> string[] for the list monograph fields.
const toList = (raw: string): string[] =>
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
const fromList = (list: string[] | null): string => (list ?? []).join(", ");

const SOURCE_TONE: Record<MedicineSource, "green" | "blue" | "amber"> = {
  seed: "green",
  admin: "blue",
  stub: "amber"
};

export default function AdminMedicinesPage() {
  const { t, formatMessage } = useTranslation();
  const { notify } = useNotification();

  const [page, setPage] = useState<Paginated<Medicine> | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"" | MedicineSource>("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [form, setForm] = useState<MedicineFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pageNum) });
    if (search.trim()) params.set("query", search.trim());
    if (sourceFilter) params.set("source", sourceFilter);
    const res = await apiFetch<Paginated<Medicine>>(`/admin/medicines?${params.toString()}`);
    if (res.success && res.data) setPage(res.data);
    setLoading(false);
  }, [pageNum, search, sourceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(m: Medicine) {
    setEditing(m);
    setForm({
      name: m.name,
      genericName: m.genericName ?? "",
      brandNames: fromList(m.brandNames),
      dosageForms: fromList(m.dosageForms),
      commonUsage: m.commonUsage ?? "",
      sideEffects: fromList(m.sideEffects),
      interactions: fromList(m.interactions),
      warnings: fromList(m.warnings),
      contraindications: fromList(m.contraindications),
      notes: m.notes ?? "",
      isVerified: m.isVerified
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setFormError(t("admin.medicines.fieldName"));
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      name: form.name.trim(),
      genericName: form.genericName.trim() || null,
      brandNames: toList(form.brandNames),
      dosageForms: toList(form.dosageForms),
      commonUsage: form.commonUsage.trim() || null,
      sideEffects: toList(form.sideEffects),
      interactions: toList(form.interactions),
      warnings: toList(form.warnings),
      contraindications: toList(form.contraindications),
      notes: form.notes.trim() || null,
      isVerified: form.isVerified
    };
    const res = editing
      ? await apiFetch(`/admin/medicines/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
      : await apiFetch(`/admin/medicines`, { method: "POST", body: JSON.stringify(payload) });
    setSaving(false);

    if (!res.success) {
      setFormError(res.message || t("common.error"));
      return;
    }
    setModalOpen(false);
    notify({ title: res.message, tone: "success", icon: BadgeCheck });
    load();
  }

  async function toggleVerify(m: Medicine) {
    setBusyId(m.id);
    const res = await apiFetch(`/admin/medicines/${m.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isVerified: !m.isVerified })
    });
    setBusyId(null);
    if (res.success) load();
  }

  async function remove(m: Medicine) {
    if (!window.confirm(t("admin.medicines.deleteConfirm"))) return;
    setBusyId(m.id);
    const res = await apiFetch(`/admin/medicines/${m.id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.success) {
      notify({ title: res.message, tone: "success", icon: Trash2 });
      load();
    }
  }

  async function embed(m: Medicine) {
    setBusyId(m.id);
    const res = await apiFetch(`/admin/medicines/${m.id}/embed`, { method: "POST" });
    setBusyId(null);
    notify(
      res.success
        ? { title: t("admin.medicines.embedded"), tone: "success", icon: Sparkles }
        : { title: res.message || t("admin.medicines.embedDisabled"), tone: "warning" }
    );
    if (res.success) load();
  }

  const rows = page?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("admin.medicines.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("admin.medicines.subtitle")}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" />
          {t("admin.medicines.addBtn")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-9 text-gray-400 dark:text-gray-500"
          />
          <Input
            label={t("admin.medicines.search")}
            value={search}
            onChange={(e) => {
              setPageNum(1);
              setSearch(e.target.value);
            }}
            className="pl-9"
            wrapClassName="mb-0"
          />
        </div>
        <Select
          label={t("admin.medicines.source")}
          value={sourceFilter}
          onChange={(e) => {
            setPageNum(1);
            setSourceFilter(e.target.value as "" | MedicineSource);
          }}
          wrapClassName="mb-0 w-44"
        >
          <option value="">{t("admin.medicines.allSources")}</option>
          <option value="seed">{t("admin.medicines.sourceSeed")}</option>
          <option value="admin">{t("admin.medicines.sourceAdmin")}</option>
          <option value="stub">{t("admin.medicines.sourceStub")}</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Pill}
          title={t("admin.medicines.emptyTitle")}
          description={t("admin.medicines.emptyDescription")}
          action={<Button onClick={openCreate}>{t("admin.medicines.addBtn")}</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((m) => (
            <GlassCard key={m.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-300">
                      <Pill size={16} />
                    </span>
                    <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                      {m.name}
                    </h2>
                  </div>
                  {m.genericName && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{m.genericName}</p>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                  <Badge tone={m.isVerified ? "green" : "amber"}>
                    {m.isVerified ? t("admin.medicines.verified") : t("admin.medicines.unverified")}
                  </Badge>
                  <Badge tone={SOURCE_TONE[m.source]}>
                    {t(`admin.medicines.source${m.source[0].toUpperCase()}${m.source.slice(1)}`)}
                  </Badge>
                </div>
              </div>

              {m.commonUsage && (
                <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {m.commonUsage}
                </p>
              )}

              {m.source === "stub" && (
                <p className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700 dark:border-warning-800 dark:bg-warning-900/30 dark:text-warning-300">
                  {t("admin.medicines.stubNotice")}
                </p>
              )}

              <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                  <Pencil size={14} className="mr-1" />
                  {t("common.edit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === m.id}
                  onClick={() => toggleVerify(m)}
                >
                  {m.isVerified ? (
                    <CircleSlash size={14} className="mr-1" />
                  ) : (
                    <BadgeCheck size={14} className="mr-1" />
                  )}
                  {m.isVerified ? t("admin.medicines.unverify") : t("admin.medicines.verify")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busyId === m.id}
                  onClick={() => embed(m)}
                >
                  <Sparkles size={14} className="mr-1" />
                  {t("admin.medicines.embed")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={busyId === m.id}
                  onClick={() => remove(m)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      {page && page.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={pageNum <= 1}
            onClick={() => setPageNum((n) => Math.max(1, n - 1))}
          >
            {t("admin.medicines.prev")}
          </Button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatMessage("admin.medicines.pageOf", {
              current: page.current_page,
              total: page.last_page
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageNum >= page.last_page}
            onClick={() => setPageNum((n) => n + 1)}
          >
            {t("admin.medicines.next")}
          </Button>
        </div>
      )}

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t("admin.medicines.editTitle") : t("admin.medicines.addTitle")}
        size="max-w-2xl"
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {formError}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("admin.medicines.fieldName")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              wrapClassName="mb-0"
            />
            <Input
              label={t("admin.medicines.fieldGenericName")}
              value={form.genericName}
              onChange={(e) => setForm({ ...form, genericName: e.target.value })}
              wrapClassName="mb-0"
            />
          </div>
          <Input
            label={t("admin.medicines.fieldBrandNames")}
            value={form.brandNames}
            onChange={(e) => setForm({ ...form, brandNames: e.target.value })}
            placeholder={t("admin.medicines.listHint")}
            wrapClassName="mb-0"
          />
          <Input
            label={t("admin.medicines.fieldDosageForms")}
            value={form.dosageForms}
            onChange={(e) => setForm({ ...form, dosageForms: e.target.value })}
            placeholder={t("admin.medicines.listHint")}
            wrapClassName="mb-0"
          />
          <Textarea
            label={t("admin.medicines.fieldCommonUsage")}
            value={form.commonUsage}
            onChange={(e) => setForm({ ...form, commonUsage: e.target.value })}
            wrapClassName="mb-0"
          />
          <Textarea
            label={t("admin.medicines.fieldSideEffects")}
            value={form.sideEffects}
            onChange={(e) => setForm({ ...form, sideEffects: e.target.value })}
            placeholder={t("admin.medicines.listHint")}
            wrapClassName="mb-0"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea
              label={t("admin.medicines.fieldInteractions")}
              value={form.interactions}
              onChange={(e) => setForm({ ...form, interactions: e.target.value })}
              placeholder={t("admin.medicines.listHint")}
              wrapClassName="mb-0"
            />
            <Textarea
              label={t("admin.medicines.fieldWarnings")}
              value={form.warnings}
              onChange={(e) => setForm({ ...form, warnings: e.target.value })}
              placeholder={t("admin.medicines.listHint")}
              wrapClassName="mb-0"
            />
          </div>
          <Textarea
            label={t("admin.medicines.fieldContraindications")}
            value={form.contraindications}
            onChange={(e) => setForm({ ...form, contraindications: e.target.value })}
            placeholder={t("admin.medicines.listHint")}
            wrapClassName="mb-0"
          />
          <Textarea
            label={t("admin.medicines.fieldNotes")}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            wrapClassName="mb-0"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.isVerified}
              onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800"
            />
            {t("admin.medicines.markVerified")}
          </label>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={save} disabled={saving}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Pill, Hospital, Calendar, Plus, Trash2, Search } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type {
  Prescription,
  CreatePrescriptionInput
} from "@/backend/features/prescriptions/prescriptions.types";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { Modal } from "@/frontend/components/ui/Modal";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Input, Textarea, Select } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";
import { MedicineList } from "@/frontend/components/prescriptions/MedicineList";
import { parseMedicines } from "@/backend/features/prescriptions/medicine";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

const EMPTY: CreatePrescriptionInput = {};

export default function PrescriptionsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Prescription[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreatePrescriptionInput>(EMPTY);
  const [medicinesText, setMedicinesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((rx) => {
      const doctor = (rx.doctorName ?? rx.prescribedByName ?? "").toLowerCase();
      const hospital = (rx.hospitalName ?? "").toLowerCase();
      return doctor.includes(q) || hospital.includes(q);
    });
  }, [items, search]);

  async function load() {
    const [rx, fam] = await Promise.all([
      apiFetch<Prescription[]>("/prescriptions"),
      apiFetch<FamilyMember[]>("/family-members")
    ]);
    if (rx.success) setItems(rx.data ?? []);
    if (fam.success) setMembers(fam.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    let medicinesJson: unknown = undefined;
    if (medicinesText.trim()) {
      medicinesJson = medicinesText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((med) => ({ name: med }));
    }
    const res = await apiFetch<Prescription>("/prescriptions", {
      method: "POST",
      body: JSON.stringify({ ...form, medicinesJson })
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Failed to save");
      return;
    }
    setShowForm(false);
    setForm(EMPTY);
    setMedicinesText("");
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this prescription?")) return;
    await apiFetch(`/prescriptions/${id}`, { method: "DELETE" });
    load();
  }

  function openForm() {
    setShowForm(true);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("nav2.prescriptions")}
          </h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {items.length === 0
                ? "No prescriptions yet"
                : `${items.length} prescription${items.length === 1 ? "" : "s"} saved`}
            </p>
          )}
        </div>
        <Button variant="primary" onClick={openForm}>
          <Plus size={16} />
          Add prescription
        </Button>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && items.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={Pill}
            title="No prescriptions yet"
            description="Add prescriptions to keep a record of your medications, diagnoses, and doctor visits."
            action={
              <Button variant="primary" onClick={openForm}>
                <Plus size={16} />
                Add prescription
              </Button>
            }
          />
        </GlassCard>
      )}

      {!loading && items.length > 0 && (
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            aria-label="Search by doctor or clinic"
            placeholder="Search by doctor or clinic"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {!loading && items.length > 0 && filteredItems.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No prescriptions match your search.
        </p>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="flex flex-col gap-4">
          {filteredItems.map((rx) => {
            const medicineCount = parseMedicines(rx.medicinesJson).length;
            const displayName = rx.doctorName ?? rx.prescribedByName;
            return (
              <GlassCard
                key={rx.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewRx(rx)}
                onKeyDown={(e) => e.key === "Enter" && setViewRx(rx)}
                className="flex cursor-pointer flex-col gap-4 transition-colors hover:border-primary-300 dark:hover:border-primary-700"
              >
                {/* Card header */}
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                    <Pill size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {displayName ? `Dr. ${displayName}` : "Doctor not specified"}
                      </p>
                      {rx.prescribedByName && <Badge tone="blue">In-app prescription</Badge>}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {rx.hospitalName && (
                        <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                          <Hospital size={14} />
                          {rx.hospitalName}
                        </span>
                      )}
                      {rx.hospitalName && rx.visitDate && (
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                      )}
                      {rx.visitDate && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(rx.visitDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      )}
                      {medicineCount > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span>
                            {medicineCount} medicine{medicineCount === 1 ? "" : "s"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {!rx.prescribedByName && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rx.id);
                      }}
                      aria-label="Delete prescription"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Prescription">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">
            Record a doctor visit and medicines prescribed
          </p>

          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {error}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Doctor name"
              value={form.doctorName ?? ""}
              onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
              placeholder="e.g. Dr. Mehta"
            />
            <DatePicker
              label="Visit date"
              value={form.visitDate ?? ""}
              onChange={(v) => setForm({ ...form, visitDate: v })}
            />
          </div>

          <Input
            label="Hospital / clinic name"
            value={form.hospitalName ?? ""}
            onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
            placeholder="e.g. Apollo Hospital"
          />

          <Input
            label="Diagnosis"
            value={form.diagnosis ?? ""}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
            placeholder="e.g. Viral fever"
          />

          <Textarea
            label="Medicines (one per line)"
            value={medicinesText}
            onChange={(e) => setMedicinesText(e.target.value)}
            placeholder={"Paracetamol 500mg\nAmoxicillin 250mg"}
          />

          {members.length > 0 && (
            <Select
              label="For family member (optional)"
              value={form.familyMemberId ?? ""}
              onChange={(e) => setForm({ ...form, familyMemberId: e.target.value || undefined })}
            >
              <option value="">— self —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          )}

          <div className="mt-1 flex gap-3">
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? t("common.loading") : "Save prescription"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(viewRx)}
        onClose={() => setViewRx(null)}
        title={
          viewRx
            ? (viewRx.doctorName ?? viewRx.prescribedByName)
              ? `Dr. ${viewRx.doctorName ?? viewRx.prescribedByName}`
              : "Prescription details"
            : undefined
        }
        size="max-w-2xl"
      >
        {viewRx && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {viewRx.prescribedByName && <Badge tone="blue">In-app prescription</Badge>}
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {viewRx.hospitalName && (
                  <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <Hospital size={14} />
                    {viewRx.hospitalName}
                  </span>
                )}
                {viewRx.hospitalName && viewRx.visitDate && (
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                )}
                {viewRx.visitDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(viewRx.visitDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                )}
              </div>
            </div>

            <MedicineList medicinesJson={viewRx.medicinesJson} />

            {viewRx.diagnosis && (
              <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                <span className="flex-shrink-0 pt-0.5 text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Diagnosis
                </span>
                <span className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                  {viewRx.diagnosis}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

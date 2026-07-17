"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ClipboardPlus,
  Hospital,
  Calendar,
  Plus,
  Search,
  UserPlus,
  Pencil,
  Trash2
} from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type {
  CreatePrescriptionForPatientInput,
  Prescription
} from "@/backend/features/prescriptions/prescriptions.types";
import type { DoctorSideConnection } from "@/backend/features/connections/connections.types";
import type { DailyVisit } from "@/backend/features/daily-visits/daily-visits.types";
import type { DoctorProfile } from "@/backend/features/doctors/doctors.types";
import type { Medicine } from "@/backend/features/prescriptions/medicine";
import { DEFAULT_DOSES, parseMedicines } from "@/backend/features/prescriptions/medicine";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { Modal } from "@/frontend/components/ui/Modal";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Input, Textarea } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";
import { MedicineEditor } from "@/frontend/components/prescriptions/MedicineEditor";
import { MedicineList } from "@/frontend/components/prescriptions/MedicineList";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

type PrescriptionFormFields = Pick<
  CreatePrescriptionForPatientInput,
  "hospitalName" | "visitDate" | "diagnosis"
>;

const EMPTY_FORM: PrescriptionFormFields = {};
const todayIso = () => new Date().toISOString().slice(0, 10);

export default function DoctorPrescriptionsPage() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<DoctorSideConnection[]>([]);
  const [queue, setQueue] = useState<DailyVisit[]>([]);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const [queueSearch, setQueueSearch] = useState("");
  const [showAddToQueue, setShowAddToQueue] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [addingPatientId, setAddingPatientId] = useState<string | null>(null);

  const [viewVisit, setViewVisit] = useState<DailyVisit | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [activeVisit, setActiveVisit] = useState<DailyVisit | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PrescriptionFormFields>(EMPTY_FORM);
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: "", doses: [...DEFAULT_DOSES] }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(date: string): Promise<DailyVisit[]> {
    const [connections, visits, doctorProfile] = await Promise.all([
      apiFetch<DoctorSideConnection[]>("/doctor/patients"),
      apiFetch<DailyVisit[]>(`/doctor/daily-visits?date=${date}`),
      apiFetch<DoctorProfile>("/doctor/profile")
    ]);
    if (connections.success) setPatients(connections.data ?? []);
    if (visits.success) setQueue(visits.data ?? []);
    if (doctorProfile.success) setProfile(doctorProfile.data ?? null);
    setLoading(false);
    return visits.data ?? [];
  }

  useEffect(() => {
    load(selectedDate);
  }, [selectedDate]);

  const filteredQueue = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter(
      (v) => v.patientName.toLowerCase().includes(q) || String(v.tokenNumber).includes(q)
    );
  }, [queue, queueSearch]);

  const queuedPatientIds = useMemo(() => new Set(queue.map((v) => v.patientId)), [queue]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) => p.patientName.toLowerCase().includes(q) || p.patientPhone.includes(q)
    );
  }, [patients, patientSearch]);

  async function handleAddToQueue(patientId: string, alsoPrescribe: boolean) {
    setAddingPatientId(patientId);
    const res = await apiFetch<DailyVisit>("/doctor/daily-visits", {
      method: "POST",
      body: JSON.stringify({ patientId, date: selectedDate })
    });
    setAddingPatientId(null);
    if (res.success && res.data) {
      const visit = res.data;
      setQueue((prev) => {
        const next = prev.some((v) => v.id === visit.id)
          ? prev.map((v) => (v.id === visit.id ? visit : v))
          : [...prev, visit];
        return next.sort((a, b) => a.tokenNumber - b.tokenNumber);
      });
      setShowAddToQueue(false);
      if (alsoPrescribe) openNewPrescriptionForm(visit);
    }
  }

  function openNewPrescriptionForm(visit: DailyVisit) {
    setActiveVisit(visit);
    setEditingId(null);
    setForm({ hospitalName: profile?.clinicName ?? "", visitDate: selectedDate });
    setMedicines([{ name: "", doses: [...DEFAULT_DOSES] }]);
    setError(null);
    setShowForm(true);
  }

  function openEditPrescriptionForm(visit: DailyVisit, rx: Prescription) {
    setActiveVisit(visit);
    setEditingId(rx.id);
    setForm({
      hospitalName: rx.hospitalName ?? "",
      visitDate: rx.visitDate ? new Date(rx.visitDate).toISOString().slice(0, 10) : selectedDate,
      diagnosis: rx.diagnosis ?? ""
    });
    setMedicines(parseMedicines(rx.medicinesJson));
    setError(null);
    setViewVisit(null);
    setShowForm(true);
  }

  function handleBoxClick(visit: DailyVisit) {
    setDeleteError(null);
    if (visit.prescriptions.length > 0) {
      setViewVisit(visit);
    } else {
      openNewPrescriptionForm(visit);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeVisit) return;
    setSaving(true);
    setError(null);
    const medicinesJson = medicines.filter((m) => m.name.trim());
    const payload = {
      hospitalName: form.hospitalName,
      visitDate: form.visitDate ? new Date(form.visitDate).toISOString() : undefined,
      diagnosis: form.diagnosis,
      medicinesJson
    };

    const res = editingId
      ? await apiFetch<Prescription>(`/doctor/prescriptions/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
      : await apiFetch<Prescription>("/doctor/prescriptions", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            patientId: activeVisit.patientId,
            dailyVisitId: activeVisit.id
          })
        });

    setSaving(false);
    if (!res.success) {
      setError(res.message || "Failed to save");
      return;
    }

    setShowForm(false);
    const updatedQueue = await load(selectedDate);
    const updatedVisit = updatedQueue.find((v) => v.id === activeVisit.id);
    setViewVisit(updatedVisit ?? null);
    setActiveVisit(null);
    setEditingId(null);
  }

  async function handleDeletePrescription(visit: DailyVisit, rx: Prescription) {
    if (!confirm("Delete this prescription?")) return;
    setDeleteError(null);
    const res = await apiFetch(`/doctor/prescriptions/${rx.id}`, { method: "DELETE" });
    if (!res.success) {
      setDeleteError(res.message || "Failed to delete");
      return;
    }
    const updatedQueue = await load(selectedDate);
    const updatedVisit = updatedQueue.find((v) => v.id === visit.id);
    setViewVisit(updatedVisit ?? null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("doctor.prescriptions.title")}
          </h1>
        </div>
        <DatePicker
          aria-label={t("doctor.prescriptions.date")}
          value={selectedDate}
          onChange={setSelectedDate}
          className="w-44"
        />
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && patients.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={ClipboardPlus}
            title={t("doctor.prescriptions.noPatientsTitle")}
            description={t("doctor.prescriptions.noPatientsDescription")}
          />
        </GlassCard>
      )}

      {!loading && patients.length > 0 && (
        <GlassCard className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {t("doctor.prescriptions.patientList")}
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <Input
                  aria-label={t("doctor.prescriptions.searchQueue")}
                  placeholder={t("doctor.prescriptions.searchQueue")}
                  className="pl-8"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                />
              </div>
              <Button variant="primary" size="sm" onClick={() => setShowAddToQueue(true)}>
                <UserPlus size={16} /> {t("doctor.prescriptions.addPatient")}
              </Button>
            </div>
          </div>

          {queue.length === 0 && (
            <EmptyState
              icon={UserPlus}
              title={t("doctor.prescriptions.noQueueTitle")}
              description={t("doctor.prescriptions.noQueueDescription")}
            />
          )}

          {queue.length > 0 && (
            <div className="flex flex-col gap-2">
              {filteredQueue.map((visit) => {
                const prescribed = visit.prescriptions.length > 0;
                const medNames = visit.prescriptions
                  .flatMap((rx) => parseMedicines(rx.medicinesJson).map((m) => m.name))
                  .join(", ");
                return (
                  <div
                    key={visit.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleBoxClick(visit)}
                    onKeyDown={(e) => e.key === "Enter" && handleBoxClick(visit)}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-primary-300 dark:border-gray-700 dark:hover:border-primary-700"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge tone={prescribed ? "green" : "blue"}>
                        {t("doctor.prescriptions.token")} #{visit.tokenNumber}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {visit.patientName}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {prescribed ? medNames : visit.patientPhone}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openNewPrescriptionForm(visit);
                      }}
                    >
                      {t("doctor.prescriptions.prescribe")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Add patient to the selected day's list */}
      <Modal
        open={showAddToQueue}
        onClose={() => setShowAddToQueue(false)}
        title={t("doctor.prescriptions.addPatient")}
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              aria-label={t("doctor.prescriptions.searchPatients")}
              placeholder={t("doctor.prescriptions.searchPatients")}
              className="pl-8"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
            {filteredPatients.map((p) => {
              const alreadyQueued = queuedPatientIds.has(p.patientId);
              const isBusy = addingPatientId === p.patientId;
              return (
                <div
                  key={p.patientId}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{p.patientName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.patientPhone}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={alreadyQueued ? "ghost" : "outline"}
                      disabled={alreadyQueued || isBusy}
                      onClick={() => handleAddToQueue(p.patientId, false)}
                    >
                      <Plus size={14} /> {t("doctor.prescriptions.addToList")}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isBusy}
                      onClick={() => handleAddToQueue(p.patientId, true)}
                    >
                      {t("doctor.prescriptions.prescribe")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* View a patient's prescriptions for the selected day */}
      <Modal
        open={Boolean(viewVisit)}
        onClose={() => setViewVisit(null)}
        title={
          viewVisit
            ? `${viewVisit.patientName} · ${t("doctor.prescriptions.token")} #${viewVisit.tokenNumber}`
            : undefined
        }
        size="max-w-2xl"
      >
        {viewVisit && (
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => openNewPrescriptionForm(viewVisit)}
            >
              <Plus size={16} /> {t("doctor.prescriptions.newPrescription")}
            </Button>

            {deleteError && (
              <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
                {deleteError}
              </p>
            )}

            {viewVisit.prescriptions.map((rx) => (
              <GlassCard key={rx.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {rx.hospitalName && (
                      <span className="inline-flex items-center gap-1">
                        <Hospital size={12} /> {rx.hospitalName}
                      </span>
                    )}
                    {rx.visitDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />{" "}
                        {new Date(rx.visitDate).toLocaleDateString("en-IN", {
                          dateStyle: "medium"
                        })}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditPrescriptionForm(viewVisit, rx)}
                    >
                      <Pencil size={14} /> {t("common.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeletePrescription(viewVisit, rx)}
                      aria-label="Delete prescription"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <MedicineList medicinesJson={rx.medicinesJson} />
                {rx.diagnosis && (
                  <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
                    {rx.diagnosis}
                  </p>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </Modal>

      {/* Prescribe / edit */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={
          editingId
            ? t("doctor.prescriptions.editPrescription")
            : t("doctor.prescriptions.newPrescription")
        }
        size="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {error}
            </p>
          )}

          {activeVisit && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-2.5 text-sm dark:bg-gray-800/60">
              <Badge tone="blue">
                {t("doctor.prescriptions.token")} #{activeVisit.tokenNumber}
              </Badge>
              <span className="font-medium text-gray-900 dark:text-white">
                {activeVisit.patientName}
              </span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t("doctor.prescriptions.hospitalName")}
              value={form.hospitalName ?? ""}
              onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
            />
            <DatePicker
              label={t("doctor.prescriptions.visitDate")}
              value={form.visitDate?.slice(0, 10) ?? ""}
              onChange={(v) => setForm({ ...form, visitDate: v })}
            />
          </div>

          <MedicineEditor medicines={medicines} onChange={setMedicines} />

          <Textarea
            label={t("doctor.prescriptions.diagnosis")}
            value={form.diagnosis ?? ""}
            onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
          />

          <div className="mt-1 flex gap-3">
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? t("common.loading") : t("common.save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

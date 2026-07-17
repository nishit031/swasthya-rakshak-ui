"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Users, XCircle } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type { DoctorSideConnection } from "@/backend/features/connections/connections.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge, type BadgeTone } from "@/frontend/components/ui/Badge";
import { Modal } from "@/frontend/components/ui/Modal";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Input } from "@/frontend/components/ui/Field";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

const STATUS_TONE: Record<DoctorSideConnection["status"], BadgeTone> = {
  pending: "amber",
  accepted: "green",
  rejected: "red"
};

export default function PatientsPage() {
  const { t } = useTranslation();
  const [connections, setConnections] = useState<DoctorSideConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await apiFetch<DoctorSideConnection[]>("/connections");
    if (res.success) setConnections(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await apiFetch<DoctorSideConnection>("/connections", {
      method: "POST",
      body: JSON.stringify({ patientPhone: phone })
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Failed to send request");
      return;
    }
    setShowForm(false);
    setPhone("");
    load();
  }

  const accepted = connections.filter((c) => c.status === "accepted");
  const pending = connections.filter((c) => c.status === "pending");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("nav2.myPatients")}
          </h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {accepted.length} connected · {pending.length} pending
            </p>
          )}
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowForm(true);
            setError(null);
          }}
        >
          <Plus size={16} /> {t("doctor.patients.addByPhone")}
        </Button>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && connections.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={Users}
            title={t("doctor.patients.emptyTitle")}
            description={t("doctor.patients.emptyDescription")}
            action={
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> {t("doctor.patients.addByPhone")}
              </Button>
            }
          />
        </GlassCard>
      )}

      {!loading && connections.length > 0 && (
        <div className="flex flex-col gap-3">
          {connections.map((c) => (
            <GlassCard key={c.id} className="flex items-center gap-4">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {c.patientName.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{c.patientName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.patientPhone}</p>
              </div>
              <Badge tone={STATUS_TONE[c.status]}>
                {c.status === "pending" && <Clock size={12} className="mr-1" />}
                {c.status === "rejected" && <XCircle size={12} className="mr-1" />}
                {t(`doctor.patients.status.${c.status}`)}
              </Badge>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={t("doctor.patients.addByPhone")}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("doctor.patients.addDescription")}
          </p>

          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {error}
            </p>
          )}

          <Input
            label={t("auth.register.phone")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={10}
            placeholder="10-digit mobile number"
          />

          <div className="mt-1 flex gap-3">
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? t("common.loading") : t("doctor.patients.sendRequest")}
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

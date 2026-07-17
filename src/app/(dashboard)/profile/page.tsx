"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Droplet, Smartphone, Sparkles, Stethoscope } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type {
  MealTimings,
  UserProfile,
  UpdateProfileInput
} from "@/backend/features/users/users.types";
import type { AuthUser } from "@/backend/features/auth/auth.types";
import type {
  DoctorProfile,
  UpdateDoctorProfileInput
} from "@/backend/features/doctors/doctors.types";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { Input, Select } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "other", "prefer not to say"];
const MEAL_TIMING_FIELDS: { key: keyof MealTimings; label: string }[] = [
  { key: "wakeUp", label: "Wake-up" },
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "highTea", label: "High tea" },
  { key: "dinner", label: "Dinner" },
  { key: "bedtime", label: "Bedtime" }
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDoctor, setIsDoctor] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateProfileInput>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);

  useEffect(() => {
    apiFetch<AuthUser>("/auth/me").then((res) => {
      if (res.success && res.data) setIsDoctor(res.data.role === "doctor");
    });
    apiFetch<UserProfile>("/users/profile").then((res) => {
      if (res.success && res.data) {
        setProfile(res.data);
        setForm({
          fullName: res.data.fullName,
          dateOfBirth: res.data.dateOfBirth
            ? new Date(res.data.dateOfBirth).toISOString().split("T")[0]
            : undefined,
          gender: res.data.gender ?? undefined,
          bloodGroup: res.data.bloodGroup ?? undefined,
          mealTimings: res.data.mealTimings ?? undefined
        });
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    const res = await apiFetch<UserProfile>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify(form)
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Could not save profile");
    } else {
      setProfile(res.data!);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  // AI consent is a single immediate toggle (not part of the edit form) — grant or revoke on click.
  async function toggleConsent() {
    if (!profile) return;
    setConsentSaving(true);
    setError(null);
    const res = await apiFetch<UserProfile>("/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ aiConsent: !profile.aiConsent })
    });
    setConsentSaving(false);
    if (res.success && res.data) setProfile(res.data);
    else setError(res.message || t("common.error"));
  }

  if (!profile)
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>;

  const initials = getInitials(profile.fullName);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      {/* Header */}
      <GlassCard className="flex items-center gap-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-2xl font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold text-gray-900 dark:text-white">
            {profile.fullName}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Smartphone size={14} /> {profile.phone}
          </p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} variant="primary">
            {t("common.edit")}
          </Button>
        )}
      </GlassCard>

      {success && (
        <p className="flex items-center gap-2 rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/30 dark:text-success-300">
          <CheckCircle2 size={16} /> Profile saved successfully.
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          {error}
        </p>
      )}

      {!editing ? (
        <GlassCard>
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
            Personal Information
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <InfoRow label="Full name" value={profile.fullName} />
            <InfoRow label="Mobile number" value={profile.phone} />
            <InfoRow
              label="Date of birth"
              value={
                profile.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })
                  : "—"
              }
            />
            <InfoRow
              label="Gender"
              value={
                profile.gender
                  ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)
                  : "—"
              }
            />
            <InfoRow
              label="Blood group"
              value={profile.bloodGroup ?? "—"}
              icon={
                profile.bloodGroup ? <Droplet size={14} className="text-error-500" /> : undefined
              }
              accent={!!profile.bloodGroup}
            />
          </div>
        </GlassCard>
      ) : null}

      {!editing && (
        <GlassCard>
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
            <Clock size={16} className="text-primary-600 dark:text-primary-400" />
            Daily Routine
          </h2>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Used to time your medicine reminders around your own meal schedule.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {MEAL_TIMING_FIELDS.map(({ key, label }) => (
              <InfoRow key={key} label={label} value={profile.mealTimings?.[key] ?? "Not set"} />
            ))}
          </div>
        </GlassCard>
      )}

      {!editing && (
        <GlassCard>
          <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
            <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
            {t("aiConsent.sectionTitle")}
          </h2>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            {t("aiConsent.sectionDesc")}
          </p>
          <div className="flex items-center justify-between gap-3">
            <Badge tone={profile.aiConsent ? "green" : "gray"}>
              {profile.aiConsent ? t("aiConsent.enabled") : t("aiConsent.disabled")}
            </Badge>
            <Button
              variant={profile.aiConsent ? "outline" : "primary"}
              size="sm"
              onClick={toggleConsent}
              disabled={consentSaving}
            >
              {consentSaving
                ? t("common.loading")
                : profile.aiConsent
                  ? t("aiConsent.revoke")
                  : t("aiConsent.enable")}
            </Button>
          </div>
        </GlassCard>
      )}

      {editing && (
        <GlassCard>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
                Edit Profile
              </h2>
            </div>
            <Input
              label="Full name"
              value={form.fullName ?? ""}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
            <Input
              label="Mobile number"
              value={profile.phone}
              disabled
              className="bg-gray-100 text-gray-500 dark:bg-gray-800"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <DatePicker
                label="Date of birth"
                value={form.dateOfBirth ?? ""}
                onChange={(v) => setForm({ ...form, dateOfBirth: v })}
                max={new Date().toISOString().slice(0, 10)}
              />
              <Select
                label="Blood group"
                value={form.bloodGroup ?? ""}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              >
                <option value="">— select —</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              label="Gender"
              value={form.gender ?? ""}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">— select —</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </Select>

            <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                <Clock size={15} className="text-primary-600 dark:text-primary-400" />
                Daily Routine
              </h3>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                Optional — used to time your medicine reminders around your own meal schedule.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {MEAL_TIMING_FIELDS.map(({ key, label }) => (
                  <Input
                    key={key}
                    label={label}
                    type="time"
                    value={form.mealTimings?.[key] ?? ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mealTimings: { ...form.mealTimings, [key]: e.target.value || undefined }
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : t("common.save")}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {isDoctor && !editing && <DoctorProfileSection />}
    </div>
  );
}

function DoctorProfileSection() {
  const { t } = useTranslation();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpdateDoctorProfileInput>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<DoctorProfile>("/doctor/profile").then((res) => {
      if (res.success && res.data) {
        setDoctorProfile(res.data);
        setForm({
          specialization: res.data.specialization ?? undefined,
          licenseNumber: res.data.licenseNumber ?? undefined,
          clinicName: res.data.clinicName ?? undefined
        });
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch<DoctorProfile>("/doctor/profile", {
      method: "PATCH",
      body: JSON.stringify(form)
    });
    setSaving(false);
    if (res.success && res.data) {
      setDoctorProfile(res.data);
      setEditing(false);
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-100">
          <Stethoscope size={18} className="text-primary-600 dark:text-primary-400" />
          {t("doctor.profile.heading")}
        </h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            {t("common.edit")}
          </Button>
        )}
      </div>

      {!editing ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <InfoRow
            label={t("doctor.profile.specialization")}
            value={doctorProfile?.specialization ?? "—"}
          />
          <InfoRow
            label={t("doctor.profile.licenseNumber")}
            value={doctorProfile?.licenseNumber ?? "—"}
          />
          <InfoRow
            label={t("doctor.profile.clinicName")}
            value={doctorProfile?.clinicName ?? "—"}
          />
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <Input
            label={t("doctor.profile.specialization")}
            value={form.specialization ?? ""}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
          />
          <Input
            label={t("doctor.profile.licenseNumber")}
            value={form.licenseNumber ?? ""}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
          />
          <Input
            label={t("doctor.profile.clinicName")}
            value={form.clinicName ?? ""}
            onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
          />
          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving}>
              {saving ? t("common.loading") : t("common.save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      )}
    </GlassCard>
  );
}

function InfoRow({
  label,
  value,
  icon,
  accent
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span
        className={`flex items-center gap-1.5 text-[15px] font-medium ${accent ? "text-error-600 dark:text-error-400" : "text-gray-900 dark:text-gray-100"}`}
      >
        {icon} {value}
      </span>
    </div>
  );
}

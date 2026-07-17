"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Cake, VenusAndMars, Droplet, Pencil, Trash2, UserPlus, Lock } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { useEntitlements } from "@/frontend/components/providers/EntitlementsContext";
import type {
  FamilyMember,
  CreateFamilyMemberInput,
  UpdateFamilyMemberInput
} from "@/backend/features/family-members/family-members.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { Input, Select } from "@/frontend/components/ui/Field";
import { DatePicker } from "@/frontend/components/ui/DatePicker";
import { Modal } from "@/frontend/components/ui/Modal";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "other"];
const RELATIONSHIPS = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "grandparent",
  "grandchild",
  "other"
];

const EMPTY_FORM: CreateFamilyMemberInput = { name: "", relationship: "" };

// Gradient + badge tone per relationship — used for the initials avatar and the relationship pill.
const REL_CONFIG: Record<
  string,
  { gradient: string; tone: "blue" | "green" | "amber" | "red" | "gray" }
> = {
  spouse: { gradient: "from-error-500 to-error-600", tone: "red" },
  child: { gradient: "from-success-500 to-success-600", tone: "green" },
  parent: { gradient: "from-primary-500 to-primary-600", tone: "blue" },
  sibling: { gradient: "from-warning-500 to-warning-600", tone: "amber" },
  grandparent: { gradient: "from-gray-500 to-gray-600", tone: "gray" },
  grandchild: { gradient: "from-success-500 to-success-600", tone: "green" },
  other: { gradient: "from-gray-500 to-gray-600", tone: "gray" }
};

function getAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  )
    age--;
  return `${age} yrs`;
}

export default function FamilyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { hasFeature } = useEntitlements();
  const canManageFamily = hasFeature("manage_family_members");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateFamilyMemberInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await apiFetch<FamilyMember[]>("/family-members");
    if (res.success) setMembers(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openAdd() {
    if (!canManageFamily) {
      router.push("/pricing");
      return;
    }
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(m: FamilyMember) {
    setEditingId(m.id);
    setForm({
      name: m.name,
      relationship: m.relationship,
      dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth).toISOString().split("T")[0] : undefined,
      gender: m.gender ?? undefined,
      bloodGroup: m.bloodGroup ?? undefined
    });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = editingId
      ? await apiFetch<FamilyMember>(`/family-members/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form as UpdateFamilyMemberInput)
        })
      : await apiFetch<FamilyMember>("/family-members", {
          method: "POST",
          body: JSON.stringify(form)
        });
    setSaving(false);
    if (!res.success) {
      setError(res.message || "Failed to save");
      return;
    }
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this family member?")) return;
    await apiFetch(`/family-members/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("nav2.family")}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {members.length === 0
                ? "No members yet"
                : `${members.length} ${members.length === 1 ? "member" : "members"} tracked`}
            </p>
          )}
        </div>
        <Button variant="primary" onClick={openAdd}>
          {canManageFamily ? <UserPlus size={16} /> : <Lock size={16} />} {t("nav2.add")}
        </Button>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && members.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={Users}
            title="No family members yet"
            description="Add a family member to track their health records alongside yours."
            action={
              <Button variant="primary" onClick={openAdd}>
                <UserPlus size={16} /> {t("nav2.add")}
              </Button>
            }
          />
        </GlassCard>
      )}

      {!loading && members.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const rel = REL_CONFIG[m.relationship] ?? REL_CONFIG.other;
            return (
              <GlassCard key={m.id} hover className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${rel.gradient} text-lg font-bold text-white`}
                    aria-hidden
                  >
                    {m.name[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                      {m.name}
                    </p>
                    <Badge tone={rel.tone} className="mt-1 capitalize">
                      {m.relationship}
                    </Badge>
                  </div>
                </div>

                {(m.gender || m.bloodGroup || m.dateOfBirth) && (
                  <div className="flex flex-wrap gap-2">
                    {m.dateOfBirth && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <Cake size={13} /> {getAge(new Date(m.dateOfBirth).toISOString())}
                      </span>
                    )}
                    {m.gender && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs capitalize text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        <VenusAndMars size={13} /> {m.gender}
                      </span>
                    )}
                    {m.bloodGroup && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-error-200 bg-error-50 px-2.5 py-1 text-xs font-medium text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
                        <Droplet size={13} /> {m.bloodGroup}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil size={16} /> {t("common.edit")}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 size={16} /> {t("common.delete")}
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? "Edit member" : "Add family member"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">
            Personal health profile for a dependent or relative
          </p>

          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {error}
            </p>
          )}

          <Input
            label="Full name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="e.g. Priya Chauhan"
          />

          <Select
            label="Relationship *"
            value={form.relationship}
            onChange={(e) => setForm({ ...form, relationship: e.target.value })}
            required
          >
            <option value="">— select relationship —</option>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </Select>

          <div className="grid gap-4 sm:grid-cols-2">
            <DatePicker
              label="Date of birth"
              value={form.dateOfBirth ?? ""}
              onChange={(v) => setForm({ ...form, dateOfBirth: v })}
              max={new Date().toISOString().slice(0, 10)}
            />
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
          </div>

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

          <div className="mt-2 flex gap-3">
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? "Saving…" : editingId ? "Save changes" : "Add member"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

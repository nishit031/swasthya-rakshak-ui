"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Search, ShieldOff, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { startImpersonation } from "@/backend/features/admin/impersonation.client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { Input } from "@/frontend/components/ui/Field";
import type {
  AdminUserDetail,
  AdminUserSummary,
  ImpersonationResult
} from "@/backend/features/admin/admin.types";

export default function AdminUsersPage() {
  const router = useRouter();
  const { t, formatMessage } = useTranslation();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);

  async function load() {
    setLoading(true);
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await apiFetch<AdminUserSummary[]>(`/admin/users${query}`);
    if (res.success) setUsers(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    const res = await apiFetch<AdminUserDetail>(`/admin/users/${id}`);
    if (res.success) setDetail(res.data ?? null);
  }

  async function suspend(id: string) {
    await apiFetch(`/admin/users/${id}/suspend`, { method: "POST" });
    load();
  }

  async function reactivate(id: string) {
    await apiFetch(`/admin/users/${id}/reactivate`, { method: "POST" });
    load();
  }

  async function impersonate(id: string) {
    const res = await apiFetch<ImpersonationResult>(`/admin/users/${id}/impersonate`, {
      method: "POST"
    });
    if (!res.success || !res.data) return;
    startImpersonation(res.data.accessToken);
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("admin.nav.users")}</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-2"
        >
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.users.search")}
            wrapClassName="mb-0 w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            <Search size={16} />
          </Button>
        </form>
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && (
        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <GlassCard key={user.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{user.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="gray" className="capitalize">
                    {user.role}
                  </Badge>
                  <Badge tone={user.suspendedAt ? "red" : "green"}>
                    {user.suspendedAt ? t("admin.users.suspended") : t("admin.users.active")}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
                <Button variant="ghost" size="sm" onClick={() => toggleExpand(user.id)}>
                  {t("common.showMore")}
                </Button>
                {user.role !== "admin" && (
                  <>
                    {user.suspendedAt ? (
                      <Button variant="outline" size="sm" onClick={() => reactivate(user.id)}>
                        <ShieldCheck size={16} /> {t("admin.users.reactivate")}
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => suspend(user.id)}>
                        <ShieldOff size={16} /> {t("admin.users.suspend")}
                      </Button>
                    )}
                    <Button variant="primary" size="sm" onClick={() => impersonate(user.id)}>
                      <Eye size={16} /> {t("admin.users.impersonate")}
                    </Button>
                  </>
                )}
              </div>

              {expandedId === user.id && detail && (
                <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                  <p>
                    {formatMessage("admin.users.counts", {
                      records: detail.counts.medicalRecords,
                      labs: detail.counts.labReports,
                      prescriptions: detail.counts.prescriptions,
                      family: detail.counts.familyMembers
                    })}
                  </p>
                  <p className="mt-1 capitalize">
                    Plan: {detail.subscription.planCode} ({detail.subscription.status})
                  </p>
                  <p className="mt-2 italic text-warning-600 dark:text-warning-400">
                    {t("admin.users.impersonateNotice")}
                  </p>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

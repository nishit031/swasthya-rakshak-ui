"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Badge } from "@/frontend/components/ui/Badge";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Field";
import type { SubscriptionPlan } from "@/backend/features/subscription/subscription.types";

export default function AdminPlansPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await apiFetch<SubscriptionPlan[]>("/admin/plans");
    if (res.success) setPlans(res.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(plan: SubscriptionPlan) {
    setEditingId(plan.id);
    setPriceInput(String(Math.round(plan.unitPriceInPaise / 100)));
  }

  async function savePrice(id: string) {
    const rupees = Number(priceInput);
    if (!Number.isFinite(rupees) || rupees < 0) return;
    await apiFetch(`/admin/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ unitPriceInPaise: Math.round(rupees * 100) })
    });
    setEditingId(null);
    load();
  }

  async function toggleActive(plan: SubscriptionPlan) {
    await apiFetch(`/admin/plans/${plan.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !plan.isActive })
    });
    load();
  }

  if (loading)
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("admin.nav.plans")}</h1>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <GlassCard key={plan.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {t(`subscription.plans.${plan.code}.name`)}
              </h2>
              <Badge tone={plan.isActive ? "green" : "gray"}>
                {plan.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {editingId === plan.id ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  wrapClassName="mb-0 flex-1"
                />
                <Button size="sm" onClick={() => savePrice(plan.id)}>
                  {t("common.save")}
                </Button>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{Math.round(plan.unitPriceInPaise / 100)}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  {plan.perMember ? t("subscription.perMemberMonth") : t("subscription.perMonth")}
                </span>
              </p>
            )}

            <div className="flex gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={() => startEdit(plan)}>
                {t("common.edit")}
              </Button>
              {plan.code !== "free" && (
                <Button variant="ghost" size="sm" onClick={() => toggleActive(plan)}>
                  {plan.isActive ? "Deactivate" : "Activate"}
                </Button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

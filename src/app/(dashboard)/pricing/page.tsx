"use client";

import { useEffect, useState } from "react";
import { Check, Gift, User, Users } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { useEntitlements } from "@/frontend/components/providers/EntitlementsContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { cn } from "@/frontend/components/ui/cn";
import type {
  SubscriptionPlan,
  CheckoutResult
} from "@/backend/features/subscription/subscription.types";

const PLAN_ICON: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  free: Gift,
  individual: User,
  family: Users
};

function formatRupees(paise: number): string {
  return `₹${Math.round(paise / 100)}`;
}

export default function PricingPage() {
  const { t, formatMessage } = useTranslation();
  const { entitlements, refresh } = useEntitlements();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<SubscriptionPlan[]>("/subscription/plans").then((res) => {
      if (res.success) setPlans(res.data ?? []);
      setLoading(false);
    });
  }, []);

  async function subscribe(planCode: string) {
    setBusyPlan(planCode);
    setError(null);
    setSuccess(null);

    const checkout = await apiFetch<CheckoutResult>("/subscription/checkout", {
      method: "POST",
      body: JSON.stringify({ planCode })
    });
    if (!checkout.success || !checkout.data) {
      setError(checkout.message || t("subscription.checkoutFailed"));
      setBusyPlan(null);
      return;
    }

    // Mock gateway auto-approves — a real gateway (e.g. Razorpay) would collect payment
    // in a checkout widget here before this confirm call.
    const confirm = await apiFetch("/subscription/confirm", {
      method: "POST",
      body: JSON.stringify({ orderId: checkout.data.orderId })
    });
    setBusyPlan(null);

    if (!confirm.success) {
      setError(confirm.message || t("subscription.checkoutFailed"));
      return;
    }

    setSuccess(t("subscription.checkoutSuccess"));
    await refresh();
  }

  async function cancelPlan() {
    if (!confirm(t("subscription.cancelConfirm"))) return;
    const res = await apiFetch("/subscription/cancel", { method: "POST" });
    if (res.success) await refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("subscription.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subscription.subtitle")}
        </p>
      </div>

      <p className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
        {t("subscription.mockNotice")}
      </p>

      {error && (
        <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-800 dark:bg-success-900/30 dark:text-success-300">
          {success}
        </p>
      )}

      {entitlements.planCode !== "free" && (
        <GlassCard className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("subscription.currentPlan")}
            </p>
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {t(`subscription.plans.${entitlements.planCode}.name`)}
            </p>
            {entitlements.periodEnd && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formatMessage("subscription.renewsOn", {
                  date: new Date(entitlements.periodEnd).toLocaleDateString()
                })}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={cancelPlan}>
            {t("subscription.cancel")}
          </Button>
        </GlassCard>
      )}

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = PLAN_ICON[plan.code] ?? Gift;
            const isCurrent = entitlements.planCode === plan.code;
            const isFamily = plan.code === "family";
            return (
              <GlassCard
                key={plan.code}
                hover
                className={cn(
                  "relative flex flex-col gap-4",
                  isFamily && "border-2 border-primary-400 dark:border-primary-500"
                )}
              >
                {isFamily && (
                  <Badge tone="blue" className="absolute -top-3 right-4">
                    {t("subscription.mostPopular")}
                  </Badge>
                )}

                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      {t(`subscription.plans.${plan.code}.name`)}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(`subscription.plans.${plan.code}.tagline`)}
                    </p>
                  </div>
                </div>

                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatRupees(plan.unitPriceInPaise)}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    {plan.perMember
                      ? t("subscription.perMemberMonth")
                      : plan.unitPriceInPaise > 0
                        ? t("subscription.perMonth")
                        : ""}
                  </span>
                </p>

                <ul className="flex flex-1 flex-col gap-2">
                  {plan.featuresJson.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <Check
                        size={16}
                        className="mt-0.5 flex-shrink-0 text-success-600 dark:text-success-400"
                      />
                      {t(`subscription.features.${feature}`)}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isFamily ? "primary" : "outline"}
                  className="w-full"
                  disabled={isCurrent || plan.code === "free" || busyPlan !== null}
                  onClick={() => subscribe(plan.code)}
                >
                  {isCurrent
                    ? t("subscription.manage")
                    : busyPlan === plan.code
                      ? t("common.loading")
                      : plan.code === "free"
                        ? t(`subscription.plans.free.cta`)
                        : entitlements.planCode === "free"
                          ? t("subscription.subscribe")
                          : t("subscription.switchPlan")}
                </Button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

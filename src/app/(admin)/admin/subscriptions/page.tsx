"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Badge } from "@/frontend/components/ui/Badge";
import { Button } from "@/frontend/components/ui/Button";
import type { AdminPaymentRow, AdminSubscriptionRow } from "@/backend/features/admin/admin.types";

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "gray"> = {
  active: "green",
  trialing: "green",
  past_due: "amber",
  canceled: "gray",
  expired: "red",
  paid: "green",
  created: "amber",
  failed: "red",
  refunded: "gray"
};

export default function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [subsRes, paysRes] = await Promise.all([
      apiFetch<AdminSubscriptionRow[]>("/admin/subscriptions"),
      apiFetch<AdminPaymentRow[]>("/admin/payments")
    ]);
    if (subsRes.success) setSubscriptions(subsRes.data ?? []);
    if (paysRes.success) setPayments(paysRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function cancelSubscription(id: string) {
    await apiFetch(`/admin/subscriptions/${id}/cancel`, { method: "POST" });
    load();
  }

  async function refund(paymentId: string) {
    await apiFetch(`/admin/payments/${paymentId}/refund`, { method: "POST" });
    load();
  }

  if (loading)
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {t("admin.nav.subscriptions")}
      </h1>

      <GlassCard className="overflow-x-auto">
        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          {t("admin.nav.subscriptions")}
        </h2>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
              <th className="pb-2">User</th>
              <th className="pb-2">Plan</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Members</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => (
              <tr key={sub.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2">
                  <p className="font-medium text-gray-900 dark:text-white">{sub.user?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sub.user?.phone}</p>
                </td>
                <td className="py-2 capitalize">{sub.planCode}</td>
                <td className="py-2">
                  <Badge tone={STATUS_TONE[sub.status] ?? "gray"}>{sub.status}</Badge>
                </td>
                <td className="py-2">{sub.memberCount}</td>
                <td className="py-2 text-right">
                  {sub.status === "active" && (
                    <Button variant="outline" size="sm" onClick={() => cancelSubscription(sub.id)}>
                      {t("subscription.cancel")}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      <GlassCard className="overflow-x-auto">
        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          {t("admin.nav.payments")}
        </h2>
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
              <th className="pb-2">User</th>
              <th className="pb-2">Plan</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Status</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {payment.user?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{payment.user?.phone}</p>
                </td>
                <td className="py-2 capitalize">{payment.planCode}</td>
                <td className="py-2">{formatRupees(payment.amountInPaise)}</td>
                <td className="py-2">
                  <Badge tone={STATUS_TONE[payment.status] ?? "gray"}>{payment.status}</Badge>
                </td>
                <td className="py-2 text-right">
                  {payment.status === "paid" && (
                    <Button variant="outline" size="sm" onClick={() => refund(payment.id)}>
                      Refund
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

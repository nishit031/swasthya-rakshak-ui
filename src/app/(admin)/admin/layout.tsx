"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import {
  Activity,
  FileClock,
  Heart,
  LayoutDashboard,
  LogOut,
  Pill,
  ShieldAlert,
  Users,
  Wallet,
  type LucideIcon
} from "lucide-react";
import { getAccessToken, clearTokens } from "@/backend/features/auth/auth.client";
import { apiFetch } from "@/backend/lib/api-client";
import type { AuthUser } from "@/backend/features/auth/auth.types";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { cn } from "@/frontend/components/ui/cn";

interface NavItem {
  href: Route;
  label: string;
  icon: LucideIcon;
}

// Admin panel is intentionally its own shell (not the patient dashboard layout) — a
// visibly distinct chrome is part of the PHI-shield story: nothing here shares a page
// with a patient's actual records.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [admin, setAdmin] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    apiFetch<AuthUser>("/auth/me").then((res) => {
      if (!res.success || !res.data || res.data.role !== "admin") {
        router.replace("/dashboard");
        return;
      }
      setAdmin(res.data);
      setChecked(true);
    });
  }, [router]);

  const NAV: NavItem[] = [
    { href: "/admin", label: t("admin.nav.metrics"), icon: LayoutDashboard },
    { href: "/admin/users", label: t("admin.nav.users"), icon: Users },
    { href: "/admin/subscriptions", label: t("admin.nav.subscriptions"), icon: Wallet },
    { href: "/admin/plans", label: t("admin.nav.plans"), icon: Activity },
    { href: "/admin/medicines", label: t("admin.nav.medicines"), icon: Pill },
    { href: "/admin/audit", label: t("admin.nav.audit"), icon: FileClock }
  ];

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearTokens();
      router.push("/");
    }
  }

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-sm text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-950">
      <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2.5 border-b border-gray-800 px-5 py-5">
          <Heart size={22} className="text-primary-400" fill="rgba(14,165,233,0.15)" />
          <span className="text-sm font-bold text-white">Swasthya Rakshak Admin</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-900/40 text-primary-300"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-3">
          <p className="truncate px-3 pb-2 text-xs text-gray-500">{admin?.fullName}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-100"
          >
            <LogOut size={18} />
            {t("nav2.signOut")}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-warning-800 bg-warning-900/40 px-6 py-2 text-xs font-medium text-warning-200">
          <ShieldAlert size={14} /> {t("admin.phiNotice")}
        </div>
        <main className="flex-1 p-6 sm:p-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

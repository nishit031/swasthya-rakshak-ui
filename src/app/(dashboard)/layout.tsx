"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  Bot,
  Calendar,
  ChevronDown,
  ClipboardPlus,
  CreditCard,
  FlaskConical,
  Heart,
  LayoutDashboard,
  LogOut,
  Pill,
  Plus,
  Stethoscope,
  User,
  Users,
  type LucideIcon
} from "lucide-react";
import { getAccessToken, clearTokens } from "@/backend/features/auth/auth.client";
import { apiFetch } from "@/backend/lib/api-client";
import type { AuthUser } from "@/backend/features/auth/auth.types";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { EntitlementsProvider } from "@/frontend/components/providers/EntitlementsContext";
import { ImpersonationBanner } from "@/frontend/components/admin/ImpersonationBanner";
import { ThemeToggle } from "@/frontend/components/ui/ThemeToggle";
import { LanguageToggle } from "@/frontend/components/ui/LanguageToggle";
import { cn } from "@/frontend/components/ui/cn";
import { ReminderWatcher } from "@/frontend/components/reminders/ReminderWatcher";
import { SavedViewsNav } from "@/frontend/components/medical-records/SavedViewsNav";

interface NavItem {
  href: Route;
  labelKey: string;
  icon: LucideIcon;
}

const PATIENT_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "nav2.dashboard", icon: LayoutDashboard },
  { href: "/family", labelKey: "nav2.family", icon: Users },
  { href: "/medical-records", labelKey: "nav2.medicalRecords", icon: Stethoscope },
  { href: "/prescriptions", labelKey: "nav2.prescriptions", icon: Pill },
  { href: "/lab-reports", labelKey: "nav2.labReports", icon: FlaskConical },
  { href: "/reminders", labelKey: "nav2.reminders", icon: Bell },
  { href: "/timeline", labelKey: "nav2.timeline", icon: Calendar },
  { href: "/patient-intelligence", labelKey: "nav2.patientIntel", icon: Activity },
  { href: "/companion", labelKey: "nav2.companion", icon: Bot },
  { href: "/my-doctors", labelKey: "nav2.myDoctors", icon: Stethoscope },
  { href: "/pricing", labelKey: "nav2.billing", icon: CreditCard },
  { href: "/profile", labelKey: "nav2.profile", icon: User }
];

const DOCTOR_NAV: NavItem[] = [
  { href: "/doctor", labelKey: "nav2.dashboard", icon: LayoutDashboard },
  { href: "/patients", labelKey: "nav2.myPatients", icon: Users },
  { href: "/doctor-prescriptions", labelKey: "nav2.prescriptions", icon: ClipboardPlus },
  { href: "/reminders", labelKey: "nav2.reminders", icon: Bell },
  { href: "/profile", labelKey: "nav2.profile", icon: User }
];

const PATIENT_QUICK_ADD: {
  groupKey: string;
  items: { labelKey: string; icon: LucideIcon; href: Route }[];
}[] = [
  {
    groupKey: "features.heading",
    items: [
      { labelKey: "nav2.medicalRecords", icon: Stethoscope, href: "/medical-records" },
      { labelKey: "nav2.prescriptions", icon: Pill, href: "/prescriptions" },
      { labelKey: "nav2.labReports", icon: FlaskConical, href: "/lab-reports" },
      { labelKey: "nav2.reminders", icon: Bell, href: "/reminders" },
      { labelKey: "nav2.family", icon: Users, href: "/family" }
    ]
  }
];

const DOCTOR_QUICK_ADD: {
  groupKey: string;
  items: { labelKey: string; icon: LucideIcon; href: Route }[];
}[] = [
  {
    groupKey: "features.heading",
    items: [
      { labelKey: "nav2.prescriptions", icon: ClipboardPlus, href: "/doctor-prescriptions" },
      { labelKey: "nav2.myPatients", icon: Users, href: "/patients" },
      { labelKey: "nav2.reminders", icon: Bell, href: "/reminders" }
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);

  const loadMe = useCallback(async () => {
    const res = await apiFetch<AuthUser>("/auth/me");
    if (!res.success || !res.data) {
      clearTokens();
      router.replace("/login");
      return;
    }
    setUser(res.data);
  }, [router]);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    loadMe().catch(() => {
      clearTokens();
      router.replace("/login");
    });
  }, [router, loadMe]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node))
        setQuickAddOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearTokens();
      router.push("/");
    }
  }

  const isDoctor = user?.role === "doctor";
  const NAV = isDoctor ? DOCTOR_NAV : PATIENT_NAV;
  const QUICK_ADD = isDoctor ? DOCTOR_QUICK_ADD : PATIENT_QUICK_ADD;
  const currentPage = NAV.find((n) => n.href === pathname);
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <ReminderWatcher />
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Link
          href={isDoctor ? "/doctor" : "/dashboard"}
          className="flex items-center gap-2.5 border-b border-gray-200 px-5 py-5 dark:border-gray-800"
        >
          <Heart
            size={22}
            className="text-primary-600 dark:text-primary-400"
            fill="rgba(14,165,233,0.15)"
          />
          <span className="text-sm font-bold text-gray-900 dark:text-white">स्वास्थ्य रक्षक</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                  )}
                >
                  <Icon size={18} />
                  {t(item.labelKey)}
                </Link>
                {item.href === "/medical-records" && !isDoctor && <SavedViewsNav />}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-3 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <LogOut size={18} />
            {t("nav2.signOut")}
          </button>
        </div>
      </aside>

      {/* Right pane */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ImpersonationBanner />
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-100">
            {currentPage && (
              <>
                <currentPage.icon size={18} className="text-primary-600 dark:text-primary-400" />
                {t(currentPage.labelKey)}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />

            {/* Quick add */}
            <div ref={quickAddRef} className="relative">
              <button
                onClick={() => setQuickAddOpen((v) => !v)}
                className="btn-primary h-9 gap-1.5 px-3 py-0 text-sm"
              >
                <Plus size={16} /> {t("nav2.add")} <ChevronDown size={14} />
              </button>
              {quickAddOpen && (
                <Dropdown>
                  {QUICK_ADD.map((group) => (
                    <div key={group.groupKey}>
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setQuickAddOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                          <item.icon size={16} className="text-gray-400" /> {t(item.labelKey)}
                        </Link>
                      ))}
                    </div>
                  ))}
                </Dropdown>
              )}
            </div>

            <Link
              href="/reminders"
              title={t("nav2.reminders")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <Bell size={18} />
            </Link>

            {/* Profile */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white py-0 pl-1 pr-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100 sm:inline">
                  {user?.fullName}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              {profileOpen && (
                <Dropdown width="w-56">
                  {user && (
                    <>
                      <div className="flex items-center gap-3 bg-gray-50 px-4 py-3 dark:bg-gray-800/60">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                          {initials}
                        </span>
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                            {user.fullName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.phone}</p>
                        </div>
                      </div>
                      <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />
                    </>
                  )}
                  <DropdownLink href="/profile" icon={User} onClick={() => setProfileOpen(false)}>
                    {t("nav2.viewProfile")}
                  </DropdownLink>
                  {!isDoctor && (
                    <DropdownLink
                      href="/timeline"
                      icon={Calendar}
                      onClick={() => setProfileOpen(false)}
                    >
                      {t("nav2.healthTimeline")}
                    </DropdownLink>
                  )}
                  <div className="my-1 h-px bg-gray-200 dark:bg-gray-800" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-error-600 hover:bg-gray-50 dark:text-error-400 dark:hover:bg-gray-800"
                  >
                    <LogOut size={16} /> {t("nav2.signOut")}
                  </button>
                </Dropdown>
              )}
            </div>
          </div>
        </header>

        <EntitlementsProvider entitlements={user?.subscription} onRefresh={loadMe}>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 p-6 sm:p-8"
          >
            {children}
          </motion.main>
        </EntitlementsProvider>
      </div>
    </div>
  );
}

function Dropdown({ children, width = "w-60" }: { children: React.ReactNode; width?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "absolute right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-900",
        width
      )}
    >
      {children}
    </motion.div>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  onClick,
  children
}: {
  href: Route;
  icon: LucideIcon;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      <Icon size={16} className="text-gray-400" /> {children}
    </Link>
  );
}

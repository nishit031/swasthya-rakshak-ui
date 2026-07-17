"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  Bell,
  Calendar,
  FileText,
  FlaskConical,
  Hospital,
  Pill,
  Syringe,
  Users,
  type LucideIcon
} from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import type { MedicalRecord } from "@/backend/features/medical-records/medical-records.types";
import type { Prescription } from "@/backend/features/prescriptions/prescriptions.types";
import type { LabReport } from "@/backend/features/lab-reports/lab-reports.types";
import type { Reminder } from "@/backend/features/reminders/reminders.types";
import type { TimelineEvent } from "@/backend/features/timeline/timeline.types";
import type { AuthUser } from "@/backend/features/auth/auth.types";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { StatCard } from "@/frontend/components/ui/StatCard";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Badge } from "@/frontend/components/ui/Badge";
import { cn } from "@/frontend/components/ui/cn";

interface DashboardData {
  family: number;
  medicalRecords: number;
  prescriptions: number;
  labReports: number;
  upcomingReminders: Reminder[];
  recentActivity: TimelineEvent[];
  user: AuthUser | null;
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  medical_record: FileText,
  prescription: Pill,
  lab_report: FlaskConical,
  reminder: Bell
};

const REMINDER_TYPE_ICONS: Record<string, LucideIcon> = {
  medication: Pill,
  appointment: Hospital,
  test: FlaskConical,
  vaccination: Syringe,
  other: Bell
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<FamilyMember[]>("/family-members"),
      apiFetch<MedicalRecord[]>("/medical-records"),
      apiFetch<Prescription[]>("/prescriptions"),
      apiFetch<LabReport[]>("/lab-reports"),
      apiFetch<Reminder[]>("/reminders"),
      apiFetch<TimelineEvent[]>("/timeline"),
      apiFetch<AuthUser>("/auth/me")
    ])
      .then(([family, records, rx, labs, reminders, timeline, userRes]) => {
        const now = new Date();
        const upcoming = (reminders.data ?? [])
          .filter((r) => r.status === "active" && new Date(r.scheduledAt) >= now)
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .slice(0, 5);

        const recentActivity = (timeline.data ?? [])
          .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
          .slice(0, 4);

        setData({
          family: (family.data ?? []).length,
          medicalRecords: (records.data ?? []).length,
          prescriptions: (rx.data ?? []).length,
          labReports: (labs.data ?? []).length,
          upcomingReminders: upcoming,
          recentActivity,
          user: userRes.success ? (userRes.data ?? null) : null
        });
      })
      .catch(() => setError(t("common.error")));
  }, [t]);

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greetingMorning");
    if (h < 17) return t("dashboard.greetingAfternoon");
    return t("dashboard.greetingEvening");
  }

  const firstName = data?.user?.fullName?.split(" ")[0] ?? "there";

  const STAT_CARDS = data
    ? ([
        {
          icon: FileText,
          tone: "primary",
          value: data.medicalRecords,
          label: t("nav2.medicalRecords"),
          href: "/medical-records"
        },
        {
          icon: Pill,
          tone: "success",
          value: data.prescriptions,
          label: t("nav2.prescriptions"),
          href: "/prescriptions"
        },
        {
          icon: FlaskConical,
          tone: "secondary",
          value: data.labReports,
          label: t("nav2.labReports"),
          href: "/lab-reports"
        },
        {
          icon: Users,
          tone: "accent",
          value: data.family,
          label: t("nav2.family"),
          href: "/family"
        }
      ] as const)
    : [];

  const QUICK_ACTIONS: { icon: LucideIcon; label: string; href: Route; cls: string }[] = [
    {
      icon: FileText,
      label: t("nav2.medicalRecords"),
      href: "/medical-records",
      cls: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
    },
    {
      icon: Pill,
      label: t("nav2.prescriptions"),
      href: "/prescriptions",
      cls: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300"
    },
    {
      icon: FlaskConical,
      label: t("nav2.labReports"),
      href: "/lab-reports",
      cls: "bg-secondary-50 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-300"
    },
    {
      icon: Bell,
      label: t("nav2.reminders"),
      href: "/reminders",
      cls: "bg-warning-50 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300"
    },
    {
      icon: Users,
      label: t("nav2.family"),
      href: "/family",
      cls: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
    }
  ];

  if (error)
    return (
      <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
        {error}
      </p>
    );
  if (!data)
    return <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <GlassCard className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold leading-none text-primary-600 dark:text-primary-400">
              {data.upcomingReminders.length}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("dashboard.upcoming")}
            </p>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="text-center">
            <p className="text-2xl font-bold leading-none text-secondary-600 dark:text-secondary-400">
              {data.medicalRecords + data.prescriptions + data.labReports}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {t("dashboard.healthRecords")}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((c) => (
          <StatCard
            key={c.href}
            icon={c.icon}
            tone={c.tone}
            value={c.value}
            label={c.label}
            href={c.href}
          />
        ))}
      </div>

      {/* Quick actions */}
      <GlassCard>
        <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
          {t("dashboard.quickActions")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5",
                a.cls
              )}
            >
              <a.icon size={16} /> {a.label}
            </Link>
          ))}
        </div>
      </GlassCard>

      {/* Reminders + activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {t("dashboard.upcomingReminders")}
            </h2>
            <Link
              href="/reminders"
              className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {t("dashboard.viewAll")} →
            </Link>
          </div>
          {data.upcomingReminders.length === 0 ? (
            <div className="py-6 text-center">
              <Bell size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("dashboard.noReminders")}
              </p>
              <Link
                href="/reminders"
                className="mt-1 inline-block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
              >
                {t("dashboard.setReminder")} →
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.upcomingReminders.map((r) => {
                const date = new Date(r.scheduledAt);
                const isToday = new Date().toDateString() === date.toDateString();
                const Icon = REMINDER_TYPE_ICONS[r.reminderType] ?? Bell;
                return (
                  <li key={r.id} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {r.title}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {isToday ? (
                          <Badge tone="green">{t("dashboard.today")}</Badge>
                        ) : (
                          <span>
                            {date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        )}
                        · {date.toLocaleTimeString("en-IN", { timeStyle: "short" })} ·{" "}
                        <span className="capitalize text-primary-600 dark:text-primary-400">
                          {r.reminderType}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              {t("dashboard.recentActivity")}
            </h2>
            <Link
              href="/timeline"
              className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {t("dashboard.fullTimeline")} →
            </Link>
          </div>
          {data.recentActivity.length === 0 ? (
            <div className="py-6 text-center">
              <Calendar size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("dashboard.noActivity")}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t("dashboard.activityHint")}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.recentActivity.map((e) => {
                const Icon = ACTIVITY_ICONS[e.referenceType ?? ""] ?? Calendar;
                return (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                        {e.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(e.eventDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}{" "}
                        · <span className="capitalize">{e.eventType.replace(/_/g, " ")}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

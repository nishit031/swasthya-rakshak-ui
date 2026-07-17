"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Pill,
  FlaskConical,
  Bell,
  Calendar,
  Pin,
  ChevronDown,
  User2,
  Building2,
  type LucideIcon
} from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type { TimelineEvent } from "@/backend/features/timeline/timeline.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Badge, type BadgeTone } from "@/frontend/components/ui/Badge";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

const EVENT_CONFIG: Record<
  string,
  { icon: LucideIcon; chip: string; tone: BadgeTone; label: string }
> = {
  medical_record: {
    icon: FileText,
    chip: "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300",
    tone: "blue",
    label: "Medical Record"
  },
  prescription: {
    icon: Pill,
    chip: "bg-success-100 text-success-600 dark:bg-success-900/40 dark:text-success-300",
    tone: "green",
    label: "Prescription"
  },
  lab_report: {
    icon: FlaskConical,
    chip: "bg-error-100 text-error-600 dark:bg-error-900/40 dark:text-error-300",
    tone: "red",
    label: "Lab Report"
  },
  reminder: {
    icon: Bell,
    chip: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
    tone: "amber",
    label: "Reminder"
  }
};

const FALLBACK_CONFIG = {
  icon: Pin,
  chip: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  tone: "gray" as BadgeTone,
  label: "Event"
};

// A day-group's events are further split into "same hospitalization/visit" sections when more
// than one facility appears that day — same-facility events on the same day are grouped together,
// events with no facility fall into their own "Other" bucket.
function groupByFacility(events: TimelineEvent[]): [string | null, TimelineEvent[]][] {
  const order: (string | null)[] = [];
  const map = new Map<string | null, TimelineEvent[]>();
  for (const e of events) {
    const key = e.facility;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(e);
  }
  return order.map((key) => [key, map.get(key)!]);
}

function groupByDate(events: TimelineEvent[]): [string, TimelineEvent[]][] {
  const map = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const key = new Date(e.eventDate).toLocaleDateString("en-IN", { dateStyle: "long" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

// Long same-day histories collapse behind a "show more" toggle rather than dumping every event.
const COLLAPSE_THRESHOLD = 5;

export default function TimelinePage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    apiFetch<TimelineEvent[]>("/timeline").then((res) => {
      if (res.success) {
        const sorted = (res.data ?? []).sort(
          (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );
        setEvents(sorted);
      }
      setLoading(false);
    });
  }, []);

  const grouped = useMemo(() => groupByDate(events), [events]);

  function toggleDay(day: string) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("nav2.timeline")}</h1>
          {!loading && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {events.length === 0
                ? "No events yet"
                : `${events.length} health event${events.length === 1 ? "" : "s"} recorded`}
            </p>
          )}
        </div>
        {/* Legend */}
        {events.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(EVENT_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded ${cfg.chip}`}>
                    <Icon size={12} />
                  </span>
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && events.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={Calendar}
            title="Your health timeline is empty"
            description="Events appear here automatically as you add medical records, prescriptions, and lab reports."
          />
        </GlassCard>
      )}

      {!loading && grouped.length > 0 && (
        <div className="flex flex-col gap-8">
          {grouped.map(([day, dayEvents]) => {
            const expanded = expandedDays.has(day);
            const shown =
              !expanded && dayEvents.length > COLLAPSE_THRESHOLD
                ? dayEvents.slice(0, COLLAPSE_THRESHOLD)
                : dayEvents;
            const facilityGroups = groupByFacility(shown);
            const hasMultipleFacilities = facilityGroups.length > 1;

            return (
              <div key={day}>
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary-500"
                    aria-hidden
                  />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{day}</p>
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="ml-1 flex flex-col gap-4 border-l-2 border-gray-200 pl-6 dark:border-gray-800">
                  {facilityGroups.map(([facility, facilityEvents]) => (
                    <div key={facility ?? "none"} className="flex flex-col gap-3">
                      {hasMultipleFacilities && facility && (
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                          <Building2 size={12} />
                          {facility}
                        </span>
                      )}
                      {facilityEvents.map((e) => {
                        const cfg = EVENT_CONFIG[e.referenceType ?? ""] ?? FALLBACK_CONFIG;
                        const Icon = cfg.icon;
                        return (
                          <GlassCard key={e.id} hover className="flex items-start gap-3 p-4">
                            <span
                              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${cfg.chip}`}
                              aria-hidden
                            >
                              <Icon size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-start justify-between gap-2">
                                <p className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">
                                  {e.title}
                                </p>
                                <Badge tone={cfg.tone}>{cfg.label}</Badge>
                              </div>
                              {e.description && (
                                <p className="mb-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                  {e.description}
                                </p>
                              )}
                              {e.tags.length > 0 && (
                                <div className="mb-1.5 flex flex-wrap gap-1.5">
                                  {e.tags.map((tag, idx) => (
                                    <Badge key={idx} tone={tag.tone}>
                                      {tag.labelKey ? t(tag.labelKey) : tag.label}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>
                                  {new Date(e.eventDate).toLocaleTimeString("en-IN", {
                                    timeStyle: "short"
                                  })}
                                </span>
                                {e.physician && (
                                  <span className="flex items-center gap-1">
                                    <User2 size={12} />
                                    {e.physician}
                                  </span>
                                )}
                              </div>
                            </div>
                          </GlassCard>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {dayEvents.length > COLLAPSE_THRESHOLD && (
                  <button
                    type="button"
                    onClick={() => toggleDay(day)}
                    className="ml-7 mt-2 flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <ChevronDown
                      size={14}
                      className={
                        expanded ? "rotate-180 transition-transform" : "transition-transform"
                      }
                    />
                    {expanded
                      ? t("common.showLess")
                      : `${t("common.showMore")} (${dayEvents.length - COLLAPSE_THRESHOLD})`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

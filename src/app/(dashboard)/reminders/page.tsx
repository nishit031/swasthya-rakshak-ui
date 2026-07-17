"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Plus,
  Trash2,
  ClipboardPlus,
  BellRing,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import type { Reminder, CreateReminderInput } from "@/backend/features/reminders/reminders.types";
import {
  TONE_CHIP,
  TONE_BORDER,
  typeConfig,
  getRelative
} from "@/backend/features/reminders/reminder-ui";
import {
  acknowledgeOccurrence,
  classifyReminder,
  currentDueOccurrence,
  loadAcknowledgedKeys,
  nextOccurrence,
  type ReminderBucket
} from "@/backend/features/reminders/reminder-schedule";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { Modal } from "@/frontend/components/ui/Modal";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Input, Select } from "@/frontend/components/ui/Field";
import { DateTimePicker } from "@/frontend/components/ui/DateTimePicker";
import { cn } from "@/frontend/components/ui/cn";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

const TYPES = ["medication", "appointment", "test", "vaccination", "other"];
const REPEATS = ["none", "daily", "weekly", "monthly"];

const EMPTY: CreateReminderInput = { title: "", reminderType: "", scheduledAt: "" };
const PAGE_SIZE = 7;

export default function RemindersPage() {
  const { t, formatMessage } = useTranslation();
  const [items, setItems] = useState<Reminder[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateReminderInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReminderBucket>("active");
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  // Each of the three tabs pages independently, so switching tabs doesn't reset your place.
  const [page, setPage] = useState<Record<ReminderBucket, number>>({
    active: 1,
    upcoming: 1,
    completed: 1
  });

  async function load() {
    const [rem, fam] = await Promise.all([
      apiFetch<Reminder[]>("/reminders"),
      apiFetch<FamilyMember[]>("/family-members")
    ]);
    if (rem.success) setItems(rem.data ?? []);
    if (fam.success) setMembers(fam.data ?? []);
    setAcknowledged(loadAcknowledgedKeys());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // DateTimePicker's date half is a button, not a native form control, so the browser can't
    // enforce `required` on it the way it could for the old native datetime-local input — check
    // explicitly instead (an empty scheduledAt would otherwise crash new Date("").toISOString()).
    if (!form.scheduledAt) {
      setError("Date & time is required");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await apiFetch<Reminder>("/reminders", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString()
      })
    });
    setSaving(false);
    if (!res.success) {
      const detail = res.errors?.length ? `: ${res.errors.join(", ")}` : "";
      setError(`${res.message || "Failed to save"}${detail}`);
      return;
    }
    setShowForm(false);
    setForm(EMPTY);
    load();
  }

  async function markDone(id: string) {
    await apiFetch(`/reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "done" })
    });
    load();
  }

  // Keeps the reminder Active and snoozes it for a retry (server-tracked, max 2) — the
  // SQS-DLQ-style redrive from the popup's Dismiss action, also offered here on the page.
  async function dismissReminder(id: string) {
    await apiFetch(`/reminders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ dismiss: true })
    });
    load();
  }

  // Acknowledges just the currently-due occurrence of a recurring reminder (moves it from
  // Active to Upcoming) without ending the recurring schedule — same action the toast's
  // "Taken"/"Dismiss" buttons perform.
  function acknowledge(reminder: Reminder, occurrenceISO: string) {
    acknowledgeOccurrence(reminder.id, occurrenceISO);
    setAcknowledged(loadAcknowledgedKeys());
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this reminder?")) return;
    await apiFetch(`/reminders/${id}`, { method: "DELETE" });
    load();
  }

  function openForm() {
    setShowForm(true);
    setError(null);
  }

  const now = new Date();
  const filtered = items
    .filter((r) => classifyReminder(r, now, acknowledged) === filter)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  // Clamp instead of storing directly, so a page that's emptied out by an action (e.g. the last
  // item on page 3 gets marked done) falls back to a valid page without an extra effect/render.
  const currentPage = Math.min(page[filter], totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(bucket: ReminderBucket, target: number) {
    setPage((prev) => ({ ...prev, [bucket]: Math.min(Math.max(target, 1), totalPages) }));
  }

  // Reserve the tallest the card list has ever rendered (i.e. a full page of PAGE_SIZE cards) so
  // a short last page doesn't let the pagination bar slide up. Measured, not hardcoded, so it's
  // correct regardless of card height, wrapping, font, or zoom — and grow-only, so a short page
  // keeps the height a full page established. All three tabs share the card layout, so one
  // reservation serves every filter.
  const listRef = useRef<HTMLDivElement>(null);
  const [reservedHeight, setReservedHeight] = useState(0);
  useEffect(() => {
    if (!listRef.current) return;
    setReservedHeight((h) => Math.max(h, listRef.current!.scrollHeight));
  }, [paginated, filter]);

  const activeCount = items.filter(
    (r) => classifyReminder(r, now, acknowledged) === "active"
  ).length;

  const TABS: { key: ReminderBucket; label: string }[] = [
    { key: "active", label: t("reminders.tabs.active") },
    { key: "upcoming", label: t("reminders.tabs.upcoming") },
    { key: "completed", label: t("reminders.tabs.completed") }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("nav2.reminders")}
          </h1>
          {!loading && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {activeCount > 0
                ? formatMessage("reminders.activeCount", { n: activeCount })
                : t("reminders.allCaughtUp")}{" "}
              · {items.length} total
            </p>
          )}
        </div>
        <Button variant="primary" onClick={openForm}>
          <Plus size={16} />
          Add reminder
        </Button>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm transition-colors",
              filter === key
                ? "border-primary-500 font-semibold text-primary-600 dark:text-primary-300"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {label}
            {key === "active" && activeCount > 0 && !loading && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && filtered.length === 0 && (
        <GlassCard>
          <EmptyState
            icon={Bell}
            title={t(`reminders.empty.${filter}.title`)}
            description={t(`reminders.empty.${filter}.description`)}
            action={
              filter !== "completed" ? (
                <Button variant="primary" onClick={openForm}>
                  <Plus size={16} />
                  Add reminder
                </Button>
              ) : undefined
            }
          />
        </GlassCard>
      )}

      {!loading && filtered.length > 0 && (
        <div
          className="flex flex-col"
          style={totalPages > 1 && reservedHeight ? { minHeight: reservedHeight } : undefined}
        >
          <div ref={listRef} className="flex flex-col gap-3">
            {paginated.map((r) => {
              const done = r.status === "done";
              const bucket = classifyReminder(r, now, acknowledged);
              const tc = typeConfig(r.reminderType);
              const Icon = tc.icon;
              // Prescription-generated reminders are system-managed: locked (no edit/delete/early
              // complete) until due, then only completable — never deletable.
              const isRx = !!r.prescriptionId;
              const isRecurring = !!r.repeatType && r.repeatType !== "none";
              // For a recurring reminder the stored scheduledAt is only the first occurrence;
              // show the badge/next-time relative to the upcoming occurrence instead.
              const next = !done
                ? nextOccurrence(
                    new Date(r.scheduledAt),
                    r.repeatType,
                    now,
                    r.courseEndDate ? new Date(r.courseEndDate) : null
                  )
                : null;
              const rel = next ? getRelative(next.toISOString()) : null;
              // Only a recurring reminder needs the "acknowledge today's dose without ending the
              // series" flow; a non-recurring due reminder (any one-time manual reminder, and every
              // prescription instance now that each dose is its own row) is simply marked done.
              const dueOccurrence =
                bucket === "active" && isRecurring
                  ? currentDueOccurrence(
                      new Date(r.scheduledAt),
                      r.repeatType,
                      now,
                      r.courseEndDate ? new Date(r.courseEndDate) : null
                    )
                  : null;
              return (
                <GlassCard
                  key={r.id}
                  className={cn(
                    "flex items-center gap-4 border-l-4 !py-4",
                    TONE_BORDER[tc.tone],
                    done && "opacity-60"
                  )}
                >
                  {/* Type icon */}
                  <span
                    className={cn(
                      "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                      TONE_CHIP[tc.tone]
                    )}
                  >
                    <Icon size={16} />
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "font-semibold text-gray-900 dark:text-white",
                          done && "line-through"
                        )}
                      >
                        {r.title}
                      </p>
                      {bucket === "active" && (
                        <Badge tone="amber">
                          <BellRing size={12} className="mr-1" />
                          {t("reminders.tabs.active")}
                        </Badge>
                      )}
                      {rel && <Badge tone={rel.tone}>{rel.label}</Badge>}
                      {done && (
                        <Badge tone="green">
                          <Check size={12} className="mr-1" />
                          Done
                        </Badge>
                      )}
                      {r.prescriptionId && (
                        <Badge tone="blue">
                          <ClipboardPlus size={12} className="mr-1" />
                          From prescription
                        </Badge>
                      )}
                    </div>
                    <p className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{r.reminderType}</span>
                      {r.repeatType && r.repeatType !== "none" && (
                        <span>
                          · repeats {r.repeatType}
                          {r.courseEndDate &&
                            ` till ${new Date(r.courseEndDate).toLocaleDateString("en-IN", {
                              dateStyle: "medium"
                            })}`}
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        Created at{" "}
                        {new Date(r.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })}
                      </span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 gap-2">
                    {dueOccurrence && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => acknowledge(r, dueOccurrence.toISOString())}
                        title={t("reminders.acknowledge")}
                        aria-label={t("reminders.acknowledge")}
                      >
                        <Check size={16} />
                      </Button>
                    )}
                    {!done && !dueOccurrence && (!isRx || bucket === "active") && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => markDone(r.id)}
                        title="Mark as done"
                        aria-label="Mark as done"
                      >
                        <Check size={16} />
                      </Button>
                    )}
                    {/* Dismiss keeps a due prescription reminder Active and snoozes a server-tracked
                      retry (max 2, 5 min apart) instead of completing it — never silently done. */}
                    {isRx && bucket === "active" && !done && !dueOccurrence && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dismissReminder(r.id)}
                        title="Dismiss (retry in 5 min)"
                        aria-label="Dismiss"
                      >
                        <X size={16} />
                      </Button>
                    )}
                    {!isRx && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                        aria-label="Delete reminder"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatMessage("reminders.pagination.pageOf", {
                  page: currentPage,
                  total: totalPages
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-24 justify-center"
                  onClick={() => goToPage(filter, currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label={t("reminders.pagination.previous")}
                >
                  <ChevronLeft size={16} />
                  {t("reminders.pagination.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-w-24 justify-center"
                  onClick={() => goToPage(filter, currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label={t("reminders.pagination.next")}
                >
                  {t("reminders.pagination.next")}
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Reminder">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="-mt-2 text-sm text-gray-500 dark:text-gray-400">
            Set an alert for medications, appointments, and more
          </p>

          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300">
              {error}
            </p>
          )}

          <Input
            label="Title *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            placeholder="e.g. Take Metformin after dinner"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type *"
              value={form.reminderType}
              onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
              required
            >
              <option value="">— select —</option>
              {TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {ty.charAt(0).toUpperCase() + ty.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              label="Repeat"
              value={form.repeatType ?? "none"}
              onChange={(e) => setForm({ ...form, repeatType: e.target.value })}
            >
              {REPEATS.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          <DateTimePicker
            label="Date & time *"
            value={form.scheduledAt}
            onChange={(v) => setForm({ ...form, scheduledAt: v })}
            required
          />

          {members.length > 0 && (
            <Select
              label="For family member (optional)"
              value={form.familyMemberId ?? ""}
              onChange={(e) => setForm({ ...form, familyMemberId: e.target.value || undefined })}
            >
              <option value="">— self —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          )}

          <div className="mt-1 flex gap-3">
            <Button type="submit" variant="primary" disabled={saving} className="flex-1">
              {saving ? t("common.loading") : "Set reminder"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

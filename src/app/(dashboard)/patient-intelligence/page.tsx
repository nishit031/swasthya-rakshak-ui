"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  FlaskConical,
  Link2,
  Lightbulb,
  Pill,
  Scan,
  Stethoscope,
  Syringe,
  Users
} from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { useEntitlements } from "@/frontend/components/providers/EntitlementsContext";
import { PlanGate } from "@/frontend/components/subscription/PlanGate";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { StatCard } from "@/frontend/components/ui/StatCard";
import { Badge } from "@/frontend/components/ui/Badge";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Select } from "@/frontend/components/ui/Field";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import type {
  PatientProfile,
  Provenance
} from "@/backend/features/patient-intelligence/patient-intelligence.types";

function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  const { t } = useTranslation();
  if (provenance === "ai_summary") return null;
  return (
    <Badge tone={provenance === "fact" ? "blue" : "amber"} className="ml-2">
      {t(`patientIntel.provenance.${provenance}`)}
    </Badge>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children
}: {
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
          <Icon size={16} />
        </span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </GlassCard>
  );
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

export default function PatientIntelligencePage() {
  const { t, formatMessage } = useTranslation();
  const { hasFeature } = useEntitlements();
  const hasHealthTrends = hasFeature("health_trends");
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<FamilyMember[]>("/family-members").then((res) => {
      if (res.success) setMembers(res.data ?? []);
    });
  }, []);

  useEffect(() => {
    if (!hasHealthTrends) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const query = familyMemberId ? `?familyMemberId=${familyMemberId}` : "";
    apiFetch<PatientProfile>(`/patient-intelligence/profile${query}`).then((res) => {
      if (res.success) setProfile(res.data ?? null);
      setLoading(false);
    });
  }, [familyMemberId, hasHealthTrends]);

  if (!hasHealthTrends) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("patientIntel.title")}
        </h1>
        <PlanGate
          feature="health_trends"
          requiredPlanLabel={t("subscription.plans.individual.name")}
        >
          <></>
        </PlanGate>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("patientIntel.title")}
          </h1>
          {profile && !loading && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatMessage("patientIntel.subtitle", {
                n: profile.recordCount,
                unprocessed: profile.unprocessedCount
              })}
            </p>
          )}
        </div>
        {members.length > 0 && (
          <Select
            value={familyMemberId}
            onChange={(e) => setFamilyMemberId(e.target.value)}
            wrapClassName="mb-0 w-56"
          >
            <option value="">{t("patientIntel.familyMemberAny")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && profile && profile.recordCount === 0 && (
        <GlassCard>
          <EmptyState
            icon={Activity}
            title={t("patientIntel.empty.title")}
            description={t("patientIntel.empty.description")}
          />
        </GlassCard>
      )}

      {!loading && profile && profile.recordCount > 0 && (
        <>
          {/* Health Overview */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              tone="primary"
              value={profile.recordCount}
              label={t("patientIntel.stats.records")}
            />
            <StatCard
              icon={Stethoscope}
              tone="error"
              value={profile.conditions.length}
              label={t("patientIntel.stats.conditions")}
            />
            <StatCard
              icon={Pill}
              tone="success"
              value={profile.medications.length}
              label={t("patientIntel.stats.medications")}
            />
            <StatCard
              icon={AlertCircle}
              tone="warning"
              value={profile.followUps.length}
              label={t("patientIntel.stats.followUps")}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Health Timeline (episodes) */}
            <SectionCard title={t("patientIntel.sections.timeline")} icon={Calendar}>
              {profile.episodes.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.episodes.slice(0, 8).map((episode) => (
                    <div
                      key={episode.id}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {episode.label}
                        </p>
                        <ProvenanceBadge provenance={episode.provenance} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {fmtDate(episode.startDate)} – {fmtDate(episode.endDate)} ·{" "}
                        {formatMessage("patientIntel.episodes.eventCount", {
                          n: episode.events.length
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Active Conditions */}
            <SectionCard title={t("patientIntel.sections.conditions")} icon={Stethoscope}>
              {profile.conditions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.conditions.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {c.name}
                        </p>
                        <ProvenanceBadge provenance={c.provenance} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("patientIntel.conditions.firstMentioned")}: {fmtDate(c.firstMentioned)} ·{" "}
                        {t("patientIntel.conditions.lastMentioned")}: {fmtDate(c.lastMentioned)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatMessage("patientIntel.conditions.mentionedIn", {
                          n: c.recordIds.length
                        })}
                      </p>
                      {c.medicationNames.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {c.medicationNames.map((m, idx) => (
                            <Badge key={idx} tone="green">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Medication History */}
            <SectionCard title={t("patientIntel.sections.medications")} icon={Pill}>
              {profile.medications.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("patientIntel.medications.empty")}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.medications.map((m) => (
                    <div
                      key={m.name}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {m.name}
                        </p>
                        <Badge tone={m.currentStatus === "discontinued" ? "red" : "green"}>
                          {t(`patientIntel.medicationStatus.${m.currentStatus}`)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.events.map((e, idx) => (
                          <Badge key={idx} tone="gray">
                            {t(`patientIntel.medicationStatus.${e.type}`)} · {fmtDate(e.date)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Imaging History */}
            <SectionCard title={t("patientIntel.sections.imaging")} icon={Scan}>
              {profile.imaging.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("patientIntel.imaging.empty")}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.imaging.map((group) => (
                    <div
                      key={group.region}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {group.modality ? `${group.modality} — ${group.region}` : group.region}
                        </p>
                        <ProvenanceBadge provenance={group.provenance} />
                      </div>
                      <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                        {formatMessage("patientIntel.imaging.studyCount", {
                          n: group.studies.length
                        })}
                      </p>
                      <div className="flex flex-col gap-1">
                        {group.studies.map((s, idx) => (
                          <p key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                            {fmtDate(s.date)}
                            {s.impression ? ` — ${s.impression}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Procedure History */}
            <SectionCard title={t("patientIntel.sections.procedures")} icon={ClipboardList}>
              {profile.procedures.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("patientIntel.procedures.empty")}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.procedures.map((group) => (
                    <div
                      key={group.name}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {group.name}
                      </p>
                      <div className="flex flex-col gap-1">
                        {group.events.map((e, idx) => (
                          <p key={idx} className="text-xs text-gray-600 dark:text-gray-300">
                            {fmtDate(e.date)} — {e.outcome}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Vaccination History */}
            <SectionCard title={t("patientIntel.sections.vaccinations")} icon={Syringe}>
              {profile.vaccinations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("patientIntel.vaccinations.empty")}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {profile.vaccinations.map((v) => (
                    <div
                      key={v.name}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {v.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatMessage("patientIntel.vaccinations.doseCount", {
                          n: v.doses.length
                        })}
                      </p>
                      {v.upcoming && (
                        <p className="mt-1 text-xs text-warning-700 dark:text-warning-400">
                          {formatMessage("patientIntel.vaccinations.upcoming", {
                            note: v.upcoming.note,
                            date: fmtDate(v.upcoming.date)
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Outstanding Follow-ups */}
            <SectionCard title={t("patientIntel.sections.followUps")} icon={AlertCircle}>
              {profile.followUps.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("patientIntel.followUps.empty")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {profile.followUps.map((f, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-200">{f.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(f.date)}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Patient Insights */}
            <SectionCard title={t("patientIntel.sections.insights")} icon={Lightbulb}>
              {profile.insights.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("patientIntel.insights.empty")}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {profile.insights.map((insight, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-200"
                    >
                      <Badge tone="amber">{t("patientIntel.provenance.pattern")}</Badge>
                      <span>{insight.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            {/* Recent Records */}
            <SectionCard title={t("patientIntel.sections.recentRecords")} icon={FlaskConical}>
              <div className="flex flex-col gap-2">
                {profile.recentRecords.map((r) => (
                  <div
                    key={r.recordId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                  >
                    <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                      {r.title}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {fmtDate(r.date)}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Record Relationships */}
            <SectionCard title={t("patientIntel.sections.relationships")} icon={Link2}>
              {profile.links.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("patientIntel.relationships.empty")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatMessage("patientIntel.relationships.linkCount", {
                      n: profile.links.length
                    })}
                  </p>
                  {profile.links.slice(0, 8).map((link, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {formatMessage("patientIntel.relationships.reason", {
                          reason: link.reason
                        })}
                      </p>
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        {Math.round(link.confidence * 100)}% confidence
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {(profile.providers.length > 0 || profile.facilities.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-2">
              {profile.providers.length > 0 && (
                <SectionCard title={t("patientIntel.sections.providers")} icon={Users}>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.providers.map((p) => (
                      <Badge key={p} tone="blue">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </SectionCard>
              )}
              {profile.facilities.length > 0 && (
                <SectionCard title={t("patientIntel.sections.facilities")} icon={Building2}>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.facilities.map((f) => (
                      <Badge key={f} tone="gray">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </SectionCard>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

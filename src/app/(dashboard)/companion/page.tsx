"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Plus, Send, ShieldAlert, Sparkles, Trash2, User as UserIcon } from "lucide-react";
import { apiFetch } from "@/backend/lib/api-client";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { useEntitlements } from "@/frontend/components/providers/EntitlementsContext";
import { PlanGate } from "@/frontend/components/subscription/PlanGate";
import { AiConsentModal } from "@/frontend/components/lab-reports/AiConsentModal";
import { GlassCard } from "@/frontend/components/ui/GlassCard";
import { Button } from "@/frontend/components/ui/Button";
import { Badge } from "@/frontend/components/ui/Badge";
import { EmptyState } from "@/frontend/components/ui/EmptyState";
import { Select, Textarea } from "@/frontend/components/ui/Field";
import { cn } from "@/frontend/components/ui/cn";
import type { FamilyMember } from "@/backend/features/family-members/family-members.types";
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatSessionSummary
} from "@/backend/features/companion/companion.types";

export default function CompanionPage() {
  const { t } = useTranslation();
  const { hasFeature } = useEntitlements();
  const hasCompanion = hasFeature("ai_companion_chat");

  if (!hasCompanion) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("companion.title")}
        </h1>
        <PlanGate
          feature="ai_companion_chat"
          requiredPlanLabel={t("subscription.plans.individual.name")}
        >
          <></>
        </PlanGate>
      </div>
    );
  }

  return <CompanionChat />;
}

function CompanionChat() {
  const { t } = useTranslation();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [familyMemberId, setFamilyMemberId] = useState("");
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [grantingConsent, setGrantingConsent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<FamilyMember[]>("/family-members").then((res) => {
      if (res.success) setMembers(res.data ?? []);
    });
    loadSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadSessions() {
    const res = await apiFetch<ChatSessionSummary[]>("/companion/sessions");
    if (res.success) setSessions(res.data ?? []);
  }

  async function openSession(id: string) {
    setSessionId(id);
    setError(null);
    setLoadingMessages(true);
    const res = await apiFetch<ChatMessage[]>(`/companion/sessions/${id}/messages`);
    if (res.success) setMessages(res.data ?? []);
    setLoadingMessages(false);
  }

  function startNewChat() {
    setSessionId(null);
    setMessages([]);
    setError(null);
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await apiFetch(`/companion/sessions/${id}`, { method: "DELETE" });
    if (res.success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (sessionId === id) startNewChat();
    }
  }

  async function send(overrideMessage?: string) {
    const text = (overrideMessage ?? input).trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);

    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      sessionId: sessionId ?? "",
      role: "user",
      content: text,
      responseType: null,
      intent: null,
      sourcesJson: null,
      disclaimersJson: null,
      groundedness: null,
      modelUsed: null,
      redactionCount: null,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    const body: ChatRequest = {
      message: text,
      ...(sessionId ? { sessionId } : {}),
      ...(familyMemberId ? { familyMemberId } : {})
    };

    const res = await apiFetch<ChatResponse>("/companion/chat", {
      method: "POST",
      body: JSON.stringify(body)
    });

    setSending(false);

    if (!res.success || !res.data) {
      // Roll back the optimistic bubble so a failed send doesn't look like it went through.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setInput(text);
      if (res.message?.toLowerCase().includes("consent")) {
        setConsentOpen(true);
      } else {
        setError(res.message || t("common.error"));
      }
      return;
    }

    const reply = res.data;
    setSessionId(reply.sessionId);
    setMessages((prev) => [
      ...prev,
      {
        id: `reply-${Date.now()}`,
        sessionId: reply.sessionId,
        role: "assistant",
        content: reply.reply,
        responseType: reply.responseType,
        intent: null,
        sourcesJson: reply.sources,
        disclaimersJson: reply.disclaimers,
        groundedness: reply.groundedness,
        modelUsed: null,
        redactionCount: null,
        createdAt: new Date().toISOString()
      }
    ]);
    loadSessions();
  }

  async function grantConsentAndRetry() {
    setGrantingConsent(true);
    const res = await apiFetch("/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ aiConsent: true })
    });
    setGrantingConsent(false);
    if (!res.success) {
      setError(res.message || t("common.error"));
      return;
    }
    setConsentOpen(false);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) send(lastUser.content);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("companion.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("companion.subtitle")}</p>
        </div>
        {members.length > 0 && (
          <Select
            value={familyMemberId}
            onChange={(e) => {
              setFamilyMemberId(e.target.value);
              startNewChat();
            }}
            wrapClassName="mb-0 w-56"
          >
            <option value="">{t("companion.familyMemberSelf")}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        {/* Session list */}
        <GlassCard className="hidden w-64 flex-shrink-0 flex-col gap-3 overflow-y-auto md:flex">
          <Button variant="primary" size="sm" onClick={startNewChat} className="gap-1.5">
            <Plus size={15} /> {t("companion.newChat")}
          </Button>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {sessions.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                {t("companion.noSessions")}
              </p>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  sessionId === s.id
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                <span className="truncate">{s.title || t("companion.untitledChat")}</span>
                <Trash2
                  size={14}
                  className="flex-shrink-0 text-gray-300 opacity-0 hover:text-error-500 group-hover:opacity-100"
                  onClick={(e) => deleteSession(s.id, e)}
                />
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Chat pane */}
        <GlassCard className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 && !loadingMessages && (
              <EmptyState
                icon={Bot}
                title={t("companion.empty.title")}
                description={t("companion.empty.description")}
              />
            )}
            {loadingMessages && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
            )}
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {sending && <GeneratingIndicator />}
            </div>
            <div ref={bottomRef} />
          </div>

          <div className="flex-shrink-0 border-t border-gray-200 pt-4 dark:border-gray-800">
            {error && (
              <p className="mb-2 text-sm text-error-600 dark:text-error-400">{error}</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-3"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={t("companion.inputPlaceholder")}
                wrapClassName="mb-0 flex-1"
                className="min-h-[48px]"
                disabled={sending}
                maxLength={2000}
              />
              <Button type="submit" disabled={sending || !input.trim()} className="gap-1.5">
                <Send size={16} /> {t("companion.send")}
              </Button>
            </form>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <ShieldAlert size={12} /> {t("companion.disclaimer")}
            </p>
          </div>
        </GlassCard>
      </div>

      <AiConsentModal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onAllow={grantConsentAndRetry}
        loading={grantingConsent}
      />
    </div>
  );
}

function GeneratingIndicator() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300">
        <Sparkles size={15} />
      </span>
      <div className="flex max-w-[75%] items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2.5 text-sm leading-relaxed text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
        </span>
        {t("companion.generating")}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            : "bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300"
        )}
      >
        {isUser ? <UserIcon size={15} /> : <Sparkles size={15} />}
      </span>
      <div className={cn("flex max-w-[75%] flex-col gap-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
          )}
        >
          {message.content}
        </div>
        {!isUser && message.sourcesJson && message.sourcesJson.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sourcesJson.map((src, i) => (
              <Badge key={i} tone="blue">
                {src.label}
              </Badge>
            ))}
          </div>
        )}
        {!isUser && message.disclaimersJson && message.disclaimersJson.length > 0 && (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {message.disclaimersJson.join(" ")}
          </p>
        )}
      </div>
    </div>
  );
}

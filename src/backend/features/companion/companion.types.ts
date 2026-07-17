// Mirrors the AI Companion API contract — see
// swathya-rakshak/docs/ai-companion-chatbot-architecture.md §2.4 and
// swathya-rakshak-backend/app/Http/Controllers/CompanionController.php.

export interface ChatSource {
  type: string;
  id: string;
  label: string;
  date?: string | null;
}

export interface ChatRequest {
  sessionId?: string;
  familyMemberId?: string;
  message: string;
  sourceType?: "lab_report" | "medical_record" | "prescription";
  sourceId?: string;
}

// Response body of POST /companion/chat — the single assistant turn just generated.
export interface ChatResponse {
  sessionId: string;
  reply: string;
  responseType: "direct" | "generated";
  sources: ChatSource[];
  disclaimers: string[];
  groundedness: "full" | "partial" | "none";
}

// Row shape returned by GET /companion/sessions.
export interface ChatSessionSummary {
  id: string;
  familyMemberId: string | null;
  title: string | null;
  lastActivityAt: string;
  createdAt: string;
}

// Row shape returned by GET /companion/sessions/{id}/messages.
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  responseType: string | null;
  intent: string | null;
  sourcesJson: ChatSource[] | null;
  disclaimersJson: string[] | null;
  groundedness: string | null;
  modelUsed: string | null;
  redactionCount: number | null;
  createdAt: string;
}

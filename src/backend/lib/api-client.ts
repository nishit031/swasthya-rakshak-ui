import {
  getAccessToken,
  getRefreshToken,
  storeTokens,
  clearTokens
} from "@/backend/features/auth/auth.client";
import { apiUrl } from "@/backend/lib/api-url";

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
};

function redirectToLogin() {
  clearTokens();
  window.location.href = "/login";
}

// Shared across concurrent 401s so we only hit /auth/refresh once per expiry, not once per in-flight request.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(apiUrl("/api/v1/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
        if (!body.success || !body.data) return null;
        storeTokens(body.data.accessToken, body.data.refreshToken);
        return body.data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const isFormData = options.body instanceof FormData;

  const buildHeaders = (token: string | null) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };
    if (!isFormData) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  let res = await fetch(apiUrl(`/api/v1${path}`), {
    ...options,
    headers: buildHeaders(getAccessToken())
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      redirectToLogin();
      throw new Error("Unauthorized");
    }

    res = await fetch(apiUrl(`/api/v1${path}`), { ...options, headers: buildHeaders(newToken) });
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Unauthorized");
    }
  }

  // A server error can come back with an empty or non-JSON body; don't let res.json() throw a
  // SyntaxError that crashes the caller — surface it as a normal failed ApiResponse instead.
  return res.json().catch(() => ({
    success: false as const,
    message: `Request failed (HTTP ${res.status}).`,
    errors: []
  }));
}
